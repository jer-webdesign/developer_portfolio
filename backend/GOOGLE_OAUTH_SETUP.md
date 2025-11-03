# Google OAuth 2.0 Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Developer Portfolio Auth"
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" 
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for testing) and click "Create"
3. Fill in the required fields:
   - App name: "Developer Portfolio"
   - User support email: your email
   - Developer contact information: your email
4. Click "Save and Continue"
5. Add scopes: email, profile, openid
6. Click "Save and Continue"
7. Add test users (your email address)
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Name: "Developer Portfolio Web Client"
5. Add Authorized JavaScript origins:
   - `https://localhost:3000`
   - `https://localhost:5173` (for frontend)
6. Add Authorized redirect URIs:
   - `https://localhost:3000/auth/google/callback`
7. Click "Create"

## Step 5: Update Environment Variables

Copy the Client ID and Client Secret from the credentials page and update your `.env` file:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=https://localhost:3000/auth/google/callback
```

## Step 6: Test OAuth Integration

1. Start your server: `npm run start`
2. Navigate to: `https://localhost:3000/auth/google`
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you'll be redirected back to your callback URL

## Security Notes

- Keep your Client Secret confidential
- For production, update the authorized origins and redirect URIs
- Consider implementing additional OAuth scopes as needed
- Review Google's OAuth 2.0 security best practices

## Troubleshooting

### Common Issues:
1. **"Error 400: redirect_uri_mismatch"**
   - Check that the redirect URI in Google Console matches exactly
   - Ensure HTTPS is used for localhost

2. **"Error 403: access_blocked"**
   - Add your email as a test user in OAuth consent screen
   - Ensure Google+ API is enabled

3. **"Invalid client error"**
   - Verify Client ID and Secret are correct in .env file
   - Check that .env file is being loaded properly