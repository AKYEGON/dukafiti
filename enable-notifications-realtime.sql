-- Enable realtime for notifications table
-- Run this in your Supabase SQL Editor

-- First, ensure the notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  user_id integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
DROP POLICY IF EXISTS "notifications_policy" ON notifications;
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL USING (true)
  WITH CHECK (true);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Insert a test notification to verify the setup
INSERT INTO notifications (type, title, message, user_id, metadata) 
VALUES (
  'sync_failed', 
  'Realtime Setup Complete', 
  'Notifications table has been configured for real-time updates!',
  1,
  '{"setup": true, "timestamp": "' || now() || '"}'
);