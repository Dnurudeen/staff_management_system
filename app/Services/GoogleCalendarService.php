<?php

namespace App\Services;

use App\Models\User;
use Google\Client;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Calendar\ConferenceData;
use Google\Service\Calendar\CreateConferenceRequest;
use Google\Service\Calendar\ConferenceSolutionKey;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    protected Client $client;
    protected ?Calendar $calendar = null;
    protected ?User $user = null;

    public function __construct(?User $user = null)
    {
        $this->client = new Client();
        $this->client->setApplicationName(config('services.google.app_name', 'Staff Management System'));

        // Load OAuth 2.0 credentials
        $credentialsPath = config('services.google.credentials_path');

        if ($credentialsPath && file_exists($credentialsPath)) {
            $this->client->setAuthConfig($credentialsPath);
            $this->client->setScopes([
                Calendar::CALENDAR,
                Calendar::CALENDAR_EVENTS,
            ]);
            $this->client->setAccessType('offline');
            $this->client->setPrompt('consent');

            // Set redirect URI
            $this->client->setRedirectUri(config('services.google.redirect_uri', url('/google/callback')));

            // If user is provided and has tokens, authenticate
            if ($user) {
                $this->user = $user;
                $this->authenticateUser($user);
            }
        }
    }

    /**
     * Authenticate with user's stored tokens
     */
    protected function authenticateUser(User $user): bool
    {
        if (!$user->hasGoogleConnected()) {
            return false;
        }

        $this->client->setAccessToken([
            'access_token' => $user->google_access_token,
            'refresh_token' => $user->google_refresh_token,
            'expires_in' => $user->google_token_expires_at ? $user->google_token_expires_at->timestamp - time() : 0,
        ]);

        // Check if token is expired and refresh if needed
        if ($this->client->isAccessTokenExpired()) {
            if ($user->google_refresh_token) {
                try {
                    $newToken = $this->client->fetchAccessTokenWithRefreshToken($user->google_refresh_token);

                    if (isset($newToken['access_token'])) {
                        // Update user's tokens
                        $user->update([
                            'google_access_token' => $newToken['access_token'],
                            'google_token_expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
                        ]);

                        // Keep the refresh token if a new one wasn't provided
                        if (isset($newToken['refresh_token'])) {
                            $user->update(['google_refresh_token' => $newToken['refresh_token']]);
                        }
                    } else {
                        Log::error('GoogleCalendarService: Failed to refresh token', ['error' => $newToken]);
                        return false;
                    }
                } catch (\Exception $e) {
                    Log::error('GoogleCalendarService: Token refresh failed', ['error' => $e->getMessage()]);
                    return false;
                }
            } else {
                return false;
            }
        }

        $this->calendar = new Calendar($this->client);
        return true;
    }

    /**
     * Get the OAuth authorization URL
     */
    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }

    /**
     * Handle OAuth callback and exchange code for tokens
     */
    public function handleCallback(string $code, User $user): bool
    {
        try {
            $token = $this->client->fetchAccessTokenWithAuthCode($code);

            if (isset($token['error'])) {
                Log::error('GoogleCalendarService: OAuth error', ['error' => $token['error']]);
                return false;
            }

            $user->update([
                'google_access_token' => $token['access_token'],
                'google_refresh_token' => $token['refresh_token'] ?? null,
                'google_token_expires_at' => now()->addSeconds($token['expires_in'] ?? 3600),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('GoogleCalendarService: Callback failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Disconnect user's Google account
     */
    public function disconnect(User $user): bool
    {
        try {
            if ($user->google_access_token) {
                $this->client->revokeToken($user->google_access_token);
            }
        } catch (\Exception $e) {
            // Continue even if revoke fails
            Log::warning('GoogleCalendarService: Token revoke failed', ['error' => $e->getMessage()]);
        }

        $user->update([
            'google_access_token' => null,
            'google_refresh_token' => null,
            'google_token_expires_at' => null,
        ]);

        return true;
    }

    /**
     * Check if the service is properly configured
     */
    public function isConfigured(): bool
    {
        return $this->calendar !== null;
    }

    /**
     * Check if credentials file exists
     */
    public function hasCredentials(): bool
    {
        $credentialsPath = config('services.google.credentials_path');
        return $credentialsPath && file_exists($credentialsPath);
    }

    /**
     * Create a Google Calendar event with Google Meet link
     *
     * @param string $title Meeting title
     * @param string|null $description Meeting description
     * @param \DateTime $startTime Meeting start time
     * @param int $durationMinutes Meeting duration in minutes
     * @param array $attendees Array of attendee emails
     * @return array|null Returns array with 'event_id', 'meet_link', 'calendar_link' or null on failure
     */
    public function createMeetingWithGoogleMeet(
        string $title,
        ?string $description,
        \DateTime $startTime,
        int $durationMinutes,
        array $attendees = []
    ): ?array {
        if (!$this->isConfigured()) {
            Log::warning('GoogleCalendarService: Service not configured - user may need to connect Google account');
            return null;
        }

        try {
            $endTime = clone $startTime;
            $endTime->modify("+{$durationMinutes} minutes");

            // Create event
            $event = new Event();
            $event->setSummary($title);
            $event->setDescription($description ?? '');

            // Set start time
            $start = new EventDateTime();
            $start->setDateTime($startTime->format(\DateTime::RFC3339));
            $start->setTimeZone(config('app.timezone', 'UTC'));
            $event->setStart($start);

            // Set end time
            $end = new EventDateTime();
            $end->setDateTime($endTime->format(\DateTime::RFC3339));
            $end->setTimeZone(config('app.timezone', 'UTC'));
            $event->setEnd($end);

            // Add attendees
            if (!empty($attendees)) {
                $eventAttendees = [];
                foreach ($attendees as $email) {
                    $eventAttendees[] = ['email' => $email];
                }
                $event->setAttendees($eventAttendees);
            }

            // Configure Google Meet
            $conferenceRequest = new CreateConferenceRequest();
            $conferenceRequest->setRequestId(uniqid('meet_', true));

            $conferenceSolutionKey = new ConferenceSolutionKey();
            $conferenceSolutionKey->setType('hangoutsMeet');
            $conferenceRequest->setConferenceSolutionKey($conferenceSolutionKey);

            $conferenceData = new ConferenceData();
            $conferenceData->setCreateRequest($conferenceRequest);
            $event->setConferenceData($conferenceData);

            // Create the event
            $calendarId = config('services.google.calendar_id', 'primary');
            $createdEvent = $this->calendar->events->insert($calendarId, $event, [
                'conferenceDataVersion' => 1,
                'sendUpdates' => 'all',
            ]);

            // Extract the Meet link
            $meetLink = null;
            if ($createdEvent->getConferenceData() && $createdEvent->getConferenceData()->getEntryPoints()) {
                foreach ($createdEvent->getConferenceData()->getEntryPoints() as $entryPoint) {
                    if ($entryPoint->getEntryPointType() === 'video') {
                        $meetLink = $entryPoint->getUri();
                        break;
                    }
                }
            }

            Log::info('GoogleCalendarService: Meeting created successfully', [
                'event_id' => $createdEvent->getId(),
                'meet_link' => $meetLink,
            ]);

            return [
                'event_id' => $createdEvent->getId(),
                'meet_link' => $meetLink,
                'calendar_link' => $createdEvent->getHtmlLink(),
            ];
        } catch (\Exception $e) {
            Log::error('GoogleCalendarService: Failed to create meeting', [
                'error' => $e->getMessage(),
                'title' => $title,
            ]);
            return null;
        }
    }

    /**
     * Update an existing Google Calendar event
     */
    public function updateMeeting(
        string $eventId,
        string $title,
        ?string $description,
        \DateTime $startTime,
        int $durationMinutes,
        array $attendees = []
    ): ?array {
        if (!$this->isConfigured()) {
            Log::warning('GoogleCalendarService: Service not configured');
            return null;
        }

        try {
            $calendarId = config('services.google.calendar_id', 'primary');
            $event = $this->calendar->events->get($calendarId, $eventId);

            $endTime = clone $startTime;
            $endTime->modify("+{$durationMinutes} minutes");

            $event->setSummary($title);
            $event->setDescription($description ?? '');

            // Set start time
            $start = new EventDateTime();
            $start->setDateTime($startTime->format(\DateTime::RFC3339));
            $start->setTimeZone(config('app.timezone', 'UTC'));
            $event->setStart($start);

            // Set end time
            $end = new EventDateTime();
            $end->setDateTime($endTime->format(\DateTime::RFC3339));
            $end->setTimeZone(config('app.timezone', 'UTC'));
            $event->setEnd($end);

            // Update attendees
            if (!empty($attendees)) {
                $eventAttendees = [];
                foreach ($attendees as $email) {
                    $eventAttendees[] = ['email' => $email];
                }
                $event->setAttendees($eventAttendees);
            }

            $updatedEvent = $this->calendar->events->update($calendarId, $eventId, $event, [
                'conferenceDataVersion' => 1,
                'sendUpdates' => 'all',
            ]);

            // Extract the Meet link
            $meetLink = null;
            if ($updatedEvent->getConferenceData() && $updatedEvent->getConferenceData()->getEntryPoints()) {
                foreach ($updatedEvent->getConferenceData()->getEntryPoints() as $entryPoint) {
                    if ($entryPoint->getEntryPointType() === 'video') {
                        $meetLink = $entryPoint->getUri();
                        break;
                    }
                }
            }

            return [
                'event_id' => $updatedEvent->getId(),
                'meet_link' => $meetLink,
                'calendar_link' => $updatedEvent->getHtmlLink(),
            ];
        } catch (\Exception $e) {
            Log::error('GoogleCalendarService: Failed to update meeting', [
                'error' => $e->getMessage(),
                'event_id' => $eventId,
            ]);
            return null;
        }
    }

    /**
     * Delete a Google Calendar event
     */
    public function deleteMeeting(string $eventId): bool
    {
        if (!$this->isConfigured()) {
            Log::warning('GoogleCalendarService: Service not configured');
            return false;
        }

        try {
            $calendarId = config('services.google.calendar_id', 'primary');
            $this->calendar->events->delete($calendarId, $eventId, [
                'sendUpdates' => 'all',
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error('GoogleCalendarService: Failed to delete meeting', [
                'error' => $e->getMessage(),
                'event_id' => $eventId,
            ]);
            return false;
        }
    }
}
