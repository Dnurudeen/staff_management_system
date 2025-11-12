<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Department;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Task;
use App\Models\PerformanceReview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $data = [];

        if ($user->isPrimeAdmin()) {
            // Prime Admin Dashboard
            $data = [
                'total_users' => User::count(),
                'total_admins' => User::where('role', 'admin')->count(),
                'total_staff' => User::where('role', 'staff')->count(),
                'active_users' => User::where('status', 'active')->count(),
                'total_departments' => Department::count(),
                'today_attendance' => Attendance::whereDate('date', today())->count(),
                'pending_leaves' => LeaveRequest::where('status', 'pending')->count(),
                'active_tasks' => Task::whereIn('status', ['pending', 'in_progress'])->count(),
                'recent_activities' => [], // Activity logs
                'user_stats' => User::select('role')
                    ->selectRaw('count(*) as count')
                    ->groupBy('role')
                    ->get(),
            ];
        } elseif ($user->isAdmin()) {
            // Admin Dashboard
            $data = [
                'total_staff' => User::where('role', 'staff')->count(),
                'my_department_staff' => User::where('department_id', $user->department_id)->count(),
                'today_attendance' => Attendance::whereDate('date', today())->count(),
                'pending_leaves' => LeaveRequest::where('status', 'pending')->count(),
                'active_tasks' => Task::whereIn('status', ['pending', 'in_progress'])->count(),
                'my_tasks' => Task::where('assigned_by', $user->id)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->count(),
            ];
        } else {
            // Staff Dashboard
            $data = [
                'my_attendance_this_month' => Attendance::where('user_id', $user->id)
                    ->whereMonth('date', now()->month)
                    ->count(),
                'my_pending_tasks' => Task::where('assigned_to', $user->id)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->count(),
                'my_completed_tasks' => Task::where('assigned_to', $user->id)
                    ->where('status', 'completed')
                    ->whereMonth('created_at', now()->month)
                    ->count(),
                'my_leave_balance' => $this->calculateLeaveBalance($user),
                'my_pending_leaves' => LeaveRequest::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->count(),
                'my_upcoming_tasks' => Task::where('assigned_to', $user->id)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->orderBy('due_date')
                    ->take(5)
                    ->get(),
            ];
        }

        return Inertia::render('Dashboard', [
            'stats' => $data,
            'user' => $user->load('department'),
        ]);
    }

    private function calculateLeaveBalance($user)
    {
        // Default annual leave days
        $annualLeave = 20;

        // Calculate used leave days this year
        $usedDays = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereYear('start_date', now()->year)
            ->sum('total_days');

        return $annualLeave - $usedDays;
    }

    public function reports(Request $request)
    {
        $user = auth()->user();

        // Generate report data
        $reportData = [
            'attendance' => $this->getAttendanceData($request),
            'leaves' => $this->getLeaveData($request),
            'tasks' => $this->getTaskData($request),
            'departments' => $this->getDepartmentData($request),
            'performance' => $this->getPerformanceData($request),
            'metrics' => [
                'attendanceRate' => $this->calculateAttendanceRate(),
                'activeTasks' => Task::whereIn('status', ['pending', 'in_progress'])->count(),
                'avgPerformance' => PerformanceReview::avg('rating') ?? 0,
                'totalEmployees' => User::where('status', 'active')->count(),
            ],
        ];

        return Inertia::render('Reports/Index', [
            'reportData' => $reportData,
        ]);
    }

    public function calendar(Request $request)
    {
        $user = auth()->user();
        $query = collect();

        // Get attendance records
        $attendance = Attendance::with('user')
            ->when(!$user->isPrimeAdmin() && !$user->isAdmin(), function ($q) use ($user) {
                return $q->where('user_id', $user->id);
            })
            ->whereDate('date', '>=', now()->subMonths(1))
            ->get()
            ->map(function ($item) {
                return array_merge($item->toArray(), ['type' => 'attendance']);
            });

        // Get leave requests
        $leaves = LeaveRequest::with('user')
            ->where('status', 'approved')
            ->when(!$user->isPrimeAdmin() && !$user->isAdmin(), function ($q) use ($user) {
                return $q->where('user_id', $user->id);
            })
            ->where('start_date', '>=', now()->subMonths(1))
            ->get()
            ->map(function ($item) {
                return array_merge($item->toArray(), ['type' => 'leaves']);
            });

        // Get meetings
        $meetings = \App\Models\Meeting::with('organizer', 'participants')
            ->where('scheduled_at', '>=', now()->subMonths(1))
            ->get()
            ->map(function ($item) {
                return array_merge($item->toArray(), ['type' => 'meetings', 'meeting_type' => $item->type]);
            });

        // Get tasks
        $tasks = Task::with('assignedUser')
            ->when(!$user->isPrimeAdmin() && !$user->isAdmin(), function ($q) use ($user) {
                return $q->where('assigned_to', $user->id);
            })
            ->whereNotNull('due_date')
            ->where('due_date', '>=', now()->subMonths(1))
            ->get()
            ->map(function ($item) {
                return array_merge($item->toArray(), ['type' => 'tasks']);
            });

        $events = $attendance->concat($leaves)->concat($meetings)->concat($tasks);

        return Inertia::render('Calendar/Index', [
            'events' => $events,
        ]);
    }

    public function exportReport(Request $request)
    {
        // TODO: Implement PDF/Excel export
        return response()->json(['message' => 'Export feature coming soon']);
    }

    private function getAttendanceData($request)
    {
        $dates = [];
        $present = [];
        $late = [];
        $absent = [];

        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dates[] = $date->format('M d');

            $dayStats = Attendance::whereDate('date', $date)->get();
            $present[] = $dayStats->where('status', 'present')->count();
            $late[] = $dayStats->where('status', 'late')->count();
            $absent[] = User::where('status', 'active')->count() - $dayStats->count();
        }

        return [
            'dates' => $dates,
            'present' => $present,
            'late' => $late,
            'absent' => $absent,
            'details' => [], // Detailed attendance records
        ];
    }

    private function getLeaveData($request)
    {
        return [
            'byType' => [
                LeaveRequest::where('leave_type', 'sick')->count(),
                LeaveRequest::where('leave_type', 'casual')->count(),
                LeaveRequest::where('leave_type', 'annual')->count(),
                LeaveRequest::where('leave_type', 'emergency')->count(),
            ],
        ];
    }

    private function getTaskData($request)
    {
        $months = [];
        $completed = [];
        $inProgress = [];
        $pending = [];

        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $months[] = $month->format('M');

            $completed[] = Task::where('status', 'completed')
                ->whereMonth('created_at', $month->month)
                ->count();
            $inProgress[] = Task::where('status', 'in_progress')
                ->whereMonth('created_at', $month->month)
                ->count();
            $pending[] = Task::where('status', 'pending')
                ->whereMonth('created_at', $month->month)
                ->count();
        }

        return [
            'months' => $months,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'pending' => $pending,
        ];
    }

    private function getDepartmentData($request)
    {
        $departments = Department::withCount('users')->get();

        return [
            'names' => $departments->pluck('name')->toArray(),
            'performance' => $departments->pluck('users_count')->toArray(),
        ];
    }

    private function getPerformanceData($request)
    {
        $reviews = PerformanceReview::with('user', 'reviewer')->latest()->get();

        $ratingDistribution = [
            $reviews->where('rating', 5)->count(),
            $reviews->where('rating', 4)->count(),
            $reviews->where('rating', 3)->count(),
            $reviews->where('rating', 2)->count(),
            $reviews->where('rating', 1)->count(),
        ];

        $topPerformers = PerformanceReview::with('user.department')
            ->selectRaw('user_id, AVG(rating) as avg_rating, COUNT(*) as review_count')
            ->groupBy('user_id')
            ->orderBy('avg_rating', 'desc')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->user->name,
                    'department' => $item->user->department->name ?? 'N/A',
                    'rating' => round($item->avg_rating, 1),
                    'reviews' => $item->review_count,
                ];
            });

        return [
            'ratingDistribution' => $ratingDistribution,
            'topPerformers' => $topPerformers,
        ];
    }

    private function calculateAttendanceRate()
    {
        $totalUsers = User::where('status', 'active')->count();
        $presentToday = Attendance::whereDate('date', today())->count();

        return $totalUsers > 0 ? round(($presentToday / $totalUsers) * 100, 1) : 0;
    }
}
