<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;

class TaskCommentController extends Controller
{
    /**
     * Get all comments for a task.
     */
    public function index(Task $task)
    {
        $user = auth()->user();

        // Check if user has access to this task
        if (!$this->canAccessTask($task, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $comments = $task->rootComments()
            ->with(['user:id,name,avatar,role', 'replies.user:id,name,avatar,role'])
            ->get();

        return response()->json([
            'comments' => $comments,
            'total' => $task->comments()->count(),
        ]);
    }

    /**
     * Store a new comment.
     */
    public function store(Request $request, Task $task)
    {
        $user = auth()->user();

        // Check if user has access to this task
        if (!$this->canAccessTask($task, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'parent_id' => 'nullable|exists:task_comments,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => [
                File::types(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'])
                    ->max(10 * 1024), // 10MB max
            ],
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('task-comments/' . $task->id, 'public');
                $attachmentPaths[] = [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ];
            }
        }

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
            'attachments' => $attachmentPaths ?: null,
            'mentions' => $validated['mentions'] ?? null,
        ]);

        // Load relationships
        $comment->load('user:id,name,avatar,role');

        // Send notifications
        $this->sendCommentNotifications($comment, $task, $user);

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => $comment,
        ], 201);
    }

    /**
     * Update a comment.
     */
    public function update(Request $request, Task $task, TaskComment $comment)
    {
        $user = auth()->user();

        // Only comment author can edit
        if ($comment->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
        ]);

        // Track new mentions
        $oldMentions = $comment->mentions ?? [];
        $newMentions = $validated['mentions'] ?? [];
        $addedMentions = array_diff($newMentions, $oldMentions);

        $comment->update([
            'content' => $validated['content'],
            'mentions' => $newMentions ?: null,
        ]);

        // Notify newly mentioned users
        if (!empty($addedMentions)) {
            $this->sendMentionNotifications($comment, $task, $user, $addedMentions);
        }

        $comment->load('user:id,name,avatar,role');

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment,
        ]);
    }

    /**
     * Delete a comment.
     */
    public function destroy(Task $task, TaskComment $comment)
    {
        $user = auth()->user();

        // Only comment author or task owner/admin can delete
        $canDelete = $comment->user_id === $user->id
            || $task->assigned_by === $user->id
            || $user->isAdmin();

        if (!$canDelete) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete attachments from storage
        if (!empty($comment->attachments)) {
            foreach ($comment->attachments as $attachment) {
                Storage::disk('public')->delete($attachment['path']);
            }
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }

    /**
     * Upload attachments to an existing comment.
     */
    public function uploadAttachments(Request $request, Task $task, TaskComment $comment)
    {
        $user = auth()->user();

        // Only comment author can add attachments
        if ($comment->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'attachments' => 'required|array|max:5',
            'attachments.*' => [
                File::types(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'])
                    ->max(10 * 1024),
            ],
        ]);

        $existingAttachments = $comment->attachments ?? [];
        $newAttachments = [];

        foreach ($request->file('attachments') as $file) {
            $path = $file->store('task-comments/' . $task->id, 'public');
            $newAttachments[] = [
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ];
        }

        $comment->update([
            'attachments' => array_merge($existingAttachments, $newAttachments),
        ]);

        return response()->json([
            'message' => 'Attachments uploaded successfully',
            'attachments' => $comment->attachments,
        ]);
    }

    /**
     * Delete a specific attachment from a comment.
     */
    public function deleteAttachment(Request $request, Task $task, TaskComment $comment)
    {
        $user = auth()->user();

        // Only comment author can delete attachments
        if ($comment->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'attachment_path' => 'required|string',
        ]);

        $attachments = $comment->attachments ?? [];
        $attachmentPath = $validated['attachment_path'];

        // Find and remove the attachment
        $filteredAttachments = array_filter($attachments, function ($attachment) use ($attachmentPath) {
            return $attachment['path'] !== $attachmentPath;
        });

        if (count($filteredAttachments) === count($attachments)) {
            return response()->json(['error' => 'Attachment not found'], 404);
        }

        // Delete from storage
        Storage::disk('public')->delete($attachmentPath);

        $comment->update([
            'attachments' => array_values($filteredAttachments) ?: null,
        ]);

        return response()->json([
            'message' => 'Attachment deleted successfully',
        ]);
    }

    /**
     * Check if user can access the task.
     */
    private function canAccessTask(Task $task, $user): bool
    {
        // User is assigned to the task
        if ($task->assigned_to === $user->id) {
            return true;
        }

        // User assigned the task
        if ($task->assigned_by === $user->id) {
            return true;
        }

        // User is admin
        if ($user->isAdmin()) {
            return true;
        }

        // User is in the same organization
        if ($task->organization_id === $user->organization_id) {
            return true;
        }

        return false;
    }

    /**
     * Send notifications for a new comment.
     */
    private function sendCommentNotifications(TaskComment $comment, Task $task, $author): void
    {
        $notifiedUserIds = [$author->id];

        // Notify task assignee
        if ($task->assigned_to && $task->assigned_to !== $author->id) {
            $assignee = User::find($task->assigned_to);
            if ($assignee) {
                NotificationService::taskComment(
                    $assignee,
                    'New Comment on Task',
                    "{$author->name} commented on task: \"{$task->title}\"",
                    $task->id,
                    $comment->id
                );
                $notifiedUserIds[] = $assignee->id;
            }
        }

        // Notify task creator if different
        if ($task->assigned_by && $task->assigned_by !== $author->id && !in_array($task->assigned_by, $notifiedUserIds)) {
            $creator = User::find($task->assigned_by);
            if ($creator) {
                NotificationService::taskComment(
                    $creator,
                    'New Comment on Task',
                    "{$author->name} commented on task: \"{$task->title}\"",
                    $task->id,
                    $comment->id
                );
                $notifiedUserIds[] = $creator->id;
            }
        }

        // If this is a reply, notify the parent comment author
        if ($comment->parent_id) {
            $parentComment = TaskComment::find($comment->parent_id);
            if ($parentComment && $parentComment->user_id !== $author->id && !in_array($parentComment->user_id, $notifiedUserIds)) {
                $parentAuthor = User::find($parentComment->user_id);
                if ($parentAuthor) {
                    NotificationService::taskComment(
                        $parentAuthor,
                        'Reply to Your Comment',
                        "{$author->name} replied to your comment on task: \"{$task->title}\"",
                        $task->id,
                        $comment->id
                    );
                    $notifiedUserIds[] = $parentAuthor->id;
                }
            }
        }

        // Notify mentioned users
        if (!empty($comment->mentions)) {
            $this->sendMentionNotifications($comment, $task, $author, $comment->mentions, $notifiedUserIds);
        }
    }

    /**
     * Send notifications for mentioned users.
     */
    private function sendMentionNotifications(TaskComment $comment, Task $task, $author, array $mentionIds, array $excludeIds = []): void
    {
        $mentionIds = array_diff($mentionIds, $excludeIds, [$author->id]);

        foreach ($mentionIds as $userId) {
            $mentionedUser = User::find($userId);
            if ($mentionedUser) {
                NotificationService::taskMention(
                    $mentionedUser,
                    'You Were Mentioned',
                    "{$author->name} mentioned you in a comment on task: \"{$task->title}\"",
                    $task->id,
                    $comment->id
                );
            }
        }
    }
}
