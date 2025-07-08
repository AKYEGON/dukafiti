-- DukaFiti Notifications System Setup
-- Copy and paste this SQL into your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
DROP POLICY IF EXISTS "Allow all operations for now" ON notifications;
CREATE POLICY "Allow all operations for now" ON notifications FOR ALL USING (true);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert a test notification to verify setup
INSERT INTO notifications (type, title, message, metadata) 
VALUES (
  'sync_failed', 
  'Setup Complete', 
  'Notifications table has been created successfully!',
  '{"setup": true, "timestamp": "' || now() || '"}'
);

-- Verify the table was created correctly
SELECT 'Notifications table created successfully!' as status;
SELECT COUNT(*) as notification_count FROM notifications;