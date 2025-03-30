/*
  # Fix Developer Account Authentication
  
  1. Changes
    - Properly set up developer account with correct auth settings
    - Ensure password is correctly hashed
    - Set up proper auth identities
*/

DO $$
DECLARE
  dev_user_id uuid;
  enterprise_plan_id uuid;
  dev_email text := 'amanjotgrewal@hotmail.com';
  dev_password text := '12345678';
BEGIN
  -- First ensure the user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = dev_email) THEN
    -- Get existing user ID
    SELECT id INTO dev_user_id FROM auth.users WHERE email = dev_email;
    
    -- Update password and settings
    UPDATE auth.users SET
      encrypted_password = crypt(dev_password, gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      last_sign_in_at = now(),
      raw_user_meta_data = jsonb_build_object('full_name', 'Amanjot Grewal'),
      is_super_admin = false,
      role = 'authenticated'
    WHERE id = dev_user_id;

    -- Ensure auth identity exists
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
      dev_user_id,
      jsonb_build_object(
        'sub', dev_user_id::text,
        'email', dev_email,
        'email_verified', true
      ),
      'email',
      dev_email,
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) 
    DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = now(),
      last_sign_in_at = now();

  ELSE
    -- Create new user
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000'::uuid,
      dev_email,
      crypt(dev_password, gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Amanjot Grewal'),
      now(),
      now(),
      '',
      false,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO dev_user_id;

    -- Create auth identity
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
      dev_user_id,
      jsonb_build_object(
        'sub', dev_user_id::text,
        'email', dev_email,
        'email_verified', true
      ),
      'email',
      dev_email,
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

  -- Ensure profile exists
  INSERT INTO profiles (user_id, company)
  VALUES (dev_user_id, 'CxTrack')
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure user settings exist
  INSERT INTO user_settings (user_id)
  VALUES (dev_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure admin settings exist
  INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
  VALUES (dev_user_id, false, 'none')
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure Enterprise subscription exists
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
    dev_user_id,
    enterprise_plan_id,
    'active',
    now(),
    now() + interval '100 years',
    false,
    'dev_enterprise_sub',
    'dev_enterprise_customer'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();

END $$;