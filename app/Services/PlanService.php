<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;

class PlanService
{
    /**
     * Get plan configuration by plan key
     */
    public static function getPlan(string $planKey): ?array
    {
        return Organization::$plans[$planKey] ?? null;
    }

    /**
     * Get all available plans
     */
    public static function getAllPlans(): array
    {
        return Organization::$plans;
    }

    /**
     * Check if a user's organization has a specific feature
     */
    public static function userHasFeature(User $user, string $feature): bool
    {
        if (!$user->organization) {
            return false;
        }

        return $user->organization->hasFeature($feature);
    }

    /**
     * Check if user can access a specific module based on their plan
     */
    public static function canAccessModule(User $user, string $module): bool
    {
        $moduleFeatureMap = [
            'attendance' => 'attendance_tracking',
            'leave' => 'leave_management',
            'tasks' => 'task_management',
            'messaging' => 'team_messaging',
            'reports' => 'basic_reports',
            'advanced_reports' => 'advanced_reports',
            'performance' => 'performance_reviews',
            'video_calls' => 'video_calls',
            'integrations' => 'custom_integrations',
            'api' => 'api_access',
        ];

        $feature = $moduleFeatureMap[$module] ?? null;

        if (!$feature) {
            return true; // If no feature mapping, allow access
        }

        return self::userHasFeature($user, $feature);
    }

    /**
     * Get the features available for a specific plan
     */
    public static function getPlanFeatures(string $planKey): array
    {
        $plan = self::getPlan($planKey);
        return $plan['features'] ?? [];
    }

    /**
     * Get comparison data for all plans (useful for upgrade pages)
     */
    public static function getPlansComparison(): array
    {
        $plans = self::getAllPlans();
        $comparison = [];

        foreach ($plans as $key => $plan) {
            $comparison[$key] = [
                'name' => $plan['name'],
                'price' => $plan['price'],
                'max_employees' => $plan['max_employees'],
                'storage_limit' => $plan['storage_limit'],
                'features' => array_keys(array_filter($plan['features'])),
            ];
        }

        return $comparison;
    }

    /**
     * Get human-readable feature names
     */
    public static function getFeatureLabels(): array
    {
        return [
            'attendance_tracking' => 'Attendance Tracking',
            'leave_management' => 'Leave Management',
            'basic_reports' => 'Basic Reports',
            'email_support' => 'Email Support',
            'task_management' => 'Task Management',
            'team_messaging' => 'Team Messaging',
            'advanced_reports' => 'Advanced Reports & Analytics',
            'custom_integrations' => 'Custom Integrations',
            'performance_reviews' => 'Performance Reviews',
            'video_calls' => 'Video Calls',
            'dedicated_support' => '24/7 Dedicated Support',
            'api_access' => 'API Access',
        ];
    }

    /**
     * Format storage size for display
     */
    public static function formatStorage(int $bytes): string
    {
        if ($bytes === -1) {
            return 'Unlimited';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Format employee limit for display
     */
    public static function formatEmployeeLimit(int $limit): string
    {
        return $limit === -1 ? 'Unlimited' : (string) $limit;
    }

    /**
     * Check if an organization needs to upgrade based on usage
     */
    public static function shouldSuggestUpgrade(Organization $organization): array
    {
        $suggestions = [];

        // Check employee count
        if ($organization->max_employees !== -1) {
            $usage = ($organization->getEmployeeCount() / $organization->max_employees) * 100;
            if ($usage >= 80) {
                $suggestions['employees'] = [
                    'current' => $organization->getEmployeeCount(),
                    'limit' => $organization->max_employees,
                    'percentage' => round($usage, 0),
                    'message' => "You're using {$usage}% of your employee slots",
                ];
            }
        }

        // Check storage
        if ($organization->storage_limit !== -1) {
            $storageUsage = $organization->getStorageUsedPercentage();
            if ($storageUsage >= 80) {
                $suggestions['storage'] = [
                    'current' => self::formatStorage($organization->storage_used),
                    'limit' => self::formatStorage($organization->storage_limit),
                    'percentage' => $storageUsage,
                    'message' => "You're using {$storageUsage}% of your storage",
                ];
            }
        }

        return $suggestions;
    }

    /**
     * Get the recommended upgrade plan for an organization
     */
    public static function getRecommendedUpgrade(Organization $organization): ?string
    {
        $currentPlan = $organization->subscription_plan;

        $upgradeOrder = ['starter' => 'professional', 'professional' => 'enterprise'];

        return $upgradeOrder[$currentPlan] ?? null;
    }
}
