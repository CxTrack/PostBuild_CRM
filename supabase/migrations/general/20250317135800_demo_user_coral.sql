/*
  # Update dummy account to Enterprise plan
  
  1. Changes
    - Update dummy account subscription to Enterprise plan
    - Set proper subscription details
*/

DO $$
DECLARE
  dummy_user_id uuid;
  enterprise_plan_id uuid;
BEGIN
  -- Get the dummy user ID
  SELECT id INTO dummy_user_id 
  FROM auth.users 
  WHERE email = 'info@cxtrack.com';

  IF dummy_user_id IS NULL THEN
    RAISE EXCEPTION 'Demo user not found';
  END IF;

  -- Get Enterprise plan ID
  SELECT id INTO enterprise_plan_id 
  FROM subscription_plans 
  WHERE name = 'Enterprise Plan';

  IF enterprise_plan_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;

  -- Update subscription to Enterprise plan
  UPDATE subscriptions
  SET 
    plan_id = enterprise_plan_id,
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '100 years',
    cancel_at_period_end = false,
    stripe_subscription_id = 'dummy_enterprise_sub',
    stripe_customer_id = 'dummy_enterprise_customer',
    updated_at = now()
  WHERE user_id = dummy_user_id;

END $$;