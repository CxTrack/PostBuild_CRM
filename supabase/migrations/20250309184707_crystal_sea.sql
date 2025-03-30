/*
  # Add Admin Privileges

  1. New Tables
    - `admin_settings` table to store admin configuration
    - `feature_access` table to control feature access by subscription plan

  2. Security
    - Enable RLS on new tables
    - Add policies for admin access
    - Add trigger to set admin status on user registration

  3. Initial Data
    - Set maniksharmawork@gmail.com as admin
    - Configure default feature access for subscription plans
*/

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false,
  admin_access_level text DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_access_level CHECK (admin_access_level IN ('none', 'full', 'limited'))
);

-- Create feature_access table
CREATE TABLE IF NOT EXISTS feature_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  is_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings a 
      WHERE a.user_id = auth.uid() 
      AND a.is_admin = true
    )
  );

CREATE POLICY "Only super admins can modify admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings a 
      WHERE a.user_id = auth.uid() 
      AND a.is_admin = true 
      AND a.admin_access_level = 'full'
    )
  );

CREATE POLICY "All users can view feature access"
  ON feature_access
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify feature access"
  ON feature_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings a 
      WHERE a.user_id = auth.uid() 
      AND a.is_admin = true
    )
  );

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_settings
    WHERE user_id = $1 AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(user_id uuid, feature_name text)
RETURNS boolean AS $$
DECLARE
  is_user_admin boolean;
  user_plan_id uuid;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO is_user_admin FROM admin_settings WHERE user_id = $1;
  IF is_user_admin THEN
    RETURN true;
  END IF;

  -- Get user's subscription plan
  SELECT plan_id INTO user_plan_id 
  FROM subscriptions 
  WHERE user_id = $1 
  AND status = 'active' 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check feature access for plan
  RETURN EXISTS (
    SELECT 1 FROM feature_access
    WHERE plan_id = user_plan_id
    AND feature_name = $2
    AND is_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'maniksharmawork@gmail.com' THEN
    INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
    VALUES (NEW.id, true, 'full');
  ELSE
    INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
    VALUES (NEW.id, false, 'none');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Set initial admin user
INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
SELECT id, true, 'full'
FROM auth.users
WHERE email = 'maniksharmawork@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = true,
    admin_access_level = 'full';

-- Configure default feature access
INSERT INTO feature_access (plan_id, feature_name, is_enabled)
SELECT 
  p.id,
  f.feature_name,
  CASE 
    WHEN p.name = 'Free' THEN 
      f.feature_name = ANY(ARRAY['basic_invoicing', 'basic_customers'])
    WHEN p.name = 'Basic' THEN
      f.feature_name = ANY(ARRAY['basic_invoicing', 'basic_customers', 'email_invoices', 'basic_reporting'])
    WHEN p.name = 'Business' THEN
      f.feature_name != 'ai_features'
    ELSE true
  END as is_enabled
FROM subscription_plans p
CROSS JOIN (
  SELECT unnest(ARRAY[
    'basic_invoicing',
    'basic_customers',
    'email_invoices',
    'basic_reporting',
    'advanced_reporting',
    'inventory_management',
    'ai_features',
    'api_access'
  ]) as feature_name
) f;