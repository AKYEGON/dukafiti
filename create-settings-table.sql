-- Create settings table for store profiles
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  store_name VARCHAR(255),
  owner_name VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Add some sample data for testing
INSERT INTO settings (user_id, store_name, owner_name, address) VALUES
('00000000-0000-0000-0000-000000000001', 'Sample Store', 'John Doe', '123 Main Street, Nairobi')
ON CONFLICT DO NOTHING;