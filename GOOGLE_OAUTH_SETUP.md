# Google OAuth Setup Guide for Ski-Swap

This guide will walk you through setting up Google OAuth authentication for your Ski-Swap application.

## Prerequisites

- A Google account
- Your Ski-Swap application backend and frontend running

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter project details:
   - **Project Name**: `Ski-Swap` (or any name you prefer)
   - **Organization**: Leave as default (No organization)
5. Click **"Create"**
6. Wait for the project to be created (this may take a few seconds)

## Step 2: Enable Google+ API

1. In the Google Cloud Console, make sure your new project is selected
2. Go to **"APIs & Services"** > **"Library"** from the left sidebar
3. Search for **"Google+ API"**
4. Click on it and click **"Enable"**
   - Note: You may also need to enable "Google People API" for newer implementations

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"** from the left sidebar
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required information:

   **App Information:**
   - **App name**: `Ski-Swap`
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your Ski-Swap logo

   **App Domain** (Optional but recommended):
   - **Application home page**: `http://localhost:5173` (for development)
   - **Application privacy policy link**: (Leave blank for development)
   - **Application terms of service link**: (Leave blank for development)

   **Developer contact information:**
   - **Email addresses**: Your email address

5. Click **"Save and Continue"**

6. **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test users** page:
   - Click **"Add Users"**
   - Add your Google account email (for testing)
   - Click **"Add"**
   - Click **"Save and Continue"**

8. **Summary** page:
   - Review your settings
   - Click **"Back to Dashboard"**

## Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** > **"Credentials"** from the left sidebar
2. Click **"Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"** as the application type
5. Fill in the details:

   **Name**: `Ski-Swap Web Client`

   **Authorized JavaScript origins**:
   - Click **"Add URI"**
   - Add: `http://localhost:5173` (your frontend URL)
   - For production, add: `https://yourdomain.com`

   **Authorized redirect URIs**:
   - Click **"Add URI"**
   - Add: `http://localhost:5000/api/auth/google/callback` (your backend callback URL)
   - For production, add: `https://api.yourdomain.com/api/auth/google/callback`

6. Click **"Create"**

7. **IMPORTANT**: A dialog will appear with your credentials:
   - **Client ID**: Copy this (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
   - **Client Secret**: Copy this (looks like: `GOCSPX-abc123def456`)
   - **Download JSON**: (Optional) Click download to save credentials

## Step 5: Update Your Backend .env File

1. Open your backend `.env` file located at `backend/.env`
2. Update or add these lines with your Google OAuth credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Client URL (your frontend)
CLIENT_URL=http://localhost:5173
```

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbC123DeF456GhI789
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
```

3. Save the file

## Step 6: Restart Your Backend Server

1. Stop your backend server if it's running (Ctrl+C)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

## Step 7: Test Google OAuth

1. Make sure both frontend and backend are running
2. Open your browser and go to `http://localhost:5173`
3. Click on **"Login"**
4. You should see a **"Continue with Google"** button
5. Click the Google button
6. You'll be redirected to Google's sign-in page
7. Select your Google account
8. Grant permissions to Ski-Swap
9. You should be redirected back to your app and logged in!

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Solution**: Make sure the redirect URI in Google Cloud Console EXACTLY matches your backend callback URL
- Check for typos, http vs https, trailing slashes

### Error: "access_denied"
- **Solution**: Make sure you added your email as a test user in the OAuth consent screen

### Error: "invalid_client"
- **Solution**: Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the `.env` file

### Sessions not working
- **Solution**: Make sure you have the `express-session` package installed:
  ```bash
  npm install express-session
  ```

### Can't see user info after login
- **Solution**: Check browser console for errors. Make sure the token is being stored correctly.

## For Production Deployment

When deploying to production, you need to:

1. **Update OAuth Consent Screen**:
   - Change from "Testing" to "In Production"
   - May require verification by Google

2. **Update Authorized Origins and Redirect URIs**:
   - Add your production URLs to Google Cloud Console
   - Example: `https://skiswap.com` and `https://api.skiswap.com/api/auth/google/callback`

3. **Update .env file**:
   ```env
   GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
   CLIENT_URL=https://yourdomain.com
   NODE_ENV=production
   ```

4. **Enable HTTPS**:
   - Production OAuth requires HTTPS
   - Use SSL certificates (Let's Encrypt is free)

## Security Notes

- **Never commit your `.env` file** to version control
- Keep your `GOOGLE_CLIENT_SECRET` private
- Use different credentials for development and production
- Regularly rotate your client secrets
- Review OAuth scopes - only request what you need

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Quick Reference: What We Built

### Backend Files Created/Modified:
- ✅ `backend/config/passport.js` - Passport Google OAuth configuration
- ✅ `backend/routes/googleAuthRoutes.js` - Google OAuth routes
- ✅ `backend/models/User.js` - Updated to support Google OAuth
- ✅ `backend/index.js` - Added passport and session middleware

### Frontend Files Created/Modified:
- ✅ `frontend/src/pages/Login.vue` - Added "Continue with Google" button
- ✅ `frontend/src/pages/GoogleAuthCallback.vue` - Handles OAuth callback
- ✅ `frontend/src/routes.js` - Added callback route

### Environment Variables Needed:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-session-secret (optional, will use JWT_SECRET if not provided)
```

### OAuth Flow:
1. User clicks "Continue with Google" → Redirects to `http://localhost:5000/api/auth/google`
2. Backend redirects to Google login
3. User authenticates with Google
4. Google redirects back to `http://localhost:5000/api/auth/google/callback`
5. Backend creates/finds user, generates JWT token
6. Backend redirects to `http://localhost:5173/auth/google/success?token=JWT_TOKEN`
7. Frontend extracts token, stores it, and logs user in
8. User is redirected to home page

**You're all set! 🎉**
