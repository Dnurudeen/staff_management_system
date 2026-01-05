<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\Department;
use App\Models\Project;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function create()
    {
        $organizationId = auth()->user()->organization_id;

        $users = User::where('organization_id', $organizationId)
            ->select('id', 'name', 'role')
            ->get();
        $departments = Department::where('organization_id', $organizationId)
            ->select('id', 'name')
            ->get();
        $projects = Project::where('organization_id', $organizationId)
            ->whereIn('status', ['planning', 'active'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tasks/Create', [
            'users' => $users,
            'departments' => $departments,
            'projects' => $projects,
        ]);
    }

    public function index(Request $request)
    {
        $query = Task::with(['assignedUser', 'assignedByUser', 'department', 'project']);

        if (auth()->user()->isStaff()) {
            $query->where('assigned_to', auth()->user()->id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $tasks = $query->latest()->paginate(15);
        $users = User::where('role', 'staff')->get(['id', 'name']);

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'users' => $users,
            'filters' => $request->only(['status', 'priority'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'assigned_to' => 'required|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'project_id' => 'nullable|exists:projects,id',
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'due_date' => 'nullable|date|after_or_equal:today',
        ]);

        $validated['assigned_by'] = auth()->user()->id;
        $validated['status'] = 'pending';
        $validated['organization_id'] = auth()->user()->organization_id;

        $task = Task::create($validated);

        // Send notification to assigned user
        $assignedUser = User::find($validated['assigned_to']);
        if ($assignedUser && $assignedUser->id !== auth()->user()->id) {
            NotificationService::task(
                $assignedUser,
                'New Task Assigned',
                auth()->user()->name . ' assigned you a new task: "' . $task->title . '"',
                $task->id
            );
        }

        return redirect()->route('tasks.index')
            ->with('success', 'Task created successfully.');
    }

    public function edit(Task $task)
    {
        $organizationId = auth()->user()->organization_id;

        $task->load(['assignedUser', 'assignedByUser', 'department', 'project']);
        $users = User::where('organization_id', $organizationId)
            ->select('id', 'name', 'role')
            ->get();
        $departments = Department::where('organization_id', $organizationId)
            ->select('id', 'name')
            ->get();
        $projects = Project::where('organization_id', $organizationId)
            ->whereIn('status', ['planning', 'active'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'users' => $users,
            'departments' => $departments,
            'projects' => $projects,
        ]);
    }

    public function show(Task $task)
    {
        $task->load(['assignedUser', 'assignedByUser', 'department', 'project']);
        return Inertia::render('Tasks/Show', ['task' => $task]);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'project_id' => 'nullable|exists:projects,id',
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['required', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'due_date' => 'nullable|date',
        ]);

        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        }

        $task->update($validated);
        return redirect()->route('tasks.index')->with('success', 'Task updated successfully.');
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return redirect()->route('tasks.index')->with('success', 'Task deleted successfully.');
    }

    public function kanban(Request $request)
    {
        $query = Task::with(['assignedUser', 'assignedByUser', 'department']);

        if (auth()->user()->isStaff()) {
            $query->where('assigned_to', auth()->user()->id);
        }

        $tasks = $query->latest()->get();

        return Inertia::render('Tasks/Kanban', [
            'tasks' => $tasks,
        ]);
    }

    public function updateTaskStatus(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'in_progress', 'completed'])],
        ]);

        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        }

        $task->update($validated);

        return back()->with('success', 'Task status updated successfully.');
    }
}
