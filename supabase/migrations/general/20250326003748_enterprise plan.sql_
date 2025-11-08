/*
  # Set specific user as admin
  
  1. Changes
    - Set specified user ID as admin
    - Grant full admin access
    - Ensure Enterprise subscription
*/

DO $$
DECLARE
  enterprise_plan_id uuid;
  target_user_id uuid := '22b89209-03fb-4484-8808-3b9bce6a6907';
BEGIN
  -- Get Enterprise plan ID
  SELECT id INTO enterprise_plan_id 
  FROM subscription_plans 
  WHERE name = 'Enterprise Plan';

  IF enterprise_plan_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;

  -- Update auth.users to grant full access
  UPDATE auth.users SET
    is_super_admin = true,
    email_confirmed_at = now(),
    last_sign_in_at = now(),
    raw_user_meta_data = jsonb_build_object(
      'full_name', 'CxTrack Admin',
      'is_super_admin', true,
      'is_admin', true,
      'admin_access_level', 'full'
    )
  WHERE id = target_user_id;

  -- Update auth.identities to ensure full access
  UPDATE auth.identities SET
    identity_data = jsonb_build_object(
      'sub', target_user_id::text,
      'email', (SELECT email FROM auth.users WHERE id = target_user_id),
      'email_verified', true,
      'is_super_admin', true,
      'is_admin', true,
      'admin_access_level', 'full'
    )
  WHERE user_id = target_user_id;

  -- Update admin_settings to grant full access
  INSERT INTO admin_settings (
    user_id,
    is_admin,
    admin_access_level,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
    true,
    'full',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_admin = true,
    admin_access_level = 'full',
    updated_at = now();

  -- Update subscription to Enterprise plan
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
  VALUES (
    target_user_id,
    enterprise_plan_id,
    'active',
    now(),
    now() + interval '100 years',
    false,
    'admin_enterprise_sub',
    'admin_enterprise_customer'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = enterprise_plan_id,
    status = 'active',
    current_period_end = now() + interval '100 years',
    updated_at = now();

END $$;