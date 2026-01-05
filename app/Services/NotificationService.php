<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification for a user.
     */
    public static function create(User $user, string $type, string $title, string $message, array $data = [])
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // Broadcast the notification
        broadcast(new NotificationCreated($notification))->toOthers();

        return $notification;
    }

    /**
     * Create notifications for multiple users.
     */
    public static function createForMany(array $users, string $type, string $title, string $message, array $data = [])
    {
        $notifications = [];

        foreach ($users as $user) {
            $notifications[] = self::create($user, $type, $title, $message, $data);
        }

        return $notifications;
    }

    /**
     * Create a meeting notification.
     */
    public static function meeting(User $user, string $title, string $message, int $meetingId)
    {
        return self::create($user, 'meeting', $title, $message, [
            'meeting_id' => $meetingId,
            'url' => route('meetings.index'),
        ]);
    }

    /**
     * Create a task notification.
     */
    public static function task(User $user, string $title, string $message, int $taskId)
    {
        return self::create($user, 'task', $title, $message, [
            'task_id' => $taskId,
            'url' => route('tasks.index'),
        ]);
    }

    /**
     * Create a leave request notification.
     */
    public static function leave(User $user, string $title, string $message, int $leaveRequestId)
    {
        return self::create($user, 'leave', $title, $message, [
            'leave_request_id' => $leaveRequestId,
            'url' => route('leave-requests.index'),
        ]);
    }

    /**
     * Create an attendance notification.
     */
    public static function attendance(User $user, string $title, string $message)
    {
        return self::create($user, 'attendance', $title, $message, [
            'url' => route('attendance.index'),
        ]);
    }

    /**
     * Create a project notification.
     */
    public static function project(User $user, string $title, string $message, int $projectId)
    {
        return self::create($user, 'project', $title, $message, [
            'project_id' => $projectId,
            'url' => route('projects.show', $projectId),
        ]);
    }

    /**
     * Create a general notification.
     */
    public static function general(User $user, string $title, string $message, array $data = [])
    {
        return self::create($user, 'general', $title, $message, $data);
    }

    /**
     * Create a task comment notification.
     */
    public static function taskComment(User $user, string $title, string $message, int $taskId, int $commentId)
    {
        return self::create($user, 'task_comment', $title, $message, [
            'task_id' => $taskId,
            'comment_id' => $commentId,
            'url' => route('tasks.show', $taskId),
        ]);
    }

    /**
     * Create a mention notification.
     */
    public static function taskMention(User $user, string $title, string $message, int $taskId, int $commentId)
    {
        return self::create($user, 'mention', $title, $message, [
            'task_id' => $taskId,
            'comment_id' => $commentId,
            'url' => route('tasks.show', $taskId),
        ]);
    }
}
