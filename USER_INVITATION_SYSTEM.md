# User Invitation & Onboarding System

## Overview

Implemented a complete email-based invitation system for adding new staff members. Users receive an invitation email with a unique link to complete their onboarding process.

## Features Implemented

### 1. Database Structure

-   **user_invitations table**: Stores invitation tokens, expiration dates, and invitation status
-   **Extended users table**: Added personal information and bank account details fields
    -   `first_name`, `last_name`, `date_of_birth`
    -   `bank_name`, `account_number`, `account_name`

### 2. Backend Components

#### UserInvitation Model (`app/Models/UserInvitation.php`)

-   Token generation and validation
-   Expiration checking
-   Acceptance tracking
-   Relationships with User and Department models

#### OnboardingController (`app/Http/Controllers/OnboardingController.php`)

-   `show()`: Display onboarding form with invitation validation
-   `complete()`: Process onboarding completion and create user account

#### Updated UserController

-   Modified `store()` method to send invitation emails instead of directly creating users
-   Validates email uniqueness across both users and invitations tables

#### InviteUserMail (`app/Mail/InviteUserMail.php`)

-   Beautiful HTML email template
-   Includes invitation details and onboarding link
-   Shows expiration date
-   Provides clear instructions

### 3. Frontend Components

#### Simplified Add User Form (`resources/js/Pages/Users/CreateEdit.jsx`)

-   **Create Mode**: Only requires email, role, and department
-   Shows informative message about invitation process
-   Lists what happens after sending invitation
-   **Edit Mode**: Full form with all user details

#### Onboarding Page (`resources/js/Pages/Onboarding/Complete.jsx`)

-   Multi-step wizard with progress indicator
-   **Step 1**: Personal Information (First name, Last name, Date of birth, Phone)
-   **Step 2**: Bank Account Details (Bank name, Account number, Account name)
-   **Step 3**: Security (Password setup)
-   Beautiful gradient design with icons
-   Form validation
-   Auto-login after completion

#### Invalid Invitation Page (`resources/js/Pages/Onboarding/InvalidInvitation.jsx`)

-   Handles expired invitations
-   Handles invalid tokens
-   User-friendly error messages

### 4. Email Template (`resources/views/emails/invite-user.blade.php`)

-   Professional design with gradient header
-   Shows invitation details
-   Clear call-to-action button
-   Expiration warning
-   Step-by-step instructions
-   Footer with backup link

## User Flow

### For Administrators:

1. Go to Users → Add User
2. Enter only email address, select role and department
3. Click "Send Invitation"
4. System sends invitation email to the user

### For New Staff:

1. Receive invitation email
2. Click the unique onboarding link
3. **Step 1**: Complete personal information
4. **Step 2**: Add bank account details
5. **Step 3**: Set password
6. Click "Complete Onboarding"
7. Automatically logged in and redirected to dashboard

## Security Features

-   Unique token for each invitation (64 characters)
-   7-day expiration period
-   One-time use (marked as accepted after use)
-   Token validation before showing onboarding form
-   Password confirmation required
-   Email uniqueness validation

## Routes Added

```php
// Guest-accessible routes
GET  /onboarding/{token}  - Show onboarding form
POST /onboarding/{token}  - Complete onboarding process
```

## Database Migrations

1. `create_user_invitations_table`: New table for invitation tracking
2. `add_personal_and_bank_details_to_users_table`: Extended user model

## Configuration Required

Make sure your `.env` file has mail configuration:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@yourapp.com"
MAIL_FROM_NAME="${APP_NAME}"
```

## Testing the Feature

### Test Invitation Flow:

1. Login as Admin/Prime Admin
2. Navigate to Users page
3. Click "Add User"
4. Enter: test@example.com
5. Select role and department
6. Click "Send Invitation"
7. Check email inbox

### Test Onboarding:

1. Open the link from invitation email
2. Fill in all three steps
3. Submit the form
4. Verify auto-login and redirect

## Benefits

✅ Secure user registration process
✅ Collects all necessary information upfront
✅ Professional email communication
✅ Better user experience with step-by-step wizard
✅ Automatic user activation after onboarding
✅ Bank details collected for payroll
✅ Personal information for HR records

## Files Modified/Created

-   Database migrations (2 files)
-   Models: `UserInvitation`, updated `User`
-   Controllers: `OnboardingController`, updated `UserController`
-   Mail: `InviteUserMail` with email template
-   React pages: `CreateEdit`, `Complete`, `InvalidInvitation`
-   Routes: Added onboarding routes
-   Updated user fillable fields and casts

## Build Status

✅ All migrations run successfully
✅ Frontend built successfully (41.59s)
✅ No compilation errors
✅ Ready for production use
