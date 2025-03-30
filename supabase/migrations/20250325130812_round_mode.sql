/*
  # Add Developer Access Account
  
  1. Changes
    - Add developer account with login access
    - Set up Enterprise subscription
    - Create required profile and settings
*/

DO $$
DECLARE
  dev_user_id uuid;
  enterprise_plan_id uuid;
BEGIN
  -- First ensure we have the Enterprise plan
  SELECT id INTO enterprise_plan_id 
  FROM subscription_plans 
  WHERE name = 'Enterprise Plan';

  IF enterprise_plan_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;

  -- Create developer account if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'amanjotgrewal@hotmail.com') THEN
    -- Create user
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
      'amanjotgrewal@hotmail.com',
      crypt('12345678', gen_salt('bf')),
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
        'sub', dev_user_id,
        'email', 'amanjotgrewal@hotmail.com',
        'email_verified', true
      ),
      'email',
      'amanjotgrewal@hotmail.com',
      now(),
      now(),
      now()
    );

    -- Create profile
    INSERT INTO profiles (user_id, company)
    VALUES (dev_user_id, 'CxTrack')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create user settings
    INSERT INTO user_settings (user_id)
    VALUES (dev_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create admin settings (non-admin)
    INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
    VALUES (dev_user_id, false, 'none')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create Enterprise subscription
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
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;