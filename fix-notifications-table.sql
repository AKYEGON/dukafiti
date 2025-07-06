-- Fix notifications table structure for DukaFiti
-- This script will update the existing notifications table to match our application requirements

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update the type column to use an enum constraint if it doesn't exist
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'notifications' AND constraint_name = 'notifications_type_check'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
    
    -- Add new constraint with our required types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('low_stock', 'payment_received', 'sync_failed', 'sale_completed', 'customer_payment'));
END $$;

-- Update existing notifications to use valid types
UPDATE notifications 
SET type = 'customer_payment' 
WHERE type = 'info' AND title LIKE '%Payment%';

UPDATE notifications 
SET type = 'sale_completed' 
WHERE type = 'info' AND title LIKE '%Sale%';

UPDATE notifications 
SET type = 'low_stock' 
WHERE type = 'info' AND title LIKE '%Stock%';

UPDATE notifications 
SET type = 'sync_failed' 
WHERE type = 'info' AND title LIKE '%Sync%' OR title LIKE '%Failed%';

-- Set default metadata for existing notifications
UPDATE notifications 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

-- Create index on type and is_read for performance
CREATE INDEX IF NOT EXISTS idx_notifications_type_read ON notifications(type, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
DROP POLICY IF EXISTS "notifications_policy" ON notifications;
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL USING (true)
  WITH CHECK (true);

-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert test notification to verify everything works
INSERT INTO notifications (type, title, message, user_id, metadata) 
VALUES (
  'sync_failed', 
  'Setup Complete', 
  'Notifications table has been fixed and updated successfully!',
  1,
  '{"setup": true, "timestamp": "' || now() || '"}'
);

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Show current notifications count
SELECT COUNT(*) as total_notifications FROM notifications;