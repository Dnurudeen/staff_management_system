<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'role',
        'department_id',
        'organization_id',
        'invited_by',
        'token',
        'status',
        'expires_at',
        'accepted_at',
        'user_id',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    /**
     * Generate a unique token for the invitation
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Get the user who sent the invitation
     */
    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Get the department for this invitation
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the organization for this invitation
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user created from this invitation
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the invitation is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    /**
     * Check if the invitation is accepted
     */
    public function isAccepted(): bool
    {
        return !is_null($this->accepted_at);
    }

    /**
     * Check if the invitation is still valid
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isAccepted();
    }

    /**
     * Mark the invitation as accepted
     */
    public function markAsAccepted(User $user)
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
            'user_id' => $user->id,
        ]);
    }

    /**
     * Mark the invitation as cancelled
     */
    public function markAsCancelled()
    {
        $this->update([
            'status' => 'cancelled',
        ]);
    }
}
