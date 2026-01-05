<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Department;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Project::with(['creator', 'manager', 'department', 'members'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($q) {
                $q->where('status', 'completed');
            }])
            ->forOrganization($user->organization_id);

        // Staff can only see projects they're part of
        if ($user->isStaff()) {
            $query->forUser($user->id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $projects = $query->latest()->paginate(12);

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => $request->only(['status', 'priority', 'search']),
            'statuses' => Project::statuses(),
            'priorities' => Project::priorities(),
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create()
    {
        $user = auth()->user();

        $users = User::where('organization_id', $user->organization_id)
            ->select('id', 'name', 'email', 'role')
            ->get();

        $departments = Department::where('organization_id', $user->organization_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Projects/Create', [
            'users' => $users,
            'departments' => $departments,
            'statuses' => Project::statuses(),
            'priorities' => Project::priorities(),
            'colors' => Project::colors(),
        ]);
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'department_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:users,id',
            'status' => ['required', Rule::in(array_keys(Project::statuses()))],
            'priority' => ['required', Rule::in(array_keys(Project::priorities()))],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:7',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $validated['organization_id'] = $user->organization_id;
        $validated['created_by'] = $user->id;

        // Remove member_ids from validated data before creating
        $memberIds = $validated['member_ids'] ?? [];
        unset($validated['member_ids']);

        $project = Project::create($validated);

        // Attach members
        if (!empty($memberIds)) {
            $project->members()->attach($memberIds, ['role' => 'member']);
        }

        // Notify manager if assigned
        if ($validated['manager_id'] && $validated['manager_id'] !== $user->id) {
            $manager = User::find($validated['manager_id']);
            if ($manager) {
                NotificationService::project(
                    $manager,
                    'Project Manager Assignment',
                    "You have been assigned as manager of the project: \"{$project->name}\"",
                    $project->id
                );
            }
        }

        // Notify members
        foreach ($memberIds as $memberId) {
            if ($memberId !== $user->id) {
                $member = User::find($memberId);
                if ($member) {
                    NotificationService::project(
                        $member,
                        'Added to Project',
                        "You have been added to the project: \"{$project->name}\"",
                        $project->id
                    );
                }
            }
        }

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project)
    {
        $user = auth()->user();

        // Authorization check
        if ($project->organization_id !== $user->organization_id) {
            abort(403);
        }

        $project->load(['creator', 'manager', 'department', 'members']);

        // Get project tasks with relationships
        $tasks = Task::with(['assignedUser', 'assignedByUser'])
            ->where('project_id', $project->id)
            ->latest()
            ->get();

        // Get available users for task assignment
        $users = User::where('organization_id', $user->organization_id)
            ->select('id', 'name', 'email', 'role')
            ->get();

        // Task statistics
        $taskStats = [
            'total' => $tasks->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'cancelled' => $tasks->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'tasks' => $tasks,
            'users' => $users,
            'taskStats' => $taskStats,
            'taskStatuses' => Task::statuses(),
            'taskPriorities' => Task::priorities(),
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project)
    {
        $user = auth()->user();

        // Authorization check
        if ($project->organization_id !== $user->organization_id) {
            abort(403);
        }

        $project->load(['members']);

        $users = User::where('organization_id', $user->organization_id)
            ->select('id', 'name', 'email', 'role')
            ->get();

        $departments = Department::where('organization_id', $user->organization_id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'users' => $users,
            'departments' => $departments,
            'statuses' => Project::statuses(),
            'priorities' => Project::priorities(),
            'colors' => Project::colors(),
        ]);
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, Project $project)
    {
        $user = auth()->user();

        // Authorization check
        if ($project->organization_id !== $user->organization_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'department_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:users,id',
            'status' => ['required', Rule::in(array_keys(Project::statuses()))],
            'priority' => ['required', Rule::in(array_keys(Project::priorities()))],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:7',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        // Remove member_ids from validated data
        $memberIds = $validated['member_ids'] ?? [];
        unset($validated['member_ids']);

        $project->update($validated);

        // Sync members
        if (isset($request->member_ids)) {
            $syncData = [];
            foreach ($memberIds as $memberId) {
                $syncData[$memberId] = ['role' => 'member'];
            }
            $project->members()->sync($syncData);
        }

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project)
    {
        $user = auth()->user();

        // Authorization check
        if ($project->organization_id !== $user->organization_id) {
            abort(403);
        }

        // Only creator, manager, or admin can delete
        if (!$user->canManageUsers() && $project->created_by !== $user->id) {
            abort(403);
        }

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    /**
     * Add a task to a project.
     */
    public function addTask(Request $request, Project $project)
    {
        $user = auth()->user();

        // Authorization check
        if ($project->organization_id !== $user->organization_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'assigned_to' => 'required|exists:users,id',
            'priority' => ['required', Rule::in(array_keys(Task::priorities()))],
            'due_date' => 'nullable|date',
        ]);

        $validated['organization_id'] = $user->organization_id;
        $validated['project_id'] = $project->id;
        $validated['department_id'] = $project->department_id;
        $validated['assigned_by'] = $user->id;
        $validated['status'] = 'pending';

        $task = Task::create($validated);

        // Notify assigned user
        $assignedUser = User::find($validated['assigned_to']);
        if ($assignedUser && $assignedUser->id !== $user->id) {
            NotificationService::task(
                $assignedUser,
                'New Task Assigned',
                "{$user->name} assigned you a task in project \"{$project->name}\": \"{$task->title}\"",
                $task->id
            );
        }

        return back()->with('success', 'Task added to project successfully.');
    }

    /**
     * Update task status within a project.
     */
    public function updateTaskStatus(Request $request, Project $project, Task $task)
    {
        $user = auth()->user();

        // Authorization check
        if ($project->organization_id !== $user->organization_id) {
            abort(403);
        }

        if ($task->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(array_keys(Task::statuses()))],
        ]);

        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        }

        $task->update($validated);

        return back()->with('success', 'Task status updated.');
    }

    /**
     * Get projects for dropdown/select.
     */
    public function list(Request $request)
    {
        $user = auth()->user();

        $projects = Project::where('organization_id', $user->organization_id)
            ->whereIn('status', ['planning', 'active'])
            ->select('id', 'name', 'color', 'status')
            ->orderBy('name')
            ->get();

        return response()->json($projects);
    }
}
