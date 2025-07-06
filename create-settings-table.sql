-- Create settings table for DukaFiti store profile
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    store_name TEXT DEFAULT '',
    owner_name TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all access (for simplicity)
CREATE POLICY "Allow all access to settings" ON settings 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Insert default settings row if none exists
INSERT INTO settings (store_name, owner_name, address) 
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);