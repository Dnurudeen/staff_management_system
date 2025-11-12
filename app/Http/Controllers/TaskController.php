<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function create()
    {
        $users = User::select('id', 'name', 'role')->get();
        $departments = Department::select('id', 'name')->get();

        return Inertia::render('Tasks/Create', [
            'users' => $users,
            'departments' => $departments,
        ]);
    }

    public function index(Request $request)
    {
        $query = Task::with(['assignedUser', 'assignedByUser', 'department']);

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
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'due_date' => 'nullable|date|after_or_equal:today',
        ]);

        $validated['assigned_by'] = auth()->user()->id;
        $validated['status'] = 'pending';

        Task::create($validated);

        return redirect()->route('tasks.index')
            ->with('success', 'Task created successfully.');
    }

    public function edit(Task $task)
    {
        $task->load(['assignedUser', 'assignedByUser', 'department']);
        $users = User::select('id', 'name', 'role')->get();
        $departments = Department::select('id', 'name')->get();

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'users' => $users,
            'departments' => $departments,
        ]);
    }

    public function show(Task $task)
    {
        $task->load(['assignedUser', 'assignedByUser', 'department']);
        return Inertia::render('Tasks/Show', ['task' => $task]);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
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
