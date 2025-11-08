/*
  # Add dummy test account
  
  1. Changes
    - Create dummy test account for development
    - Set up required profile and settings
    - Assign free plan subscription
*/

-- Create dummy user account without email verification
DO $$
DECLARE
  dummy_user_id uuid := gen_random_uuid();
  free_plan_id uuid;
BEGIN
  -- Insert user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@cxtrack.com') THEN
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
      role
    )
    VALUES (
      dummy_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'info@cxtrack.com',
      crypt('Dogfish2023', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Test Account'),
      now(),
      now(),
      '',
      false,
      'authenticated'
    );
  ELSE
    -- Get existing user's ID
    SELECT id INTO dummy_user_id
    FROM auth.users
    WHERE email = 'info@cxtrack.com';
  END IF;

  -- Get free plan ID
  SELECT id INTO free_plan_id 
  FROM subscription_plans 
  WHERE price = 0 AND name = 'Free Plan'
  LIMIT 1;

  -- Create profile if not exists
  INSERT INTO profiles (user_id, company)
  VALUES (dummy_user_id, 'Demo Company')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create subscription if not exists
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  )
  VALUES (
    dummy_user_id,
    free_plan_id,
    'active',
    now(),
    now() + interval '100 years',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user settings if not exists
  INSERT INTO user_settings (user_id)
  VALUES (dummy_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create admin settings if not exists
  INSERT INTO admin_settings (user_id, is_admin, admin_access_level)
  VALUES (dummy_user_id, false, 'none')
  ON CONFLICT (user_id) DO NOTHING;

END $$;