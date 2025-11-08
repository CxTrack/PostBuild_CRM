/*
  # Add Auth Settings

  1. New Tables
    - `auth_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `reset_token` (text, nullable)
      - `reset_token_expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `auth_settings` table
    - Add policy for users to manage their own settings
*/

-- Create auth_settings table
CREATE TABLE IF NOT EXISTS auth_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reset_token text,
  reset_token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own auth settings"
  ON auth_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_auth_settings_updated_at
  BEFORE UPDATE ON auth_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_auth_settings_user_id ON auth_settings(user_id);
CREATE INDEX idx_auth_settings_reset_token ON auth_settings(reset_token);