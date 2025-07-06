-- Create settings table for store profile data
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER DEFAULT 1,
  store_name TEXT,
  owner_name TEXT, 
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations" ON settings;
CREATE POLICY "Allow all operations" ON settings FOR ALL USING (true);

-- Insert default settings if none exist
INSERT INTO settings (store_name, owner_name, address) 
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings);