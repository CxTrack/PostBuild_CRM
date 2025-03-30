/*
  # Drop and recreate waitlist policies
  
  1. Changes
    - Drop existing policy
    - Create new policy with proper checks
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view waitlist entries" ON waitlist;

-- Create new policy
CREATE POLICY "Admins can view all waitlist entries" ON waitlist
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings a
      WHERE a.user_id = auth.uid() 
      AND a.is_admin = true
    )
  );