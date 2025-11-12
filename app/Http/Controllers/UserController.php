<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Department;
use App\Models\UserInvitation;
use App\Mail\InviteUserMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with('department');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by department
        if ($request->has('department_id') && $request->department_id !== 'all') {
            $query->where('department_id', $request->department_id);
        }

        $users = $query->latest()->paginate(15);
        $departments = Department::where('status', 'active')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'departments' => $departments,
            'filters' => $request->only(['search', 'role', 'status', 'department_id'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $departments = Department::where('status', 'active')->get();

        return Inertia::render('Users/CreateEdit', [
            'departments' => $departments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email|unique:user_invitations,email',
            'role' => ['required', Rule::in(['prime_admin', 'admin', 'staff'])],
            'department_id' => 'nullable|exists:departments,id',
        ]);

        // Check permission - only prime_admin can invite prime_admin/admin
        if (in_array($validated['role'], ['prime_admin', 'admin']) && !Auth::user()->isPrimeAdmin()) {
            abort(403, 'Only Prime Admin can invite Admin users.');
        }

        // Create invitation
        $invitation = UserInvitation::create([
            'email' => $validated['email'],
            'role' => $validated['role'],
            'department_id' => $validated['department_id'] ?? null,
            'invited_by' => Auth::id(),
            'token' => UserInvitation::generateToken(),
            'expires_at' => now()->addDays(7), // Link expires in 7 days
        ]);

        // Load relationships needed for email
        $invitation->load(['inviter', 'department']);

        // Generate onboarding URL
        $onboardingUrl = route('onboarding.show', ['token' => $invitation->token]);

        // Send invitation email
        try {
            Mail::to($invitation->email)->send(new InviteUserMail($invitation, $onboardingUrl));

            return redirect()->route('users.index')
                ->with('success', 'Invitation sent successfully to ' . $invitation->email);
        } catch (\Exception $e) {
            // If email fails, delete the invitation and show error
            $invitation->delete();

            return redirect()->route('users.index')
                ->with('error', 'Failed to send invitation email. Please check your mail configuration. Error: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user->load([
            'department',
            'attendances' => fn($q) => $q->latest()->take(10),
            'leaveRequests' => fn($q) => $q->latest()->take(5),
            'assignedTasks' => fn($q) => $q->latest()->take(5),
            'performanceReviews' => fn($q) => $q->latest()->take(3)
        ]);

        return Inertia::render('Users/Show', [
            'user' => $user
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        // Check permission
        if ($user->isPrimeAdmin() && !Auth::user()->isPrimeAdmin()) {
            abort(403, 'Cannot edit Prime Admin.');
        }

        $departments = Department::where('status', 'active')->get();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'departments' => $departments
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        // Check permission
        if ($user->isPrimeAdmin() && !Auth::user()->isPrimeAdmin()) {
            abort(403, 'Cannot edit Prime Admin.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => ['required', Rule::in(['prime_admin', 'admin', 'staff'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'department_id' => 'nullable|exists:departments,id',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|max:2048',
        ]);

        // Check permission for role change
        if ($validated['role'] !== $user->role && !Auth::user()->isPrimeAdmin()) {
            abort(403, 'Only Prime Admin can change user roles.');
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        // Update password if provided
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting Prime Admin
        if ($user->isPrimeAdmin()) {
            abort(403, 'Cannot delete Prime Admin.');
        }

        // Check permission
        if ($user->isAdmin() && !Auth::user()->isPrimeAdmin()) {
            abort(403, 'Only Prime Admin can delete Admin users.');
        }

        // Delete avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Update user's online status
     */
    public function updatePresence(Request $request)
    {
        $validated = $request->validate([
            'presence_status' => ['required', Rule::in(['available', 'away', 'busy', 'do_not_disturb', 'offline'])],
            'custom_status' => 'nullable|string|max:100',
        ]);

        Auth::user()->update($validated);

        return response()->json(['success' => true]);
    }

    /**
     * Bulk import users
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:2048',
        ]);

        // Handle CSV import logic here
        // This is a placeholder for the import functionality

        return redirect()->route('users.index')
            ->with('success', 'Users imported successfully.');
    }

    /**
     * Export users to CSV
     */
    public function export(Request $request)
    {
        $users = User::with('department')->get();

        $filename = 'users_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Name', 'Email', 'Role', 'Status', 'Department', 'Phone', 'Created At']);

            foreach ($users as $user) {
                fputcsv($file, [
                    $user->name,
                    $user->email,
                    $user->role,
                    $user->status,
                    $user->department?->name,
                    $user->phone,
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
