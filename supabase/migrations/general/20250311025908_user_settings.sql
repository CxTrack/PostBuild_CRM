/*
  # Create user settings table with dashboard preferences
  
  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `dashboard_settings` (jsonb, default settings for dashboard)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for users to manage their own settings
    - Create unique index on user_id
    
  3. Triggers
    - Add trigger to update updated_at timestamp
    - Add trigger to create default settings for new users
*/

-- Create trigger function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_settings jsonb DEFAULT '{
    "showSalesChart": true,
    "showPurchasesChart": true,
    "showInventoryStatus": true,
    "showTodayEvents": true
  }'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on user_id if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "user_settings_policy" ON public.user_settings;

-- Create policy for users to manage their own settings
CREATE POLICY "user_settings_policy" 
ON public.user_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;

-- Create trigger to automatically create settings for new users
CREATE TRIGGER create_user_settings_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_settings();

-- Create default entries for existing users
INSERT INTO public.user_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_settings);