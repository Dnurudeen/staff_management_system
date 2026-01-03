<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $organization = $user->organization;

        // Get today's attendance for the current user
        $todayAttendance = Attendance::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->first();

        // Get user's recent attendance records
        if ($user->isStaff()) {
            $attendance = Attendance::where('user_id', $user->id)
                ->orderBy('date', 'desc')
                ->take(10)
                ->get();

            $allStaffAttendance = null;
            $users = [];
        } else {
            // For admin/prime admin, show own attendance
            $attendance = Attendance::where('user_id', $user->id)
                ->orderBy('date', 'desc')
                ->take(10)
                ->get();

            // Also get all staff attendance for oversight
            $query = Attendance::with('user:id,name,email,department_id,avatar')
                ->whereHas('user', function ($q) use ($user) {
                    $q->where('organization_id', $user->organization_id);
                });

            // Filter by user
            if ($request->has('user_id') && $request->user_id !== 'all') {
                $query->where('user_id', $request->user_id);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->start_date) {
                $query->where('date', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date) {
                $query->where('date', '<=', $request->end_date);
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                if ($request->status === 'late') {
                    $query->where('is_late', true);
                } elseif ($request->status === 'on_time') {
                    $query->where('is_late', false)->whereNotNull('clock_in');
                } else {
                    $query->where('status', $request->status);
                }
            }

            // Filter by today only
            if ($request->has('today') && $request->today === 'true') {
                $query->where('date', now()->toDateString());
            }

            $allStaffAttendance = $query->latest('date')->latest('clock_in')->paginate(15)->withQueryString();

            // Get all users in organization for filter dropdown
            $users = User::where('organization_id', $user->organization_id)
                ->select('id', 'name', 'role')
                ->orderBy('name')
                ->get();
        }

        // Working hours settings
        $workingHours = $organization ? [
            'start_time' => $organization->work_start_time ?? '09:00:00',
            'end_time' => $organization->work_end_time ?? '17:00:00',
            'late_threshold' => $organization->late_threshold_minutes ?? 15,
            'work_days' => $organization->work_days ?? [1, 2, 3, 4, 5],
            'formatted_start' => $organization->getFormattedWorkStartTime(),
            'formatted_end' => $organization->getFormattedWorkEndTime(),
        ] : null;

        // Today's stats for admin
        $todayStats = null;
        if (!$user->isStaff()) {
            $todayStats = $this->getTodayStats($user->organization_id);
        }

        return Inertia::render('Attendance/Index', [
            'todayAttendance' => $todayAttendance,
            'attendance' => $attendance,
            'allStaffAttendance' => $allStaffAttendance,
            'users' => $users,
            'filters' => $request->only(['user_id', 'start_date', 'end_date', 'status', 'today']),
            'workingHours' => $workingHours,
            'todayStats' => $todayStats,
            'isAdmin' => !$user->isStaff(),
        ]);
    }

    /**
     * Get today's attendance stats
     */
    private function getTodayStats($organizationId)
    {
        $today = now()->toDateString();

        $totalEmployees = User::where('organization_id', $organizationId)->count();

        $todayAttendances = Attendance::whereHas('user', function ($q) use ($organizationId) {
            $q->where('organization_id', $organizationId);
        })->where('date', $today);

        $clockedIn = (clone $todayAttendances)->count();
        $onTime = (clone $todayAttendances)->where('is_late', false)->count();
        $late = (clone $todayAttendances)->where('is_late', true)->count();
        $clockedOut = (clone $todayAttendances)->whereNotNull('clock_out')->count();

        return [
            'total_employees' => $totalEmployees,
            'clocked_in' => $clockedIn,
            'not_clocked_in' => $totalEmployees - $clockedIn,
            'on_time' => $onTime,
            'late' => $late,
            'clocked_out' => $clockedOut,
            'still_working' => $clockedIn - $clockedOut,
        ];
    }

    /**
     * Clock in
     */
    public function clockIn(Request $request)
    {
        $user = auth()->user();
        $organization = $user->organization;
        $today = now()->toDateString();

        // Check if already clocked in today
        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existing) {
            return back()->with('error', 'You have already clocked in today.');
        }

        $clockIn = now();

        // Determine if late based on organization settings
        $isLate = false;
        if ($organization) {
            $isLate = $organization->isClockInLate($clockIn);
        } else {
            // Fallback to 9:00 AM if no organization
            $workStartTime = now()->setTime(9, 0, 0);
            $isLate = $clockIn->greaterThan($workStartTime);
        }

        Attendance::create([
            'user_id' => $user->id,
            'date' => $today,
            'clock_in' => $clockIn,
            'is_late' => $isLate,
            'status' => 'present',
        ]);

        $message = $isLate
            ? 'Clocked in successfully. Note: You clocked in late.'
            : 'Clocked in successfully.';

        return back()->with('success', $message);
    }

    /**
     * Clock out
     */
    public function clockOut(Request $request)
    {
        $user = auth()->user();
        $today = now()->toDateString();

        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return back()->with('error', 'No active clock-in found for today.');
        }

        $clockOut = now();
        $clockIn = Carbon::parse($attendance->clock_in);

        // Calculate total hours with minutes precision (e.g., 8.5 hours)
        $totalMinutes = $clockIn->diffInMinutes($clockOut);
        $totalHours = round($totalMinutes / 60, 2);

        $attendance->update([
            'clock_out' => $clockOut,
            'total_hours' => $totalHours,
        ]);

        return back()->with('success', 'Clocked out successfully.');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $organization = $user->organization;

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'clock_in' => 'required',
            'clock_out' => 'nullable|after:clock_in',
            'status' => 'required|in:present,absent,half_day,on_leave',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check for duplicate
        $existing = Attendance::where('user_id', $validated['user_id'])
            ->where('date', $validated['date'])
            ->first();

        if ($existing) {
            return back()->with('error', 'Attendance record already exists for this date.');
        }

        // Parse clock_in and clock_out as full datetime
        $date = Carbon::parse($validated['date']);
        $validated['clock_in'] = $date->copy()->setTimeFromTimeString($validated['clock_in']);

        // Calculate total hours if clock_out is provided
        if (!empty($validated['clock_out'])) {
            $validated['clock_out'] = $date->copy()->setTimeFromTimeString($validated['clock_out']);

            $clockIn = Carbon::parse($validated['clock_in']);
            $clockOut = Carbon::parse($validated['clock_out']);
            $totalMinutes = $clockIn->diffInMinutes($clockOut);
            $validated['total_hours'] = round($totalMinutes / 60, 2);
        }

        // Check if late based on organization settings
        if ($organization) {
            $validated['is_late'] = $organization->isClockInLate($validated['clock_in']);
        } else {
            $workStartTime = $date->copy()->setTime(9, 0, 0);
            $validated['is_late'] = Carbon::parse($validated['clock_in'])->greaterThan($workStartTime);
        }

        Attendance::create($validated);

        return redirect()->route('attendance.index')
            ->with('success', 'Attendance record created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Attendance $attendance)
    {
        $attendance->load('user.department');

        return Inertia::render('Attendance/Show', [
            'attendance' => $attendance
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Attendance $attendance)
    {
        $user = auth()->user();
        $organization = $user->organization;

        $validated = $request->validate([
            'clock_in' => 'required',
            'clock_out' => 'nullable|after:clock_in',
            'status' => 'required|in:present,absent,half_day,on_leave',
            'notes' => 'nullable|string|max:500',
        ]);

        // Parse times with the attendance date
        $date = Carbon::parse($attendance->date);
        $validated['clock_in'] = $date->copy()->setTimeFromTimeString($validated['clock_in']);

        // Calculate total hours if clock_out is provided
        if (!empty($validated['clock_out'])) {
            $validated['clock_out'] = $date->copy()->setTimeFromTimeString($validated['clock_out']);

            $clockIn = Carbon::parse($validated['clock_in']);
            $clockOut = Carbon::parse($validated['clock_out']);
            $totalMinutes = $clockIn->diffInMinutes($clockOut);
            $validated['total_hours'] = round($totalMinutes / 60, 2);
        } else {
            $validated['clock_out'] = null;
            $validated['total_hours'] = null;
        }

        // Check if late based on organization settings
        if ($organization) {
            $validated['is_late'] = $organization->isClockInLate($validated['clock_in']);
        } else {
            $workStartTime = $date->copy()->setTime(9, 0, 0);
            $validated['is_late'] = Carbon::parse($validated['clock_in'])->greaterThan($workStartTime);
        }

        $attendance->update($validated);

        return redirect()->route('attendance.index')
            ->with('success', 'Attendance record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return redirect()->route('attendance.index')
            ->with('success', 'Attendance record deleted successfully.');
    }

    /**
     * Get attendance report
     */
    public function report(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->endOfMonth()->toDateString();

        $stats = [
            'total_present' => Attendance::whereBetween('date', [$startDate, $endDate])
                ->where('status', 'present')->count(),
            'total_absent' => Attendance::whereBetween('date', [$startDate, $endDate])
                ->where('status', 'absent')->count(),
            'total_late' => Attendance::whereBetween('date', [$startDate, $endDate])
                ->where('is_late', true)->count(),
            'average_hours' => Attendance::whereBetween('date', [$startDate, $endDate])
                ->avg('total_hours'),
        ];

        $userStats = Attendance::select(
            'user_id',
            DB::raw('COUNT(*) as total_days'),
            DB::raw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present_days'),
            DB::raw('SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as late_days'),
            DB::raw('AVG(total_hours) as avg_hours')
        )
            ->whereBetween('date', [$startDate, $endDate])
            ->with('user:id,name,department_id')
            ->groupBy('user_id')
            ->get();

        return Inertia::render('Attendance/Report', [
            'stats' => $stats,
            'userStats' => $userStats,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    /**
     * Update working hours settings (Prime Admin only)
     */
    public function updateWorkingHours(Request $request)
    {
        $user = auth()->user();

        // Only prime_admin can update working hours
        if (!$user->isPrimeAdmin()) {
            abort(403, 'Only Prime Admin can update working hours settings.');
        }

        $validated = $request->validate([
            'work_start_time' => 'required|date_format:H:i',
            'work_end_time' => 'required|date_format:H:i|after:work_start_time',
            'late_threshold_minutes' => 'required|integer|min:0|max:60',
            'work_days' => 'required|array|min:1',
            'work_days.*' => 'integer|min:1|max:7',
        ]);

        $organization = $user->organization;

        if (!$organization) {
            return back()->with('error', 'Organization not found.');
        }

        $organization->update([
            'work_start_time' => $validated['work_start_time'] . ':00',
            'work_end_time' => $validated['work_end_time'] . ':00',
            'late_threshold_minutes' => $validated['late_threshold_minutes'],
            'work_days' => $validated['work_days'],
        ]);

        return back()->with('success', 'Working hours updated successfully.');
    }
}
