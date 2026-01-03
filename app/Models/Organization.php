<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'owner_id',
        'subscription_plan',
        'subscription_expires_at',
        'max_employees',
        'features',
        'status',
        'storage_used',
        'storage_limit',
    ];

    protected $casts = [
        'features' => 'array',
        'subscription_expires_at' => 'datetime',
        'storage_used' => 'integer',
        'storage_limit' => 'integer',
    ];

    /**
     * Plan configurations with features and limits
     */
    public static array $plans = [
        'starter' => [
            'name' => 'Starter',
            'price' => 15000,
            'max_employees' => 10,
            'storage_limit' => 5368709120, // 5GB
            'features' => [
                'attendance_tracking' => true,
                'leave_management' => true,
                'basic_reports' => true,
                'email_support' => true,
                'task_management' => false,
                'team_messaging' => false,
                'advanced_reports' => false,
                'custom_integrations' => false,
                'performance_reviews' => false,
                'video_calls' => false,
            ],
        ],
        'professional' => [
            'name' => 'Professional',
            'price' => 35000,
            'max_employees' => 50,
            'storage_limit' => 26843545600, // 25GB
            'features' => [
                'attendance_tracking' => true,
                'leave_management' => true,
                'basic_reports' => true,
                'email_support' => true,
                'task_management' => true,
                'team_messaging' => true,
                'advanced_reports' => true,
                'custom_integrations' => false,
                'performance_reviews' => true,
                'video_calls' => true,
            ],
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price' => 75000,
            'max_employees' => -1, // Unlimited
            'storage_limit' => -1, // Unlimited
            'features' => [
                'attendance_tracking' => true,
                'leave_management' => true,
                'basic_reports' => true,
                'email_support' => true,
                'task_management' => true,
                'team_messaging' => true,
                'advanced_reports' => true,
                'custom_integrations' => true,
                'performance_reviews' => true,
                'video_calls' => true,
                'dedicated_support' => true,
                'api_access' => true,
            ],
        ],
    ];

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($organization) {
            if (empty($organization->slug)) {
                $organization->slug = Str::slug($organization->name) . '-' . Str::random(6);
            }

            // Set plan defaults
            if ($organization->subscription_plan) {
                $plan = self::$plans[$organization->subscription_plan] ?? self::$plans['starter'];
                $organization->max_employees = $plan['max_employees'];
                $organization->storage_limit = $plan['storage_limit'];
                $organization->features = $plan['features'];
            }
        });
    }

    // Relationships
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    // Helper methods
    public function hasFeature(string $feature): bool
    {
        return $this->features[$feature] ?? false;
    }

    public function canAddEmployee(): bool
    {
        if ($this->max_employees === -1) {
            return true; // Unlimited
        }
        return $this->users()->count() < $this->max_employees;
    }

    public function getEmployeeCount(): int
    {
        return $this->users()->count();
    }

    public function getRemainingEmployeeSlots(): int
    {
        if ($this->max_employees === -1) {
            return -1; // Unlimited
        }
        return max(0, $this->max_employees - $this->users()->count());
    }

    public function hasStorageSpace(int $bytes = 0): bool
    {
        if ($this->storage_limit === -1) {
            return true; // Unlimited
        }
        return ($this->storage_used + $bytes) <= $this->storage_limit;
    }

    public function getStorageUsedPercentage(): float
    {
        if ($this->storage_limit === -1) {
            return 0;
        }
        return round(($this->storage_used / $this->storage_limit) * 100, 2);
    }

    public function isSubscriptionActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->subscription_expires_at === null) {
            return true; // No expiry set
        }

        return $this->subscription_expires_at->isFuture();
    }

    public function getPlanDetails(): array
    {
        return self::$plans[$this->subscription_plan] ?? self::$plans['starter'];
    }

    public function upgradePlan(string $newPlan): void
    {
        if (!isset(self::$plans[$newPlan])) {
            throw new \InvalidArgumentException("Invalid plan: {$newPlan}");
        }

        $plan = self::$plans[$newPlan];

        $this->update([
            'subscription_plan' => $newPlan,
            'max_employees' => $plan['max_employees'],
            'storage_limit' => $plan['storage_limit'],
            'features' => $plan['features'],
        ]);
    }
}
