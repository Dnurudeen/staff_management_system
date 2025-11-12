<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MeetingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $meetings = Meeting::with(['creator', 'participants'])
            ->whereHas('participants', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->orWhere('created_by', Auth::id())
            ->orderBy('scheduled_at', 'desc')
            ->get();

        $users = User::select('id', 'name', 'email', 'avatar')
            ->where('id', '!=', Auth::id())
            ->orderBy('name')
            ->get();

        return Inertia::render('Meetings/Index', [
            'meetings' => $meetings,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'agenda' => 'nullable|string',
            'type' => 'required|in:video,audio,in_person',
            'scheduled_at' => 'required|date|after:now',
            'duration' => 'required|integer|min:15',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
            'recurrence' => 'nullable|in:none,daily,weekly,monthly',
            'recurrence_end_date' => 'nullable|date|after:scheduled_at',
        ]);

        $meeting = Meeting::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'agenda' => $validated['agenda'] ?? null,
            'type' => $validated['type'],
            'scheduled_at' => $validated['scheduled_at'],
            'duration' => $validated['duration'],
            'location' => $validated['location'] ?? null,
            'meeting_link' => $validated['meeting_link'] ?? null,
            'created_by' => Auth::id(),
            'status' => 'scheduled',
            'recurrence' => $validated['recurrence'] ?? 'none',
            'recurrence_end_date' => $validated['recurrence_end_date'] ?? null,
        ]);

        // Add creator as a participant with host role
        $meeting->participants()->attach(Auth::id(), [
            'role' => 'host',
            'rsvp_status' => 'accepted',
        ]);

        // Add other participants
        foreach ($validated['participant_ids'] as $participantId) {
            if ($participantId != Auth::id()) {
                $meeting->participants()->attach($participantId, [
                    'role' => 'participant',
                    'rsvp_status' => 'pending',
                ]);
            }
        }

        return redirect()->route('meetings.index')->with('success', 'Meeting scheduled successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Meeting $meeting)
    {
        // Check if user is a participant
        if (!$meeting->participants()->where('user_id', Auth::id())->exists() && $meeting->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $meeting->load(['creator', 'participants']);

        return Inertia::render('Meetings/Show', [
            'meeting' => $meeting,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Meeting $meeting)
    {
        // Only creator can update
        if ($meeting->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'agenda' => 'nullable|string',
            'type' => 'required|in:video,audio,in_person',
            'scheduled_at' => 'required|date',
            'duration' => 'required|integer|min:15',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
            'recurrence' => 'nullable|in:none,daily,weekly,monthly',
            'recurrence_end_date' => 'nullable|date|after:scheduled_at',
        ]);

        $meeting->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'agenda' => $validated['agenda'] ?? null,
            'type' => $validated['type'],
            'scheduled_at' => $validated['scheduled_at'],
            'duration' => $validated['duration'],
            'location' => $validated['location'] ?? null,
            'meeting_link' => $validated['meeting_link'] ?? null,
            'recurrence' => $validated['recurrence'] ?? 'none',
            'recurrence_end_date' => $validated['recurrence_end_date'] ?? null,
        ]);

        // Sync participants (preserve host)
        $participantsData = [Auth::id() => ['role' => 'host', 'rsvp_status' => 'accepted']];

        foreach ($validated['participant_ids'] as $participantId) {
            if ($participantId != Auth::id()) {
                // Preserve existing RSVP status if participant already exists
                $existingParticipant = $meeting->participants()->where('user_id', $participantId)->first();
                $rsvpStatus = $existingParticipant ? $existingParticipant->pivot->rsvp_status : 'pending';

                $participantsData[$participantId] = [
                    'role' => 'participant',
                    'rsvp_status' => $rsvpStatus,
                ];
            }
        }

        $meeting->participants()->sync($participantsData);

        return redirect()->route('meetings.index')->with('success', 'Meeting updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Meeting $meeting)
    {
        // Only creator can delete
        if ($meeting->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $meeting->delete();

        return redirect()->route('meetings.index')->with('success', 'Meeting cancelled successfully!');
    }

    /**
     * Handle RSVP for a meeting
     */
    public function rsvp(Request $request, Meeting $meeting)
    {
        $validated = $request->validate([
            'status' => 'required|in:accepted,declined,maybe',
        ]);

        // Check if user is a participant
        if (!$meeting->participants()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $meeting->participants()->updateExistingPivot(Auth::id(), [
            'rsvp_status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'RSVP updated successfully!');
    }

    /**
     * Mark attendance for a meeting
     */
    public function markAttendance(Request $request, Meeting $meeting)
    {
        $validated = $request->validate([
            'attended' => 'required|boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        // Only creator can mark attendance
        if ($meeting->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $meeting->participants()->updateExistingPivot($validated['user_id'], [
            'attended' => $validated['attended'],
        ]);

        return redirect()->back()->with('success', 'Attendance marked successfully!');
    }

    /**
     * Join a meeting (track join time)
     */
    public function join(Meeting $meeting)
    {
        // Check if user is a participant
        if (!$meeting->participants()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $meeting->participants()->updateExistingPivot(Auth::id(), [
            'joined_at' => now(),
            'attended' => true,
        ]);

        if ($meeting->meeting_link) {
            return redirect()->away($meeting->meeting_link);
        }

        return redirect()->route('meetings.show', $meeting)->with('info', 'Meeting link not available yet.');
    }

    /**
     * Leave a meeting (track leave time)
     */
    public function leave(Meeting $meeting)
    {
        // Check if user is a participant
        if (!$meeting->participants()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $meeting->participants()->updateExistingPivot(Auth::id(), [
            'left_at' => now(),
        ]);

        return redirect()->route('meetings.index')->with('success', 'Left meeting successfully!');
    }

    /**
     * Update meeting status
     */
    public function updateStatus(Request $request, Meeting $meeting)
    {
        // Only creator can update status
        if ($meeting->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'status' => 'required|in:scheduled,ongoing,completed,cancelled',
        ]);

        $meeting->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Meeting status updated successfully!');
    }

    /**
     * Add meeting notes
     */
    public function addNotes(Request $request, Meeting $meeting)
    {
        // Check if user is a participant or creator
        if (!$meeting->participants()->where('user_id', Auth::id())->exists() && $meeting->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $meeting->update([
            'notes' => $validated['notes'],
        ]);

        return redirect()->back()->with('success', 'Meeting notes added successfully!');
    }
}
