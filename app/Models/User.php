<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'date_of_birth',
        'email',
        'password',
        'role',
        'status',
        'department_id',
        'organization_id',
        'phone',
        'avatar',
        'bio',
        'bank_name',
        'account_number',
        'account_name',
        'presence_status',
        'custom_status',
        'last_seen_at',
        'is_online',
        'google_access_token',
        'google_refresh_token',
        'google_token_expires_at',
        'subscription_plan',
        'subscription_expires_at',
        'is_paid',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_access_token',
        'google_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
            'date_of_birth' => 'date',
            'is_online' => 'boolean',
            'is_paid' => 'boolean',
            'google_token_expires_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
        ];
    }

    // Role helper methods
    public function isPrimeAdmin(): bool
    {
        return $this->role === 'prime_admin';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    public function canManageUsers(): bool
    {
        return $this->isPrimeAdmin() || $this->isAdmin();
    }

    // Organization helper methods
    public function hasFeature(string $feature): bool
    {
        return $this->organization?->hasFeature($feature) ?? false;
    }

    public function getOrganizationPlan(): ?string
    {
        return $this->organization?->subscription_plan;
    }

    public function isOrganizationOwner(): bool
    {
        return $this->organization?->owner_id === $this->id;
    }

    // Relationships
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function ownedOrganization(): HasMany
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_by');
    }

    public function performanceReviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class);
    }

    public function givenReviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class, 'reviewer_id');
    }

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_user')
            ->withPivot('role', 'is_muted', 'is_archived', 'joined_at')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function calls(): HasMany
    {
        return $this->hasMany(Call::class, 'initiated_by');
    }

    public function callParticipations(): HasMany
    {
        return $this->hasMany(CallParticipant::class);
    }

    public function meetings(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_participants')
            ->withPivot('role', 'rsvp_status', 'attended', 'joined_at', 'left_at')
            ->withTimestamps();
    }

    public function createdMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'created_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Check if user has connected their Google account
     */
    public function hasGoogleConnected(): bool
    {
        return !empty($this->google_refresh_token);
    }

    /**
     * Check if Google access token is expired
     */
    public function isGoogleTokenExpired(): bool
    {
        if (!$this->google_token_expires_at) {
            return true;
        }
        return $this->google_token_expires_at->isPast();
    }
}
