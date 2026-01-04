<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Department::with(['head', 'users', 'members'])
            ->where('organization_id', $user->organization_id);

        // Search
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Count both legacy users and many-to-many members
        $departments = $query->withCount(['users', 'members'])->latest()->paginate(15)->withQueryString();

        // Add combined count for each department
        $departments->getCollection()->transform(function ($department) {
            // Get unique user IDs from both relationships
            $legacyUserIds = $department->users->pluck('id')->toArray();
            $memberIds = $department->members->pluck('id')->toArray();
            $allMemberIds = array_unique(array_merge($legacyUserIds, $memberIds));
            $department->users_count = count($allMemberIds);
            return $department;
        });

        return Inertia::render('Departments/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'status'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = Auth::user();

        // Get users from the same organization who can be department heads
        $users = User::where('organization_id', $user->organization_id)
            ->whereIn('role', ['prime_admin', 'admin', 'staff'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('Departments/CreateEdit', [
            'users' => $users,
            'department' => null,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departments')->where(function ($query) use ($user) {
                    return $query->where('organization_id', $user->organization_id);
                }),
            ],
            'description' => 'nullable|string|max:1000',
            'head_id' => 'nullable|exists:users,id',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        // Add organization_id
        $validated['organization_id'] = $user->organization_id;

        $department = Department::create($validated);

        return redirect()->route('departments.index')
            ->with('success', 'Department/Team created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Department $department)
    {
        $user = Auth::user();

        // Ensure department belongs to user's organization
        if ($department->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to view this department.');
        }

        $department->load([
            'head',
            'users' => fn($q) => $q->with('attendances')->latest(),
            'tasks' => fn($q) => $q->latest()->take(10)
        ]);

        return Inertia::render('Departments/Show', [
            'department' => $department
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Department $department)
    {
        $user = Auth::user();

        // Ensure department belongs to user's organization
        if ($department->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to edit this department.');
        }

        $users = User::where('organization_id', $user->organization_id)
            ->whereIn('role', ['prime_admin', 'admin', 'staff'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('Departments/CreateEdit', [
            'department' => $department,
            'users' => $users
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Department $department)
    {
        $user = Auth::user();

        // Ensure department belongs to user's organization
        if ($department->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to update this department.');
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departments')->where(function ($query) use ($user) {
                    return $query->where('organization_id', $user->organization_id);
                })->ignore($department->id),
            ],
            'description' => 'nullable|string|max:1000',
            'head_id' => 'nullable|exists:users,id',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $department->update($validated);

        return redirect()->route('departments.index')
            ->with('success', 'Department/Team updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {
        $user = Auth::user();

        // Ensure department belongs to user's organization
        if ($department->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to delete this department.');
        }

        // Check if department has users (both legacy and many-to-many)
        $hasLegacyUsers = $department->users()->count() > 0;
        $hasMembers = $department->members()->count() > 0;

        if ($hasLegacyUsers || $hasMembers) {
            return redirect()->route('departments.index')
                ->with('error', 'Cannot delete department/team with assigned members.');
        }

        $department->delete();

        return redirect()->route('departments.index')
            ->with('success', 'Department/Team deleted successfully.');
    }
}
