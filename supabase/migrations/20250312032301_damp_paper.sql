/*
  # Fix Admin Settings Policy Recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new simplified policies with LIMIT clauses
    - Add proper indexes for performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can modify admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON waitlist;

-- Create new simplified policies for admin_settings
CREATE POLICY "Users can view own admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND is_admin = true
      LIMIT 1
    )
  );

CREATE POLICY "Super admins can modify admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND is_admin = true 
      AND admin_access_level = 'full'
      LIMIT 1
    )
  );

-- Create simplified policy for waitlist
CREATE POLICY "Admins can view all waitlist entries"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND is_admin = true
      LIMIT 1
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_admin_check ON admin_settings(user_id, is_admin);
CREATE INDEX IF NOT EXISTS idx_admin_settings_full_check ON admin_settings(user_id, is_admin, admin_access_level);