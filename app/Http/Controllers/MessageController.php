<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageRead;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function store(Request $request, Conversation $conversation)
    {
        // Verify user is participant
        if (!$conversation->participants()->where('user_id', auth()->id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'type' => 'required|in:text,voice,file,image,video',
            'content' => 'required_if:type,text|nullable|string|max:5000',
            'file' => 'required_if:type,voice,file,image,video|file|max:10240',
            'voice_duration' => 'nullable|numeric',
            'reply_to' => 'nullable|exists:messages,id',
        ]);

        $messageData = [
            'conversation_id' => $conversation->id,
            'user_id' => auth()->id(),
            'type' => $validated['type'],
            'content' => $validated['content'] ?? null,
            'reply_to' => $validated['reply_to'] ?? null,
        ];

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('messages/' . $conversation->id, 'public');

            $messageData['file_path'] = $path;
            $messageData['file_name'] = $file->getClientOriginalName();
            $messageData['file_type'] = $file->getClientMimeType();
            $messageData['file_size'] = $file->getSize();

            // For voice messages, store duration if provided
            if ($validated['type'] === 'voice' && $request->has('voice_duration')) {
                $messageData['voice_duration'] = $request->input('voice_duration');
            }
        }

        $message = Message::create($messageData);

        // Update conversation's last_message_at
        $conversation->update(['last_message_at' => now()]);

        // Mark as read for sender
        MessageRead::create([
            'message_id' => $message->id,
            'user_id' => auth()->id(),
        ]);

        // Broadcast message event to other participants
        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'message' => $message->load('user')
        ]);
    }

    public function markAsRead(Request $request, Message $message)
    {
        MessageRead::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => auth()->id(),
        ]);

        return response()->json(['success' => true]);
    }

    public function update(Request $request, Message $message)
    {
        // Only owner can edit
        if ($message->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Only text messages can be edited
        if ($message->type !== 'text') {
            abort(400, 'Only text messages can be edited');
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $message->update([
            'content' => $validated['content'],
            'is_edited' => true,
        ]);

        return response()->json(['message' => $message]);
    }

    public function destroy(Message $message)
    {
        // Only owner can delete
        if ($message->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Delete file if exists
        if ($message->file_path) {
            Storage::disk('public')->delete($message->file_path);
        }

        $message->update(['is_deleted' => true, 'content' => null]);

        return response()->json(['success' => true]);
    }

    public function addReaction(Request $request, Message $message)
    {
        $validated = $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $reactions = $message->reactions ?? [];
        $userId = auth()->id();

        // Add or update reaction
        $reactions[$userId] = $validated['emoji'];

        $message->update(['reactions' => $reactions]);

        return response()->json(['success' => true]);
    }

    public function removeReaction(Message $message)
    {
        $reactions = $message->reactions ?? [];
        $userId = auth()->id();

        unset($reactions[$userId]);

        $message->update(['reactions' => $reactions]);

        return response()->json(['success' => true]);
    }
}
