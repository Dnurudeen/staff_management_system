<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }

        .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }

        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
            color: #6b7280;
        }

        .info-box {
            background: white;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 4px;
        }

        .expires {
            background: #fef3c7;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Welcome to {{ config('app.name') }}!</h1>
    </div>

    <div class="content">
        <p>Hello,</p>

        <p>You've been invited to join <strong>{{ config('app.name') }}</strong> as a
            <strong>{{ ucfirst(str_replace('_', ' ', $invitation->role)) }}</strong>.</p>

        <div class="info-box">
            <p><strong>Invitation Details:</strong></p>
            <ul>
                <li>Email: {{ $invitation->email }}</li>
                <li>Role: {{ ucfirst(str_replace('_', ' ', $invitation->role)) }}</li>
                @if ($invitation->department)
                    <li>Department: {{ $invitation->department->name }}</li>
                @endif
                <li>Invited by: {{ $invitation->inviter->name }}</li>
            </ul>
        </div>

        <p>To complete your registration and join the team, please click the button below to set up your account:</p>

        <div style="text-align: center;">
            <a href="{{ $onboardingUrl }}" class="button">Complete Your Onboarding</a>
        </div>

        <div class="expires">
            ⚠️ <strong>Note:</strong> This invitation link will expire on
            {{ $invitation->expires_at->format('F j, Y \a\t g:i A') }}.
        </div>

        <p><strong>What happens next?</strong></p>
        <ol>
            <li>Click the button above to access your onboarding page</li>
            <li>Complete your personal information</li>
            <li>Add your bank account details for payroll</li>
            <li>Set your password</li>
            <li>Start using the system!</li>
        </ol>

        <p>If you have any questions or need assistance, please contact your administrator.</p>

        <p>We're excited to have you on board!</p>

        <p>Best regards,<br>
            The {{ config('app.name') }} Team</p>
    </div>

    <div class="footer">
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">{{ $onboardingUrl }}</p>
    </div>
</body>

</html>
