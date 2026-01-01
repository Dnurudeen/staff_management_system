<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\PerformanceReviewController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\GoogleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Onboarding routes (guest accessible)
Route::get('/onboarding/{token}', [OnboardingController::class, 'show'])->name('onboarding.show');
Route::post('/onboarding/{token}', [OnboardingController::class, 'complete'])->name('onboarding.complete');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management (Admin & Prime Admin only)
    Route::middleware(['role:prime_admin,admin'])->group(function () {
        Route::resource('users', UserController::class);
        Route::post('users/import', [UserController::class, 'import'])->name('users.import');
        Route::get('users/export', [UserController::class, 'export'])->name('users.export');

        // Departments
        Route::resource('departments', DepartmentController::class);

        // Leave Requests - Approval
        Route::post('leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])
            ->name('leave-requests.approve');
        Route::post('leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])
            ->name('leave-requests.reject');

        // Performance Reviews
        Route::resource('performance-reviews', PerformanceReviewController::class);

        // Attendance Management
        Route::get('attendance/report', [AttendanceController::class, 'report'])->name('attendance.report');
    });

    // Attendance
    Route::resource('attendance', AttendanceController::class);
    Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn'])->name('attendance.clock-in');
    Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut'])->name('attendance.clock-out');

    // Leave Requests
    Route::resource('leave-requests', LeaveRequestController::class);

    // Tasks
    Route::resource('tasks', TaskController::class);
    Route::get('tasks/board/kanban', [TaskController::class, 'kanban'])->name('tasks.kanban');
    Route::post('tasks/{task}/update-status', [TaskController::class, 'updateTaskStatus'])->name('tasks.update-status');


    // Chat & Messaging
    Route::prefix('conversations')->group(function () {
        Route::get('/', [ConversationController::class, 'index'])->name('conversations.index');
        Route::post('/private', [ConversationController::class, 'createPrivate'])->name('conversations.create-private');
        Route::post('/group', [ConversationController::class, 'createGroup'])->name('conversations.create-group');
        Route::get('/{conversation}', [ConversationController::class, 'show'])->name('conversations.show');
        Route::post('/{conversation}/mute', [ConversationController::class, 'toggleMute'])->name('conversations.toggle-mute');
        Route::post('/{conversation}/archive', [ConversationController::class, 'toggleArchive'])->name('conversations.toggle-archive');
    });

    // Messages
    Route::prefix('conversations/{conversation}/messages')->group(function () {
        Route::post('/', [MessageController::class, 'store'])->name('messages.store');
        Route::put('/{message}', [MessageController::class, 'update'])->name('messages.update');
        Route::delete('/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');
        Route::post('/{message}/read', [MessageController::class, 'markAsRead'])->name('messages.mark-read');
        Route::post('/{message}/react', [MessageController::class, 'addReaction'])->name('messages.react');
        Route::delete('/{message}/react', [MessageController::class, 'removeReaction'])->name('messages.unreact');
    });

    // Meetings
    Route::resource('meetings', MeetingController::class);
    Route::post('meetings/{meeting}/rsvp', [MeetingController::class, 'rsvp'])->name('meetings.rsvp');
    Route::post('meetings/{meeting}/join', [MeetingController::class, 'join'])->name('meetings.join');
    Route::post('meetings/{meeting}/leave', [MeetingController::class, 'leave'])->name('meetings.leave');
    Route::post('meetings/{meeting}/attendance', [MeetingController::class, 'markAttendance'])->name('meetings.attendance');
    Route::post('meetings/{meeting}/status', [MeetingController::class, 'updateStatus'])->name('meetings.status');
    Route::post('meetings/{meeting}/notes', [MeetingController::class, 'addNotes'])->name('meetings.notes');

    // Google Calendar Integration
    Route::prefix('google')->group(function () {
        Route::get('/redirect', [GoogleController::class, 'redirect'])->name('google.redirect');
        Route::get('/callback', [GoogleController::class, 'callback'])->name('google.callback');
        Route::post('/disconnect', [GoogleController::class, 'disconnect'])->name('google.disconnect');
        Route::get('/status', [GoogleController::class, 'status'])->name('google.status');
    });

    // Reports
    Route::get('reports', [DashboardController::class, 'reports'])->name('reports.index');
    Route::get('reports/export', [DashboardController::class, 'exportReport'])->name('reports.export');

    // Calendar
    Route::get('calendar', [DashboardController::class, 'calendar'])->name('calendar.index');

    // User Presence
    Route::post('users/presence', [UserController::class, 'updatePresence'])->name('users.update-presence');

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('/read/all', [NotificationController::class, 'deleteAllRead'])->name('notifications.delete-all-read');
    });
});

require __DIR__ . '/auth.php';
