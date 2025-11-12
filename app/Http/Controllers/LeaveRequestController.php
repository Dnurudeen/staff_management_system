<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['user.department', 'approver']);

        // Staff can only see their own requests
        if (auth()->user()->isStaff()) {
            $query->where('user_id', auth()->user()->id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }

        // Filter by leave type
        if ($request->has('leave_type') && $request->leave_type !== 'all') {
            $query->where('leave_type', $request->leave_type);
        }

        $leaveRequests = $query->latest()->paginate(15);
        $users = User::where('role', 'staff')->get(['id', 'name']);

        return Inertia::render('LeaveRequests/Index', [
            'leaveRequests' => $leaveRequests,
            'users' => $users,
            'filters' => $request->only(['status', 'user_id', 'leave_type'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('LeaveRequests/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'leave_type' => ['required', Rule::in(['sick', 'vacation', 'personal', 'maternity', 'paternity', 'unpaid'])],
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:1000',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $validated['total_days'] = $startDate->diffInDays($endDate) + 1;
        $validated['user_id'] = auth()->user()->id;
        $validated['status'] = 'pending';

        LeaveRequest::create($validated);

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request submitted successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(LeaveRequest $leaveRequest)
    {
        // Check permission
        if ($leaveRequest->user_id !== auth()->user()->id && auth()->user()->isStaff()) {
            abort(403, 'Unauthorized action.');
        }

        $leaveRequest->load(['user.department', 'approver']);

        return Inertia::render('LeaveRequests/Show', [
            'leaveRequest' => $leaveRequest
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LeaveRequest $leaveRequest)
    {
        // Only allow editing pending requests
        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'Cannot edit a processed leave request.');
        }

        // Check permission
        if ($leaveRequest->user_id !== auth()->user()->id && auth()->user()->isStaff()) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('LeaveRequests/Edit', [
            'leaveRequest' => $leaveRequest
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        // Only allow editing pending requests
        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'Cannot edit a processed leave request.');
        }

        // Check permission
        if ($leaveRequest->user_id !== auth()->user()->id && auth()->user()->isStaff()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'leave_type' => ['required', Rule::in(['sick', 'vacation', 'personal', 'maternity', 'paternity', 'unpaid'])],
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:1000',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $validated['total_days'] = $startDate->diffInDays($endDate) + 1;

        $leaveRequest->update($validated);

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LeaveRequest $leaveRequest)
    {
        // Only allow deleting pending requests
        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'Cannot delete a processed leave request.');
        }

        // Check permission
        if ($leaveRequest->user_id !== auth()->user()->id && auth()->user()->isStaff()) {
            abort(403, 'Unauthorized action.');
        }

        $leaveRequest->delete();

        return redirect()->route('leave-requests.index')
            ->with('success', 'Leave request deleted successfully.');
    }

    /**
     * Approve leave request
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        // Only admins can approve
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized action.');
        }

        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'Leave request has already been processed.');
        }

        $validated = $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => auth()->user()->id,
            'approved_at' => now(),
            'admin_notes' => $validated['admin_notes'] ?? null,
        ]);

        // Send notification to user
        NotificationService::leave(
            $leaveRequest->user,
            'Leave Request Approved',
            'Your leave request from ' . $leaveRequest->start_date->format('M d') . ' to ' . $leaveRequest->end_date->format('M d, Y') . ' has been approved.',
            $leaveRequest->id
        );

        return back()->with('success', 'Leave request approved successfully.');
    }

    /**
     * Reject leave request
     */
    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        // Only admins can reject
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized action.');
        }

        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'Leave request has already been processed.');
        }

        $validated = $request->validate([
            'admin_notes' => 'required|string|max:500',
        ]);

        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => auth()->user()->id,
            'approved_at' => now(),
            'admin_notes' => $validated['admin_notes'],
        ]);

        // Send notification to user
        NotificationService::leave(
            $leaveRequest->user,
            'Leave Request Rejected',
            'Your leave request from ' . $leaveRequest->start_date->format('M d') . ' to ' . $leaveRequest->end_date->format('M d, Y') . ' has been rejected.',
            $leaveRequest->id
        );

        return back()->with('success', 'Leave request rejected.');
    }
}
