# Google OAuth Setup Guide for DukaFiti

This guide will help you set up Google OAuth authentication for your DukaFiti application using Supabase Auth.

## Prerequisites

- A Supabase project with authentication enabled
- A Google Cloud Platform account
- Your DukaFiti application deployed (Replit, Vercel, etc.)

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### 1.2 Enable Google+ API
1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" 
3. Click **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless using Google Workspace)
3. Fill in required fields:
   - **App name**: DukaFiti
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - **Application home page**: Your deployed app URL
   - **Application privacy policy**: (optional for testing)
   - **Application terms of service**: (optional for testing)
4. Click **Save and Continue**
5. Add scopes: `email`, `profile`, `openid` (these are usually pre-selected)
6. Add test users if needed (for development)
7. Review and submit

### 1.4 Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Set **Name**: DukaFiti OAuth Client
5. Add **Authorized JavaScript origins**:
   ```
   https://your-app-domain.com
   https://your-replit-url.replit.app
   http://localhost:5000 (for development)
   ```
6. Add **Authorized redirect URIs**:
   ```
   https://kwdzbssuovwemthmiuht.supabase.co/auth/v1/callback
   ```
   (Replace with your actual Supabase project URL)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 2: Supabase Configuration

### 2.1 Configure Google Provider
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Settings** > **External OAuth Providers**
4. Find **Google** and click to configure
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Click **Save**

### 2.2 Configure Redirect URLs
1. In the same section, ensure your **Site URL** is set correctly:
   ```
   https://your-app-domain.com
   ```
2. Add **Redirect URLs** if needed:
   ```
   https://your-app-domain.com/**
   https://your-replit-url.replit.app/**
   ```

## Step 3: Environment Variables

Make sure your `.env` file contains the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://kwdzbssuovwemthmiuht.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Testing the OAuth Flow

### 4.1 Test Flow Steps
1. Navigate to your login page
2. Click "Continue with Google" button
3. Should redirect to Google's consent screen
4. After approval, should redirect back to your app's dashboard
5. User should be logged in with Google account info

### 4.2 Troubleshooting Common Issues

**Error: "redirect_uri_mismatch"**
- Check that your redirect URI in Google Console matches exactly: `https://your-supabase-url.supabase.co/auth/v1/callback`

**Error: "Invalid domain"**
- Ensure your domain is added to Authorized JavaScript origins in Google Console

**Error: "Access blocked"**
- Make sure OAuth consent screen is properly configured
- Add your email as a test user if in development mode

**OAuth button not working**
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Ensure Google provider is enabled in Supabase

## Step 5: Production Considerations

### 5.1 Domain Verification
- Verify your domain ownership in Google Search Console
- Add verified domains to Google OAuth configuration

### 5.2 OAuth Consent Screen Review
- Submit your OAuth consent screen for review if using sensitive scopes
- This is required for production apps with many users

### 5.3 Security Best Practices
- Use HTTPS in production
- Keep client secrets secure
- Regularly rotate credentials
- Monitor OAuth usage in Google Console

## Current Implementation Status

✅ Google OAuth button added to Login page
✅ Google OAuth button added to Register page  
✅ Supabase OAuth integration implemented
✅ Error handling and user feedback
✅ Consistent styling with app theme
⚠️ Requires Google Cloud Console and Supabase configuration

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all URLs match exactly (including https/http)
3. Test with a simple OAuth flow first
4. Contact Supabase support for provider-specific issues

---

Once configured, users will be able to sign in with their Google accounts on both the Login and Sign Up pages, providing a seamless authentication experience.