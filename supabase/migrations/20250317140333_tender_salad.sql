/*
  # Fix dummy user authentication
  
  1. Changes
    - Ensure auth.identities record exists for dummy user
    - Update auth.users password if needed
*/

DO $$
DECLARE
  dummy_user_id uuid;
  dummy_email text := 'dummy001@cxtrack.com';
  dummy_password text := '12345678';
BEGIN
  -- Get the user ID
  SELECT id INTO dummy_user_id
  FROM auth.users
  WHERE email = dummy_email;

  IF dummy_user_id IS NULL THEN
    RAISE EXCEPTION 'Dummy user not found';
  END IF;

  -- Update password in auth.users to ensure it's properly hashed
  UPDATE auth.users
  SET encrypted_password = crypt(dummy_password, gen_salt('bf'))
  WHERE id = dummy_user_id;

  -- Ensure auth.identities record exists
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
    coalesce(
      (SELECT id FROM auth.identities WHERE user_id = dummy_user_id LIMIT 1),
      gen_random_uuid()
    ),
    dummy_user_id,
    jsonb_build_object(
      'sub', dummy_user_id,
      'email', dummy_email
    ),
    'email',
    dummy_email,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

END $$;