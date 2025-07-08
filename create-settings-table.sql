-- Create settings table for store profile data
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  store_name TEXT,
  owner_name TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.settings
  FOR ALL USING (true);

-- Insert a default row if none exists
INSERT INTO public.settings (store_name, owner_name, address)
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.settings);