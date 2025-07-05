# DukaFiti - Serverless Deployment Guide

DukaFiti is now a completely serverless application powered by Supabase and deployable on Vercel. This guide will help you deploy and manage your own instance of DukaFiti.

## Architecture Overview

- **Frontend**: React PWA built with Vite
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password
- **Edge Functions**: Supabase Edge Functions for M-Pesa integration
- **Hosting**: Vercel for fast global deployment
- **Payments**: M-Pesa STK Push for subscriptions

## Prerequisites

1. **Supabase Account**: [Sign up at supabase.com](https://supabase.com)
2. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
3. **M-Pesa Developer Account**: [Safaricom Developer Portal](https://developer.safaricom.co.ke)
4. **Node.js**: Version 18 or higher

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd dukafiti
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the database setup:

```sql
-- Copy and paste the contents of supabase/schema.sql
-- into your Supabase SQL Editor and run it
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_FUNCTIONS_URL=your_supabase_project_url/functions/v1

# M-Pesa Configuration (for Supabase Edge Functions)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_BASE_URL=https://sandbox.safaricom.co.ke  # Use https://api.safaricom.co.ke for production
```

### 4. Deploy Supabase Edge Functions

Install the Supabase CLI:
```bash
npm install -g supabase
```

Login and deploy functions:
```bash
supabase login
supabase functions deploy subscription-billing
supabase functions deploy mpesa-stk-push
supabase functions deploy mpesa-callback
```

Set environment variables for edge functions:
```bash
supabase secrets set MPESA_CONSUMER_KEY=your_key
supabase secrets set MPESA_CONSUMER_SECRET=your_secret
supabase secrets set MPESA_BUSINESS_SHORTCODE=your_shortcode
supabase secrets set MPESA_PASSKEY=your_passkey
```

### 5. Deploy to Vercel

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_FUNCTIONS_URL`

3. Deploy:
```bash
vercel deploy
```

## Database Schema

The application includes the following tables:

- **user_profiles**: Extended user information
- **subscriptions**: Subscription management with trial/paid status
- **mpesa_transactions**: M-Pesa payment tracking
- **products**: Inventory management
- **customers**: Customer information and credit tracking
- **orders**: Sales transactions
- **order_items**: Order line items
- **notifications**: In-app notifications
- **settings**: User preferences and store configuration

## Subscription Flow

### Free Trial (14 Days)
1. User signs up and provides phone number
2. Trial subscription is created automatically
3. Full access to all features for 14 days

### Monthly Subscription (KES 200)
1. User chooses to upgrade to paid plan
2. M-Pesa STK push is initiated via edge function
3. User enters M-Pesa PIN on their phone
4. Payment callback updates subscription status
5. User gets full access for the month

## M-Pesa Integration

### Sandbox Setup
1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create a new app and get your credentials
3. Use sandbox shortcode `174379` for testing
4. Test phone number format: `254708374149`

### Production Setup
1. Complete business verification with Safaricom
2. Get production credentials and shortcode
3. Update `MPESA_BASE_URL` to production URL
4. Test thoroughly before going live

## Security Features

- **Row Level Security**: All database tables have RLS policies
- **User Isolation**: Users can only access their own data
- **Secure Authentication**: Supabase Auth handles all user management
- **HTTPS Only**: All communications are encrypted
- **Environment Variables**: Sensitive data stored securely

## Monitoring and Analytics

### Supabase Dashboard
- Monitor database performance
- View real-time user activity
- Track Edge Function execution
- Monitor authentication events

### Vercel Analytics
- Track application performance
- Monitor deployment status
- View user engagement metrics

## Customization

### Branding
- Update `client/public/manifest.json` for PWA branding
- Modify color scheme in `client/src/index.css`
- Replace logo and icons in `client/public/`

### Pricing
- Modify subscription amounts in edge functions
- Update pricing display in `client/src/pages/pricing.tsx`
- Customize trial period in subscription logic

### Features
- Add new database tables with proper RLS policies
- Create additional edge functions for business logic
- Extend the React components for new functionality

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Supabase URL and keys
   - Check RLS policies are correctly set
   - Ensure user is authenticated

2. **M-Pesa Payments Not Working**
   - Verify M-Pesa credentials in Supabase secrets
   - Check phone number format (254XXXXXXXX)
   - Ensure callback URL is accessible

3. **Build Errors**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Verify all environment variables are set

4. **Authentication Issues**
   - Check Supabase Auth configuration
   - Verify redirect URLs in Supabase dashboard
   - Ensure RLS policies allow user access

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG=true
```

This will show detailed logs in the browser console.

## Support

For technical support:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [Vercel Documentation](https://vercel.com/docs)
- Contact Safaricom for M-Pesa API issues

## License

DukaFiti is licensed under the MIT License. See LICENSE file for details.

---

**Ready to Launch**: Your serverless DukaFiti deployment is now ready to serve thousands of users with automatic scaling and global distribution!