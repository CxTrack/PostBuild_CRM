/*
  # Add admin access for info@cxtrack.com
  
  1. Changes
    - Create admin user if not exists
    - Set up admin permissions
    - Create Enterprise subscription
*/

DO $$
DECLARE
  admin_user_id uuid;
  enterprise_plan_id uuid;
  admin_email text := 'info@cxtrack.com';
  admin_password text := '12345678';
BEGIN
  -- First check if user exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Create user if doesn't exist
  IF admin_user_id IS NULL THEN
    -- Generate new UUID
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      is_super_admin,
      role,
      aud
    )
    VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'CxTrack Admin'),
      now(),
      now(),
      '',
      false,
      'authenticated',
      'authenticated'
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      created_at,
      updated_at,
      last_sign_in_at
    ) 
    VALUES (
      gen_random_uuid(),
      admin_user_id,
      jsonb_build_object(
        'sub', admin_user_id::text,
        'email', admin_email,
        'email_verified', true
      ),
      'email',
      admin_email,
      now(),
      now(),
      now()
    );
  END IF;

  -- Get Enterprise plan ID
  SELECT id INTO enterprise_plan_id 
  FROM subscription_plans 
  WHERE name = 'Enterprise Plan';

  IF enterprise_plan_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;

  -- Create or update profile
  INSERT INTO profiles (user_id, company)
  VALUES (admin_user_id, 'CxTrack')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create or update user settings
  INSERT INTO user_settings (user_id)
  VALUES (admin_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create or update admin settings with full access
  INSERT INTO admin_settings (
    user_id,
    is_admin,
    admin_access_level
  )
  VALUES (
    admin_user_id,
    true,
    'full'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_admin = true,
    admin_access_level = 'full',
    updated_at = now();

  -- Create or update Enterprise subscription
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
    admin_user_id,
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