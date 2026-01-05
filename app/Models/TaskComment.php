<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskComment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'task_id',
        'user_id',
        'parent_id',
        'content',
        'attachments',
        'mentions',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'mentions' => 'array',
        ];
    }

    /**
     * Get the task that owns the comment.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who created the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent comment (if this is a reply).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(TaskComment::class, 'parent_id');
    }

    /**
     * Get the replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(TaskComment::class, 'parent_id')->with('user', 'replies')->orderBy('created_at', 'asc');
    }

    /**
     * Get mentioned users.
     */
    public function mentionedUsers()
    {
        if (empty($this->mentions)) {
            return collect();
        }

        return User::whereIn('id', $this->mentions)->get();
    }

    /**
     * Check if the comment is a reply.
     */
    public function isReply(): bool
    {
        return $this->parent_id !== null;
    }

    /**
     * Get the number of attachments.
     */
    public function getAttachmentCountAttribute(): int
    {
        return is_array($this->attachments) ? count($this->attachments) : 0;
    }

    /**
     * Scope for root comments (not replies).
     */
    public function scopeRootComments($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope for a specific task.
     */
    public function scopeForTask($query, $taskId)
    {
        return $query->where('task_id', $taskId);
    }
}
