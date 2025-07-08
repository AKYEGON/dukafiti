# DukaFiti Vercel Deployment Guide

## Environment Variables Required

Set these environment variables in your Vercel dashboard:

### Supabase Configuration
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Application Configuration
```
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secure-session-secret-minimum-32-characters
VERCEL_ENV=production
```

## Common Issues and Solutions

### 1. Authentication Fails - "Registration failed" / "Login failed"

**Cause**: Missing environment variables or incorrect session configuration.

**Solution**:
1. Verify all environment variables are set in Vercel dashboard
2. Check Supabase credentials are correct
3. Ensure SESSION_SECRET is set to a secure random string

### 2. CORS Issues

**Cause**: Session cookies not being sent properly in production.

**Solution**: 
- The app automatically configures CORS for production environments
- Ensure your domain is whitelisted in Supabase dashboard

### 3. Database Connection Issues

**Cause**: Supabase tables not created or incorrect permissions.

**Solution**:
1. Run the database setup script in your Supabase SQL editor
2. Verify RLS policies are properly configured
3. Check service role key has admin permissions

## Testing Your Deployment

1. Visit your deployed URL
2. Try to register a new account
3. Try to login with created credentials
4. Verify dashboard loads with data

## Debugging Steps

1. Check Vercel function logs for errors
2. Verify environment variables are set correctly
3. Test Supabase connection in Supabase dashboard
4. Check browser developer tools for network errors

## Support

If authentication continues to fail after following this guide:
1. Check Vercel function logs for specific error messages
2. Verify Supabase project is active and not paused
3. Test direct database connection from Supabase dashboard