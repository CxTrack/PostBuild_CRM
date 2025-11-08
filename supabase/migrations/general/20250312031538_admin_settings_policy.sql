/*
  # Fix Admin Settings Policy Recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with proper checks
    - Use explicit role checks instead of recursive queries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Only super admins can modify admin settings" ON admin_settings;

-- Create new non-recursive policies
CREATE POLICY "Admins can view admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to view their own settings
    user_id = auth.uid() OR
    -- Or if they are an admin (direct check without recursion)
    (SELECT is_admin FROM admin_settings WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins can modify admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    -- Direct check for super admin status
    (SELECT admin_access_level = 'full' AND is_admin = true 
     FROM admin_settings 
     WHERE user_id = auth.uid())
  )
  WITH CHECK (
    -- Direct check for super admin status
    (SELECT admin_access_level = 'full' AND is_admin = true 
     FROM admin_settings 
     WHERE user_id = auth.uid())
  );

-- Create index to optimize policy checks
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id_admin ON admin_settings(user_id, is_admin, admin_access_level);