<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    /**
     * Display the onboarding form
     */
    public function show($token)
    {
        $invitation = UserInvitation::where('token', $token)->first();

        // Check if invitation exists
        if (!$invitation) {
            return Inertia::render('Onboarding/InvalidInvitation', [
                'message' => 'Invalid invitation link. Please contact your administrator.'
            ]);
        }

        // Check if invitation is expired
        if ($invitation->isExpired()) {
            return Inertia::render('Onboarding/InvalidInvitation', [
                'message' => 'This invitation has expired. Please request a new invitation from your administrator.'
            ]);
        }

        // Check if invitation is already accepted
        if ($invitation->isAccepted()) {
            return redirect()->route('login')->with('info', 'This invitation has already been used. Please log in with your credentials.');
        }

        return Inertia::render('Onboarding/Complete', [
            'invitation' => $invitation->load(['department', 'inviter', 'organization']),
            'token' => $token
        ]);
    }

    /**
     * Complete the onboarding process
     */
    public function complete(Request $request, $token)
    {
        $invitation = UserInvitation::where('token', $token)->first();

        // Validate invitation
        if (!$invitation || !$invitation->isValid()) {
            return back()->withErrors(['token' => 'Invalid or expired invitation.']);
        }

        // Check if organization can add more employees
        if ($invitation->organization && !$invitation->organization->canAddEmployee()) {
            return back()->withErrors(['organization' => 'The organization has reached its maximum employee limit. Please contact the administrator.']);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        // Create the user with organization_id
        $user = User::create([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $invitation->email,
            'password' => Hash::make($validated['password']),
            'role' => $invitation->role,
            'status' => 'active',
            'department_id' => $invitation->department_id,
            'organization_id' => $invitation->organization_id, // Assign to same organization as inviter
            'date_of_birth' => $validated['date_of_birth'],
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_name' => $validated['account_name'],
            'phone' => $validated['phone'] ?? null,
        ]);

        // Mark invitation as accepted
        $invitation->markAsAccepted($user);

        // Log the user in
        Auth::login($user);

        return redirect()->route('dashboard')->with('success', 'Welcome! Your account has been created successfully.');
    }
}
