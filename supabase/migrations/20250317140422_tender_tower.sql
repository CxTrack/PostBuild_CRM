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

  -- Delete any existing identity records for this user to avoid conflicts
  DELETE FROM auth.identities WHERE user_id = dummy_user_id;

  -- Create fresh identity record with correct provider_id
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
    dummy_user_id,
    jsonb_build_object(
      'sub', dummy_user_id,
      'email', dummy_email,
      'email_verified', true
    ),
    'email',
    dummy_email,
    now(),
    now(),
    now()
  );

  -- Update user's password and ensure email is confirmed
  UPDATE auth.users SET
    encrypted_password = crypt(dummy_password, gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now(),
    last_sign_in_at = now(),
    confirmation_sent_at = now(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = ''
  WHERE id = dummy_user_id;

END $$;