# Testing User Invitation Flow

## 🔧 Fixes Applied

### 1. **Mail Sending Issue - FIXED** ✅

-   **Problem**: Emails were being queued but never sent (no queue worker running)
-   **Root Cause**: `InviteUserMail` class implemented `ShouldQueue` interface
-   **Solution**: Removed `ShouldQueue` interface - emails now send immediately
-   **File Modified**: `app/Mail/InviteUserMail.php`

### 2. **Relationship Loading - FIXED** ✅

-   **Problem**: Email template needs inviter and department data
-   **Solution**: Added `$invitation->load(['inviter', 'department'])` before sending email
-   **File Modified**: `app/Http/Controllers/UserController.php`

### 3. **Error Handling - ADDED** ✅

-   **Feature**: Try-catch block around email sending
-   **Benefit**: If email fails, invitation is deleted and error message shown
-   **Details**: Shows actual error message for debugging

---

## 🧪 Complete Testing Checklist

### Prerequisites ✅

-   [x] Frontend built successfully (npm run build)
-   [x] Laravel server running (http://127.0.0.1:8000)
-   [x] Database migrations run
-   [x] SendGrid configured in .env

### Phase 1: Create Invitation 📧

1. **Login to the system**

    - URL: http://127.0.0.1:8000/login
    - Use admin credentials

2. **Navigate to Users page**

    - Click "Users" in sidebar navigation
    - Verify page loads successfully

3. **Click "Invite User" button**

    - Button should be in top-right corner
    - Should open the invitation form

4. **Fill invitation form:**

    - Email: Use a REAL email address you can access
    - Role: Select "staff" (or any role)
    - Department: Select any department (optional)

5. **Submit the form**
    - Click submit button
    - **Expected Results:**
        - ✅ Redirects back to Users page
        - ✅ Success message: "Invitation sent successfully to [email]"
        - ✅ Email sends immediately (check recipient inbox)
    - **If Error:**
        - ❌ Error message shows with details
        - Check Laravel logs for more info

### Phase 2: Check Email 📬

1. **Check recipient's inbox**

    - Look for email from: info@ayoolasuite.com
    - Subject: "Invitation to Join Staff Management System"
    - **Check spam folder if not in inbox**

2. **Verify email content:**

    - ✅ Professional design with gradient header
    - ✅ Clear invitation message
    - ✅ Shows inviter's name
    - ✅ Shows department (if assigned)
    - ✅ Shows expiration date (7 days from now)
    - ✅ Has "Complete Onboarding" button with unique link

3. **Copy the onboarding link**
    - Format should be: `http://domain/onboarding/{unique-token}`

### Phase 3: Onboarding Process 👤

1. **Click onboarding link (or paste in browser)**

    - Should load the onboarding wizard
    - **Expected:** Clean 3-step form interface

2. **Step 1: Personal Information**

    - Fill in:
        - First Name: (required)
        - Last Name: (required)
        - Date of Birth: (required - use date picker)
    - Click "Next"
    - **Expected:** Progress bar updates, moves to Step 2

3. **Step 2: Bank Details**

    - Fill in:
        - Bank Name: (required)
        - Account Number: (required)
        - Account Name: (required)
    - Click "Next"
    - **Expected:** Progress bar updates, moves to Step 3

4. **Step 3: Security**
    - Fill in:
        - Password: (required, minimum 8 characters)
        - Confirm Password: (required, must match)
    - Click "Complete Onboarding"
    - **Expected:**
        - ✅ Form submits successfully
        - ✅ User account created
        - ✅ Auto-login happens
        - ✅ Redirects to dashboard

### Phase 4: Verify User Creation 🔍

1. **Check you're logged in**

    - Should see dashboard
    - Top-right should show user name
    - Navigation should be accessible

2. **Navigate to Users page (as admin)**

    - Search for the newly created user
    - **Verify:**
        - ✅ User exists in list
        - ✅ Email matches invitation
        - ✅ Role is correct
        - ✅ Department assigned (if applicable)
        - ✅ Status is "active"

3. **Check database records:**

    ```sql
    -- Check user was created
    SELECT * FROM users WHERE email = 'invited-email@example.com';

    -- Check invitation was marked accepted
    SELECT * FROM user_invitations WHERE email = 'invited-email@example.com';
    ```

---

## 🐛 Troubleshooting Guide

### Issue: Email Not Received

**Check these:**

1. **Spam folder** - SendGrid emails often go to spam initially
2. **Email address** - Verify it's typed correctly
3. **SendGrid account** - Check if API key is valid
4. **Laravel logs** - Look for error messages
    ```bash
    tail -50 storage/logs/laravel.log
    ```
5. **SendGrid dashboard** - Check if email was accepted by SendGrid

**Test SendGrid connection:**

```bash
php artisan tinker
```

```php
Mail::raw('Test email', function($msg) {
    $msg->to('your-email@example.com')->subject('Test');
});
```

### Issue: "Failed to send invitation email"

**This means the try-catch caught an error:**

1. Read the full error message shown on screen
2. Check Laravel logs for stack trace
3. Common causes:
    - Invalid SendGrid API key
    - SendGrid account suspended
    - Mail configuration error in .env
    - Network connectivity issue

**Fix:**

-   Verify .env mail settings
-   Test with different email
-   Check SendGrid account status

### Issue: Onboarding Link Invalid

**Check:**

1. Token in URL matches database
2. Invitation not expired (7 days)
3. Invitation not already used
4. Database record exists

**Query to check:**

```sql
SELECT * FROM user_invitations
WHERE token = 'token-from-url'
AND expires_at > NOW()
AND accepted_at IS NULL;
```

### Issue: Onboarding Form Won't Submit

**Check:**

1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Form validation errors
4. Laravel logs for backend errors

**Common issues:**

-   Password too short (< 8 characters)
-   Password confirmation doesn't match
-   Date of birth format incorrect
-   Missing required fields

### Issue: No Auto-Login After Onboarding

**Check:**

1. User was created in database
2. Session is working
3. Auth middleware configured
4. Redirect URL is correct

**Debug:**

```php
// In OnboardingController@complete
dd(Auth::check(), Auth::user());
```

---

## 📊 Database Verification Queries

### Check All Invitations

```sql
SELECT
    ui.email,
    ui.role,
    ui.token,
    ui.expires_at,
    ui.accepted_at,
    ui.created_at,
    u.name as inviter_name,
    d.name as department_name,
    created_user.name as created_user_name
FROM user_invitations ui
LEFT JOIN users u ON ui.invited_by = u.id
LEFT JOIN departments d ON ui.department_id = d.id
LEFT JOIN users created_user ON ui.user_id = created_user.id
ORDER BY ui.created_at DESC
LIMIT 10;
```

### Check Recently Created Users

```sql
SELECT
    id,
    first_name,
    last_name,
    email,
    role,
    status,
    department_id,
    created_at
FROM users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC;
```

### Check User's Complete Profile

```sql
SELECT
    u.*,
    d.name as department_name,
    ui.token as invitation_token,
    ui.expires_at as invitation_expires_at,
    ui.accepted_at as invitation_accepted_at
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN user_invitations ui ON u.id = ui.user_id
WHERE u.email = 'invited-email@example.com';
```

---

## ✅ Success Criteria

Your invitation system is working correctly when:

1. ✅ Admin can create invitation without errors
2. ✅ Email arrives in recipient's inbox within 1 minute
3. ✅ Onboarding link works and loads form
4. ✅ All 3 steps of onboarding complete successfully
5. ✅ User is created with all information
6. ✅ User is auto-logged in after onboarding
7. ✅ User appears in admin's user list
8. ✅ Invitation is marked as accepted in database

---

## 🔐 Security Notes

-   Tokens are 64 characters, cryptographically random
-   Invitations expire after 7 days
-   Tokens can only be used once
-   Expired/invalid tokens show friendly error page
-   Passwords are hashed before storage
-   Only prime_admin can invite admin users

---

## 📝 Quick Test Script

For rapid testing, use these test emails:

-   User: test-staff-1@yourdomain.com
-   User: test-staff-2@yourdomain.com
-   User: test-staff-3@yourdomain.com

**Fast test workflow:**

1. Create invitation with test email
2. Check email inbox
3. Copy onboarding link
4. Open in incognito window
5. Complete all 3 steps
6. Verify dashboard loads
7. Check admin user list
8. Delete test user if needed

---

## 🎯 Next Steps After Testing

If everything works:

-   ✅ Document the flow for your team
-   ✅ Train admins on invitation process
-   ✅ Set up email monitoring
-   ✅ Create user guides
-   ✅ Monitor SendGrid usage/limits

If issues found:

-   ❌ Document exact error messages
-   ❌ Note which step fails
-   ❌ Save screenshots
-   ❌ Check all logs
-   ❌ Report back for fixes

---

## 📞 Support

If you encounter any issues during testing:

1. Check the troubleshooting section above
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check browser console for JavaScript errors
4. Verify SendGrid dashboard for email delivery status
5. Test with different email addresses

**Good luck with testing! 🚀**
