/*
  # Fix Developer Access Level
  
  1. Changes
    - Update admin settings to give developer full admin access
    - Ensure Enterprise subscription is active
*/

DO $$
DECLARE
  dev_user_id uuid;
  enterprise_plan_id uuid;
  dev_email text := 'amanjotgrewal@hotmail.com';
BEGIN
  -- Get the developer's user ID
  SELECT id INTO dev_user_id 
  FROM auth.users 
  WHERE email = dev_email;

  IF dev_user_id IS NULL THEN
    RAISE EXCEPTION 'Developer user not found';
  END IF;

  -- Get Enterprise plan ID
  SELECT id INTO enterprise_plan_id 
  FROM subscription_plans 
  WHERE name = 'Enterprise Plan';

  IF enterprise_plan_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;

  -- Update admin settings to give full admin access
  UPDATE admin_settings
  SET 
    is_admin = true,
    admin_access_level = 'full',
    updated_at = now()
  WHERE user_id = dev_user_id;

  -- If no admin settings exist, create them
  INSERT INTO admin_settings (
    user_id,
    is_admin,
    admin_access_level,
    created_at,
    updated_at
  )
  SELECT
    dev_user_id,
    true,
    'full',
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM admin_settings WHERE user_id = dev_user_id
  );

  -- Ensure Enterprise subscription is active
  UPDATE subscriptions
  SET 
    plan_id = enterprise_plan_id,
    status = 'active',
    current_period_end = now() + interval '100 years',
    updated_at = now()
  WHERE user_id = dev_user_id;

  -- If no subscription exists, create one
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    stripe_subscription_id,
    stripe_customer_id
  )
  SELECT
    dev_user_id,
    enterprise_plan_id,
    'active',
    now(),
    now() + interval '100 years',
    false,
    'dev_enterprise_sub',
    'dev_enterprise_customer'
  WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = dev_user_id
  );

END $$;