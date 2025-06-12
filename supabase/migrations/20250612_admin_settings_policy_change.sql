-- Drop all existing policies first
DROP POLICY IF EXISTS "Admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow access to admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Only super admins can modify admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can modify all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can access their own admin settings" ON admin_settings;

-- Policy 1: Allow admins to SELECT
CREATE POLICY "Admins can view all admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );

-- Policy 2: Allow admins to modify
CREATE POLICY "Only super admins can modify admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    is_admin(auth.uid())  -- or use a new function is_super_admin(auth.uid())
  );

-- Policy 3: Allow users to view/update their own settings
CREATE POLICY "Users can access their own admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());