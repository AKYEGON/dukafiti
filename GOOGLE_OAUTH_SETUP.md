# Google OAuth Setup Guide for DukaFiti

## Overview
This guide explains how to set up Google OAuth authentication with Supabase for DukaFiti.

## Current Status
- **Google OAuth**: Currently disabled due to redirect URI configuration requirements
- **Email/Password**: Fully functional and recommended for immediate use

## Error Explanation
The "redirect_uri_mismatch" error occurs because:
1. Google OAuth requires exact redirect URLs to be whitelisted
2. Replit preview URLs change and are dynamic
3. The OAuth app in Google Console needs to be configured with the specific Replit domain

## Setup Steps (For Production Deployment)

### 1. Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-domain.com/auth/callback`
   - `https://kwdzbssuovwemthmiuht.supabase.co/auth/v1/callback`

### 2. Configure Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your Google OAuth Client ID and Client Secret
5. Configure redirect URLs in Site URL settings

### 3. Update Application
1. Update environment variables:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Enable Google OAuth in auth context
3. Deploy to production domain

## For Development
Use email/password authentication which is fully configured and working.

## Alternative Solutions
1. **Magic Link**: Email-based authentication (can be enabled)
2. **Phone Authentication**: SMS-based authentication (requires Twilio setup)
3. **Other Providers**: GitHub, Discord, etc. (easier setup than Google)