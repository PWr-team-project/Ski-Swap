# Password Reset Feature Setup Guide

## Overview
The forgot password functionality has been successfully implemented. Users can now reset their passwords by receiving a 6-digit code via email.

## Features Implemented

### Backend
1. **Email Service** (`backend/services/emailService.js`)
   - Uses nodemailer to send password reset emails
   - Professional HTML email template
   - Configurable email service (Gmail by default)

2. **Password Reset Token Model** (`backend/models/PasswordResetToken.js`)
   - Stores reset codes with automatic expiration (5 minutes)
   - Indexed for fast lookups
   - MongoDB TTL (Time To Live) for automatic cleanup

3. **Password Reset Routes** (`backend/routes/passwordResetRoutes.js`)
   - `POST /api/auth/forgot-password` - Request reset code
   - `POST /api/auth/verify-reset-code` - Verify the code
   - `POST /api/auth/reset-password` - Reset password with verified code

### Frontend
1. **Forgot Password Page** (`frontend/src/pages/ForgotPassword.vue`)
   - User enters their email
   - Sends reset code to email
   - Auto-redirects to verify code page

2. **Verify Code Page** (`frontend/src/pages/VerifyResetCode.vue`)
   - 6-digit code input
   - Resend code functionality with 60-second cooldown
   - Auto-redirects to reset password page on success

3. **Reset Password Page** (`frontend/src/pages/ResetPassword.vue`)
   - Double password confirmation
   - Password match indicator
   - Redirects to login on success

4. **Login Page Updates**
   - Added "Forgot password?" link
   - Success message when password is reset

## Email Configuration Required

### Step 1: Configure Gmail for Sending Emails

You need to set up a Gmail account to send password reset emails.

#### Option A: Using Gmail with App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "SkiSwap Password Reset"
   - Copy the 16-character password

3. **Update `.env` file** in `backend/.env`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### Option B: Using Other Email Services

If not using Gmail, update the `.env` file:

```env
EMAIL_SERVICE=outlook  # or hotmail, yahoo, etc.
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

Supported services: gmail, yahoo, hotmail, outlook

### Step 2: Test the Email Service

1. **Restart the backend server** after updating `.env`:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test sending an email**:
   - Go to http://localhost:5173/forgot-password
   - Enter a valid registered email
   - Check if the code arrives in the inbox

## User Flow

1. User clicks "Forgot password?" on login page
2. User enters their email address
3. System sends a 6-digit code to their email (expires in 5 minutes)
4. User enters the code from their email
5. User can resend the code if needed (60-second cooldown)
6. After verification, user enters new password (with confirmation)
7. Password is updated, user redirects to login

## Security Features

- **Code expiration**: Codes expire after 5 minutes
- **One-time use**: Codes are deleted after successful password reset
- **Resend cooldown**: 60-second cooldown to prevent spam
- **Password validation**: Minimum 6 characters
- **Email privacy**: Doesn't reveal if email exists in system (security best practice)
- **OAuth protection**: Prevents password reset for Google OAuth users

## File Structure

```
backend/
├── models/
│   └── PasswordResetToken.js       # Token schema with TTL
├── routes/
│   └── passwordResetRoutes.js      # Password reset endpoints
├── services/
│   └── emailService.js             # Email sending service
└── .env                             # Email configuration (update this!)

frontend/
├── src/
│   ├── pages/
│   │   ├── ForgotPassword.vue      # Request reset code
│   │   ├── VerifyResetCode.vue     # Enter code from email
│   │   ├── ResetPassword.vue       # Set new password
│   │   └── Login.vue               # Updated with forgot link
│   └── routes.js                    # Added password reset routes
```

## API Endpoints

### 1. Request Password Reset
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "message": "Password reset code has been sent to your email." }
```

### 2. Verify Reset Code
```
POST /api/auth/verify-reset-code
Body: { "email": "user@example.com", "code": "123456" }
Response: { "message": "Code verified successfully." }
```

### 3. Reset Password
```
POST /api/auth/reset-password
Body: {
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
Response: { "message": "Password has been reset successfully." }
```

## Troubleshooting

### Emails not sending?
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are correct in `.env`
- For Gmail: Make sure you're using an App Password, not your regular password
- Check backend console for error messages
- Verify 2FA is enabled on your Gmail account

### Code expired error?
- Codes expire after 5 minutes for security
- Request a new code using the "Resend Code" button

### "This account uses Google sign-in" error?
- Users who registered with Google OAuth cannot use password reset
- They should sign in with Google instead

## Next Steps

1. **Configure email settings** in `backend/.env`
2. **Restart backend server**
3. **Test the complete flow** with a registered user
4. Consider customizing the email template in `backend/services/emailService.js`
5. In production, use environment-specific email addresses

## Production Considerations

- Use a dedicated email service (SendGrid, AWS SES, etc.) for better deliverability
- Implement rate limiting to prevent abuse
- Add email verification during registration
- Consider using a more secure code generation method
- Set up email logging for debugging
- Use HTTPS for all email-related operations
