<?php

namespace App\Http\Middleware;

use App\Services\PlanService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $organization = $user?->organization;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'organization' => $organization ? [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'plan' => $organization->subscription_plan,
                'plan_name' => $organization->getPlanDetails()['name'] ?? 'Unknown',
                'features' => $organization->features,
                'max_employees' => $organization->max_employees,
                'current_employees' => $organization->getEmployeeCount(),
                'can_add_employee' => $organization->canAddEmployee(),
                'storage_used' => $organization->storage_used,
                'storage_limit' => $organization->storage_limit,
                'storage_percentage' => $organization->getStorageUsedPercentage(),
                'subscription_expires_at' => $organization->subscription_expires_at?->toISOString(),
                'is_active' => $organization->isSubscriptionActive(),
            ] : null,
            'planFeatures' => $user && $organization ? [
                'attendance_tracking' => $organization->hasFeature('attendance_tracking'),
                'leave_management' => $organization->hasFeature('leave_management'),
                'task_management' => $organization->hasFeature('task_management'),
                'team_messaging' => $organization->hasFeature('team_messaging'),
                'basic_reports' => $organization->hasFeature('basic_reports'),
                'advanced_reports' => $organization->hasFeature('advanced_reports'),
                'performance_reviews' => $organization->hasFeature('performance_reviews'),
                'video_calls' => $organization->hasFeature('video_calls'),
                'custom_integrations' => $organization->hasFeature('custom_integrations'),
                'api_access' => $organization->hasFeature('api_access'),
                'dedicated_support' => $organization->hasFeature('dedicated_support'),
            ] : null,
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'info' => fn() => $request->session()->get('info'),
                'warning' => fn() => $request->session()->get('warning'),
            ],
        ];
    }
}
