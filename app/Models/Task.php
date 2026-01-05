<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'organization_id',
        'assigned_to',
        'assigned_by',
        'department_id',
        'project_id',
        'priority',
        'status',
        'due_date',
        'completed_at',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
            'attachments' => 'array',
        ];
    }

    /**
     * Status options for tasks
     */
    public static function statuses(): array
    {
        return [
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];
    }

    /**
     * Priority options for tasks
     */
    public static function priorities(): array
    {
        return [
            'low' => 'Low',
            'medium' => 'Medium',
            'high' => 'High',
            'urgent' => 'Urgent',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the comments for this task.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    /**
     * Get root comments (not replies) for this task.
     */
    public function rootComments(): HasMany
    {
        return $this->hasMany(TaskComment::class)
            ->whereNull('parent_id')
            ->with('user', 'replies')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get the count of comments for this task.
     */
    public function getCommentsCountAttribute(): int
    {
        return $this->comments()->count();
    }

    // Scopes

    /**
     * Scope for organization's tasks
     */
    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Scope for project's tasks
     */
    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Scope for tasks without a project
     */
    public function scopeWithoutProject($query)
    {
        return $query->whereNull('project_id');
    }
}
