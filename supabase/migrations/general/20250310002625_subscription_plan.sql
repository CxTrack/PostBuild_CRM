/*
  # Add Free Plan Subscription

  1. New Tables
    - None (using existing subscription_plans and subscriptions tables)
  
  2. Changes
    - Insert free plan if not exists
    - Update auth trigger to create free subscription for new users
  
  3. Security
    - No changes to RLS policies needed
*/

-- First ensure the free plan exists
INSERT INTO subscription_plans (id, name, description, price, interval, features, is_active)
SELECT 
  gen_random_uuid(),
  'Free Plan',
  'Basic features for small businesses',
  0,
  'month',
  jsonb_build_array(
    'Basic invoicing functionality',
    'PDF invoice generation',
    'Manual invoice downloads',
    'Limited to 5 invoices per month',
    'Single user account',
    'Basic email support',
    'Simple customer database',
    'Basic invoice templates',
    'CSV export functionality',
    'Email notifications',
    'Basic dashboard',
    'Mobile app access',
    'Standard documentation',
    'Community support',
    'Basic reporting',
    'Simple search function',
    'Manual data backup',
    'Basic product catalog',
    'Standard security features',
    'Regular updates'
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE price = 0 AND name = 'Free Plan'
);

-- Create the function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Get the free plan ID
  SELECT id INTO free_plan_id 
  FROM subscription_plans 
  WHERE price = 0 AND name = 'Free Plan' 
  LIMIT 1;

  -- Create profile
  INSERT INTO public.profiles (id, user_id)
  VALUES (NEW.id, NEW.id);
  
  -- Create free subscription
  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  )
  VALUES (
    NEW.id,
    free_plan_id,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '100 years',
    false
  );
  
  RETURN NEW;
END;
$function$;