-- DukaFiti MVP Notifications System
-- Simple implementation with only Credit Reminders and Low Stock Alerts

-- Drop existing notifications table and recreate with simplified structure
DROP TABLE IF EXISTS notifications CASCADE;

-- Create simplified notifications table
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

-- Enable RLS and allow all operations for now
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for MVP" ON notifications FOR ALL USING (true);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert test notifications to verify setup
INSERT INTO notifications (type, entity_id, title, message) VALUES
('low_stock', gen_random_uuid(), 'Low Stock Alert', 'Rice is low: 5 left'),
('credit', gen_random_uuid(), 'Payment Reminder', 'John Doe owes KES 1,500');

-- Show success message
SELECT 'MVP Notifications table created successfully!' as status;