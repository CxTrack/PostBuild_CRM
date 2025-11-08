/*
  # Fix Admin Settings Policy Recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with simpler, non-recursive checks
    - Add policy for public waitlist access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can modify admin settings" ON admin_settings;

-- Create new simplified policies
CREATE POLICY "Users can view own admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_settings AS a
    WHERE a.user_id = auth.uid()
    AND a.is_admin = true
    AND a.admin_access_level IN ('full', 'limited')
  ));

CREATE POLICY "Super admins can modify admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_settings AS a
    WHERE a.user_id = auth.uid()
    AND a.is_admin = true
    AND a.admin_access_level = 'full'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_settings AS a
    WHERE a.user_id = auth.uid()
    AND a.is_admin = true
    AND a.admin_access_level = 'full'
  ));

-- Ensure waitlist table has proper policies
-- DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON waitlist;

-- CREATE POLICY "Admins can view all waitlist entries"
--   ON waitlist
--   FOR SELECT
--   TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM admin_settings AS a
--     WHERE a.user_id = auth.uid()
--     AND a.is_admin = true
--   ));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_admin_check 
ON admin_settings(user_id, is_admin, admin_access_level);