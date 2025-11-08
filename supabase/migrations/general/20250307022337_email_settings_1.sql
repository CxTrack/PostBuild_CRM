/*
  # Add email settings table

  1. New Tables
    - `email_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `smtp_host` (text)
      - `smtp_port` (integer)
      - `smtp_username` (text)
      - `smtp_password` (text)
      - `from_email` (text)
      - `from_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_settings` table
    - Add policy for authenticated users to manage their own email settings
*/

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create email_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS if not already enabled
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own email settings" ON email_settings;

-- Create policy
CREATE POLICY "Users can manage their own email settings"
  ON email_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_email_settings_updated_at ON email_settings;

CREATE TRIGGER set_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();