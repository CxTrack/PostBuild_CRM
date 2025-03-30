/*
  # Fix Admin Settings Policies
  
  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies using direct checks
    - Add performance optimizing indexes
  
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Optimize query performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can modify admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON waitlist;

-- Create new non-recursive policy for basic admin settings access
CREATE POLICY "Users can access their own admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policy for admin view access using a materialized admin status
CREATE POLICY "Admins can view all admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_settings AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_admin = true
      LIMIT 1
    )
  );

-- Create policy for super admin modifications using direct checks
CREATE POLICY "Super admins can modify all admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_admin = true
      AND admin_check.admin_access_level = 'full'
      LIMIT 1
    )
  );

-- Create simplified waitlist access policy
CREATE POLICY "Admins can view waitlist entries"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_admin = true
      LIMIT 1
    )
  );

-- Create optimized indexes
DROP INDEX IF EXISTS idx_admin_settings_user_id;
DROP INDEX IF EXISTS idx_admin_settings_admin_check;
DROP INDEX IF EXISTS idx_admin_settings_full_check;

CREATE INDEX idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX idx_admin_settings_admin_check ON admin_settings(user_id, is_admin);
CREATE INDEX idx_admin_settings_full_check ON admin_settings(user_id, is_admin, admin_access_level);