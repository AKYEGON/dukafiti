-- DukaFiti Notifications System Setup
-- Run this in your Supabase SQL editor

-- Create notifications table (simplified structure for compatibility)
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- Function to create low stock notifications
CREATE OR REPLACE FUNCTION check_low_stock_and_notify()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stock has fallen below threshold
  IF NEW.stock IS NOT NULL AND NEW.low_stock_threshold IS NOT NULL AND 
     NEW.stock <= NEW.low_stock_threshold AND 
     (OLD.stock IS NULL OR OLD.stock > NEW.low_stock_threshold) THEN
    
    INSERT INTO notifications (type, title, message, user_id, metadata)
    VALUES (
      'low_stock',
      'Low Stock Alert',
      'Product "' || NEW.name || '" is running low (Stock: ' || NEW.stock || ')',
      1, -- Default to first user, adjust as needed
      jsonb_build_object('product_id', NEW.id, 'current_stock', NEW.stock, 'threshold', NEW.low_stock_threshold)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock notifications
DROP TRIGGER IF EXISTS trigger_low_stock_notification ON products;
CREATE TRIGGER trigger_low_stock_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock_and_notify();

-- Function to create payment notifications
CREATE OR REPLACE FUNCTION create_payment_notification(
  payment_type text,
  customer_name text,
  amount numeric,
  reference text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (type, title, message, user_id, metadata)
  VALUES (
    'payment_received',
    'Payment Received',
    customer_name || ' made a payment of KES ' || amount::text,
    1, -- Default to first user
    jsonb_build_object('payment_type', payment_type, 'customer_name', customer_name, 'amount', amount, 'reference', reference)
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create sync failure notifications
CREATE OR REPLACE FUNCTION create_sync_failure_notification(
  error_message text,
  retry_count integer DEFAULT 0
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (type, title, message, user_id, metadata)
  VALUES (
    'sync_failed',
    'Sync Failed',
    'Failed to sync data after ' || retry_count || ' retries: ' || error_message,
    1, -- Default to first user
    jsonb_build_object('error_message', error_message, 'retry_count', retry_count, 'timestamp', now())
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;