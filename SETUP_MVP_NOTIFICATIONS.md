# MVP Notifications Setup Guide

## Step 1: Run This SQL in Supabase Dashboard

Go to your Supabase project → SQL Editor and run this script:

```sql
-- Drop the old notifications table and recreate with MVP structure
DROP TABLE IF EXISTS notifications CASCADE;

-- Create simplified MVP notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('credit', 'low_stock')),
  entity_id uuid NOT NULL,  -- customer_id or product_id
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_entity_id ON notifications(entity_id);

-- Enable RLS and allow all operations for MVP
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for MVP" ON notifications FOR ALL USING (true);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert test notifications to verify setup
INSERT INTO notifications (type, entity_id, title, message) VALUES
('low_stock', gen_random_uuid(), 'Low Stock Alert', 'Rice is low: 5 left'),
('credit', gen_random_uuid(), 'Payment Reminder', 'John Doe owes KES 1,500');

-- Verify table creation
SELECT 'MVP Notifications table created successfully!' as status;
SELECT COUNT(*) as notification_count FROM notifications;
```

## Step 2: Test the System

After running the SQL:

1. **Go to your DukaFiti Dashboard** 
2. **Look for the "MVP Notifications Testing" section**
3. **Click the test buttons**:
   - "⚠️ Test Low Stock Alert" 
   - "💳 Test Credit Reminder"
   - "🔍 Run Credit Check"

4. **Check the notification bell** in the top bar for:
   - Red badge showing unread count
   - Real-time notifications appearing
   - Auto-mark-as-read when opening dropdown

## QA Checklist

Verify these features work:

- ☐ Only two notification types appear (credit and low_stock)
- ☐ Real-time alerts show instantly under the bell
- ☐ Badge indicator appears if any notifications are unread  
- ☐ Opening dropdown marks all as read and clears badge
- ☐ Clicking credit notification navigates to customers page
- ☐ Clicking low stock notification navigates to inventory page
- ☐ Panel UI is clean, scrollable, and responsive

## What Was Changed

1. **Simplified Table Structure**: Removed complex fields, kept only essential MVP columns
2. **Two Notification Types Only**: Credit reminders and low stock alerts
3. **Real-time Updates**: Using Supabase real-time subscriptions
4. **Auto-mark-as-read**: When notification dropdown opens
5. **Smart Navigation**: Click notifications to go to relevant pages

This replaces the complex notification system with a simple, focused MVP that handles only the two most critical business alerts.