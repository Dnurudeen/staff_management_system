<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// User notification channel
Broadcast::channel('users.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Private conversation channel
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    return $conversation && $conversation->participants()->where('user_id', $user->id)->exists();
});

// Presence channel for online users
Broadcast::channel('online', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar' => $user->avatar,
    ];
});

// Typing indicator channel
Broadcast::channel('conversation.{conversationId}.typing', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    return $conversation && $conversation->participants()->where('user_id', $user->id)->exists();
});

// Call channel
Broadcast::channel('call.{callId}', function ($user, $callId) {
    // Add authorization logic for calls
    return true; // For now, allow all authenticated users
});

// Meeting channel
Broadcast::channel('meeting.{meetingId}', function ($user, $meetingId) {
    // Add authorization logic for meetings
    return true; // For now, allow all authenticated users
});
