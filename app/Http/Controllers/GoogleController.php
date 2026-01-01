<?php

namespace App\Http\Controllers;

use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GoogleController extends Controller
{
    /**
     * Redirect to Google OAuth consent screen
     */
    public function redirect()
    {
        $googleService = new GoogleCalendarService();

        if (!$googleService->hasCredentials()) {
            return redirect()->back()->with('error', 'Google API is not configured. Please contact administrator.');
        }

        $authUrl = $googleService->getAuthUrl();

        return redirect()->away($authUrl);
    }

    /**
     * Handle callback from Google OAuth
     */
    public function callback(Request $request)
    {
        if ($request->has('error')) {
            return redirect()->route('meetings.index')
                ->with('error', 'Google authorization was cancelled or failed.');
        }

        $code = $request->get('code');

        if (!$code) {
            return redirect()->route('meetings.index')
                ->with('error', 'No authorization code received from Google.');
        }

        $googleService = new GoogleCalendarService();
        $user = Auth::user();

        if ($googleService->handleCallback($code, $user)) {
            return redirect()->route('meetings.index')
                ->with('success', 'Google Calendar connected successfully! You can now create meetings with Google Meet.');
        }

        return redirect()->route('meetings.index')
            ->with('error', 'Failed to connect Google Calendar. Please try again.');
    }

    /**
     * Disconnect Google account
     */
    public function disconnect()
    {
        $user = Auth::user();
        $googleService = new GoogleCalendarService();

        $googleService->disconnect($user);

        return redirect()->back()->with('success', 'Google Calendar disconnected successfully.');
    }

    /**
     * Check Google connection status (API endpoint)
     */
    public function status()
    {
        $user = Auth::user();

        return response()->json([
            'connected' => $user->hasGoogleConnected(),
            'expires_at' => $user->google_token_expires_at,
        ]);
    }
}
