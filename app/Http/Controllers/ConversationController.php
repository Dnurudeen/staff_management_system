<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function index()
    {
        $conversations = auth()->user()->conversations()
            ->with(['participants', 'lastMessage.user'])
            ->latest('last_message_at')
            ->get();

        // Get all users except current user for creating new conversations
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'email', 'avatar', 'role', 'department_id')
            ->with('department:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'users' => $users,
        ]);
    }

    public function createPrivate(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|different:' . auth()->id(),
        ]);

        $existing = Conversation::where('type', 'private')
            ->whereHas('participants', fn($q) => $q->where('user_id', $validated['user_id']))
            ->whereHas('participants', fn($q) => $q->where('user_id', auth()->id()))
            ->first();

        if ($existing) {
            return response()->json(['conversation' => $existing]);
        }

        $conversation = Conversation::create([
            'type' => 'private',
            'created_by' => auth()->id(),
        ]);

        $conversation->participants()->attach([
            auth()->id() => ['role' => 'member'],
            $validated['user_id'] => ['role' => 'member'],
        ]);

        return response()->json(['conversation' => $conversation->load('participants')]);
    }

    public function createGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|max:2048',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $conversation = Conversation::create([
            'type' => 'group',
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_by' => auth()->id(),
        ]);

        if ($request->hasFile('avatar')) {
            $conversation->avatar = $request->file('avatar')->store('group-avatars', 'public');
            $conversation->save();
        }

        $participants = [auth()->id() => ['role' => 'admin']];
        foreach ($validated['participant_ids'] as $userId) {
            if ($userId != auth()->id()) {
                $participants[$userId] = ['role' => 'member'];
            }
        }

        $conversation->participants()->attach($participants);

        return response()->json(['conversation' => $conversation->load('participants')]);
    }

    public function show(Conversation $conversation)
    {
        if (!$conversation->participants()->where('user_id', auth()->id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $conversations = auth()->user()->conversations()
            ->with(['participants', 'lastMessage.user'])
            ->latest('last_message_at')
            ->get();

        $messages = $conversation->messages()
            ->with(['user', 'reads'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Get all users except current user for creating new conversations
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'email', 'avatar', 'role', 'department_id')
            ->with('department:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'activeConversation' => $conversation->load('participants'),
            'messages' => $messages,
            'users' => $users,
        ]);
    }

    public function toggleMute(Conversation $conversation)
    {
        $participant = $conversation->participants()->where('user_id', auth()->id())->first();
        if (!$participant) abort(403, 'Unauthorized');

        $conversation->participants()->updateExistingPivot(auth()->id(), [
            'is_muted' => !$participant->pivot->is_muted
        ]);

        return response()->json(['success' => true]);
    }
}
