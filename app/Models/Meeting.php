<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Meeting extends Model
{
    protected $fillable = [
        'title',
        'description',
        'agenda',
        'created_by',
        'type',
        'scheduled_at',
        'duration',
        'location',
        'meeting_link',
        'google_event_id',
        'google_calendar_link',
        'status',
        'recurrence',
        'recurrence_end_date',
        'attachments',
        'notes',
        'recording_path',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'recurrence_end_date' => 'datetime',
            'attachments' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_participants')
            ->withPivot('role', 'rsvp_status', 'attended', 'joined_at', 'left_at')
            ->withTimestamps();
    }
}
