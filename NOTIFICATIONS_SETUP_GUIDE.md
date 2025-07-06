# DukaFiti Notifications System Setup Guide

## Overview

The notifications system has been successfully implemented with real-time updates, but requires a one-time database setup in Supabase.

## Quick Setup (2 minutes)

### Step 1: Create the Notifications Table

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL command:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('low_stock', 'payment_received', 'sync_failed', 'sale_completed', 'customer_payment')),
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  user_id integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS and allow all operations for now
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for now" ON notifications;
CREATE POLICY "Allow all operations for now" ON notifications FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert test notification
INSERT INTO notifications (type, title, message) 
VALUES ('sync_failed', 'Setup Complete', 'Notifications system is ready!');
```

3. Click **Run** to execute the SQL

### Step 2: Test the System

1. Go to your **DukaFiti Dashboard**
2. Scroll down to the **Notifications Testing Center**
3. Click any **Test** button to create a sample notification
4. Check the **bell icon** in the top bar for the red badge
5. Click the **bell icon** to see your notifications panel

## Features Implemented

✅ **Real-time Notifications** - Instant updates via Supabase realtime  
✅ **Notification Types**:
- 🟠 Low Stock Alerts
- 🟢 Payment Received  
- 🔴 Sync Failures
- 🔵 Sale Completed
- 🟣 Customer Payments

✅ **Smart Navigation** - Click notifications to go to relevant pages  
✅ **Mark as Read** - Individual and bulk read functionality  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Keyboard Support** - ESC to close, accessible interface

## Automatic Triggers

The system automatically creates notifications for:

- **Sales completion** - Every successful sale
- **Customer payments** - When recording repayments  
- **Low stock** - When products fall below threshold (needs database trigger)
- **Sync failures** - When offline sync fails

## Troubleshooting

### "Failed to create test notification"
- Run the SQL setup script in Supabase SQL Editor
- Check your Supabase connection in the browser console

### Notifications not showing
- Refresh the page after creating the table
- Check browser console for any errors
- Verify the bell icon has a red badge

### Real-time not working
- Ensure `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;` was run
- Check Supabase project settings for realtime enabled

## Development Notes

- Testing interface will be removed in production
- Notification triggers can be customized in `client/src/lib/supabase-data.ts`
- UI components are in `client/src/components/notifications/`
- Real-time subscription managed by `useNotifications` hook

---

**Next Steps**: Once table is created, remove the testing panel and the system will work seamlessly with real business events!