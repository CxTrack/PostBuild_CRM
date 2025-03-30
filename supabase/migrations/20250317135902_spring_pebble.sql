/*
  # Fix dummy user authentication
  
  1. Changes
    - Properly set up dummy user auth credentials
    - Ensure password is correctly hashed
    - Set proper auth identities and email verification
*/

DO $$
DECLARE
  dummy_user_id uuid;
  dummy_email text := 'dummy001@cxtrack.com';
  dummy_password text := '12345678';
BEGIN
  -- Get or create user ID
  SELECT id INTO dummy_user_id
  FROM auth.users
  WHERE email = dummy_email;

  IF dummy_user_id IS NULL THEN
    -- Create new user ID
    dummy_user_id := gen_random_uuid();

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
      dummy_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      dummy_email,
      crypt(dummy_password, gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Test Account'),
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
      created_at,
      updated_at,
      last_sign_in_at
    ) 
    VALUES (
      gen_random_uuid(),
      dummy_user_id,
      jsonb_build_object(
        'sub', dummy_user_id,
        'email', dummy_email
      ),
      'email',
      now(),
      now(),
      now()
    );

    -- Create profile
    INSERT INTO profiles (user_id, company)
    VALUES (dummy_user_id, 'Test Company')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create user settings
    INSERT INTO user_settings (user_id)
    VALUES (dummy_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create admin settings (non-admin)
    INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
    VALUES (dummy_user_id, false, 'none')
    ON CONFLICT (user_id) DO NOTHING;

    -- Get Enterprise plan ID
    WITH enterprise_plan AS (
      SELECT id FROM subscription_plans WHERE name = 'Enterprise Plan' LIMIT 1
    )
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
      dummy_user_id,
      enterprise_plan.id,
      'active',
      now(),
      now() + interval '100 years',
      false,
      'dummy_enterprise_sub',
      'dummy_enterprise_customer'
    FROM enterprise_plan
    ON CONFLICT (user_id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now();
  END IF;
END $$;