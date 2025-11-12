<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'user_id',
        'type',
        'content',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'voice_duration',
        'reply_to',
        'is_edited',
        'is_deleted',
        'reactions',
    ];

    protected function casts(): array
    {
        return [
            'is_edited' => 'boolean',
            'is_deleted' => 'boolean',
            'reactions' => 'array',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replyToMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }
}
