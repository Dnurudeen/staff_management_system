<?php

namespace App\Http\Controllers;

use App\Mail\InviteUserMail;
use App\Models\UserInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class InvitationController extends Controller
{
    /**
     * Display a listing of pending invitations.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = UserInvitation::where('organization_id', $user->organization_id)
            ->with(['inviter:id,name,email', 'department:id,name']);

        // Filter by status
        $status = $request->get('status', 'all');
        if ($status === 'pending') {
            $query->where('status', 'pending')
                ->where('expires_at', '>', now());
        } elseif ($status === 'expired') {
            $query->where(function ($q) {
                $q->where('expires_at', '<=', now())
                    ->orWhere('status', 'expired');
            });
        } elseif ($status === 'accepted') {
            $query->where('status', 'accepted');
        } elseif ($status === 'cancelled') {
            $query->where('status', 'cancelled');
        }

        // Search by email
        if ($search = $request->get('search')) {
            $query->where('email', 'like', "%{$search}%");
        }

        $invitations = $query->latest()->paginate(10)->withQueryString();

        // Add computed properties to each invitation
        $invitations->getCollection()->transform(function ($invitation) {
            $invitation->is_expired = $invitation->expires_at < now();
            $invitation->is_pending = $invitation->status === 'pending' && !$invitation->is_expired;
            $invitation->days_until_expiry = $invitation->is_expired
                ? 0
                : now()->diffInDays($invitation->expires_at, false);
            return $invitation;
        });

        // Get counts for filters
        $counts = [
            'all' => UserInvitation::where('organization_id', $user->organization_id)->count(),
            'pending' => UserInvitation::where('organization_id', $user->organization_id)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->count(),
            'expired' => UserInvitation::where('organization_id', $user->organization_id)
                ->where(function ($q) {
                    $q->where('expires_at', '<=', now())
                        ->orWhere('status', 'expired');
                })
                ->count(),
            'accepted' => UserInvitation::where('organization_id', $user->organization_id)
                ->where('status', 'accepted')
                ->count(),
            'cancelled' => UserInvitation::where('organization_id', $user->organization_id)
                ->where('status', 'cancelled')
                ->count(),
        ];

        return Inertia::render('Invitations/Index', [
            'invitations' => $invitations,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Resend an invitation email.
     */
    public function resend(UserInvitation $invitation)
    {
        $user = Auth::user();

        // Check authorization
        if ($invitation->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to resend this invitation.');
        }

        // Check if invitation is still valid
        if ($invitation->status !== 'pending') {
            return back()->with('error', 'This invitation has already been ' . $invitation->status . '.');
        }

        // Check organization employee limit
        $organization = $user->organization;
        if ($organization && !$organization->canAddEmployee()) {
            return back()->with('error', 'You have reached the maximum number of employees for your plan.');
        }

        // Regenerate token and extend expiry
        $invitation->update([
            'token' => UserInvitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        // Load relationships for email
        $invitation->load(['inviter', 'department']);

        // Generate new onboarding URL
        $onboardingUrl = route('onboarding.show', ['token' => $invitation->token]);

        try {
            Mail::to($invitation->email)->send(new InviteUserMail($invitation, $onboardingUrl));

            return back()->with('success', 'Invitation resent successfully to ' . $invitation->email);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to resend invitation email: ' . $e->getMessage());
        }
    }

    /**
     * Cancel an invitation.
     */
    public function cancel(UserInvitation $invitation)
    {
        $user = Auth::user();

        // Check authorization
        if ($invitation->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to cancel this invitation.');
        }

        // Check if invitation can be cancelled
        if ($invitation->status !== 'pending') {
            return back()->with('error', 'This invitation cannot be cancelled.');
        }

        $invitation->update(['status' => 'cancelled']);

        return back()->with('success', 'Invitation cancelled successfully.');
    }

    /**
     * Delete an invitation permanently.
     */
    public function destroy(UserInvitation $invitation)
    {
        $user = Auth::user();

        // Check authorization
        if ($invitation->organization_id !== $user->organization_id) {
            abort(403, 'You do not have permission to delete this invitation.');
        }

        // Only allow deletion of cancelled or expired invitations
        if ($invitation->status === 'pending' && $invitation->expires_at > now()) {
            return back()->with('error', 'Please cancel the invitation first before deleting.');
        }

        $invitation->delete();

        return back()->with('success', 'Invitation deleted successfully.');
    }
}
