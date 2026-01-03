<?php

namespace App\Http\Middleware;

use App\Services\PlanService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $feature  The feature to check access for
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Check if user has access to the feature
        if (!PlanService::canAccessModule($user, $feature)) {
            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => false,
                    'message' => 'This feature is not available on your current plan. Please upgrade to access this feature.',
                    'upgrade_required' => true,
                ], 403);
            }

            // For web requests, redirect with error message
            return redirect()->back()->with('error', 'This feature is not available on your current plan. Please upgrade to access this feature.');
        }

        return $next($request);
    }
}
