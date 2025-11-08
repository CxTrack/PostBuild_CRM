/*
  # Fix admin access without modifying system roles
  
  1. Changes
    - Grant admin access through admin_settings table
    - Set proper metadata in auth.users
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

  -- Update auth.users metadata
  UPDATE auth.users SET
    email_confirmed_at = now(),
    last_sign_in_at = now(),
    raw_user_meta_data = jsonb_build_object(
      'full_name', COALESCE(raw_user_meta_data->>'full_name', 'CxTrack Admin'),
      'is_admin', true,
      'admin_access_level', 'full'
    )
  WHERE id = target_user_id;

  -- Update auth.identities metadata
  UPDATE auth.identities SET
    identity_data = jsonb_build_object(
      'sub', target_user_id::text,
      'email', (SELECT email FROM auth.users WHERE id = target_user_id),
      'email_verified', true,
      'is_admin', true,
      'admin_access_level', 'full'
    )
  WHERE user_id = target_user_id;

  -- Set admin privileges in admin_settings
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

  -- Ensure Enterprise subscription
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