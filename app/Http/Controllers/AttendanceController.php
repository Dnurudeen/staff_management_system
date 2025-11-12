<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        } else {
            // For admin/prime admin, show all records
            $query = Attendance::with('user.department');

            // Filter by user
            if ($request->has('user_id') && $request->user_id !== 'all') {
                $query->where('user_id', $request->user_id);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->where('date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->where('date', '<=', $request->end_date);
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $attendance = $query->latest('date')->paginate(20);
        }

        $users = User::where('role', 'staff')->get(['id', 'name']);

        return Inertia::render('Attendance/Index', [
            'attendances' => $attendance,
            'todayAttendance' => $todayAttendance,
            'attendance' => $attendance,
            'users' => $users,
            'filters' => $request->only(['user_id', 'start_date', 'end_date', 'status'])
        ]);
    }

    /**
     * Clock in
     */
    public function clockIn(Request $request)
    {
        $user = auth()->user();
        $today = now()->toDateString();

        // Check if already clocked in today
        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existing) {
            return back()->with('error', 'You have already clocked in today.');
        }

        $clockIn = now();
        $workStartTime = now()->setTime(9, 0, 0); // 9:00 AM
        $isLate = $clockIn->greaterThan($workStartTime);

        Attendance::create([
            'user_id' => $user->id,
            'date' => $today,
            'clock_in' => $clockIn,
            'is_late' => $isLate,
            'status' => 'present',
        ]);

        return back()->with('success', 'Clocked in successfully.');
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

        // Check if late (after 9:00 AM)
        $workStartTime = $date->copy()->setTime(9, 0, 0);
        $validated['is_late'] = Carbon::parse($validated['clock_in'])->greaterThan($workStartTime);

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

        // Check if late
        $workStartTime = $date->copy()->setTime(9, 0, 0);
        $validated['is_late'] = Carbon::parse($validated['clock_in'])->greaterThan($workStartTime);

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
}
