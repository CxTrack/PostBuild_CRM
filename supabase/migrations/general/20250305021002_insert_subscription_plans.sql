/*
  # Update Stripe price IDs

  1. Changes
    - Updates the stripe_price_id for each subscription plan
    - Only updates if the plan exists and has a different price ID
*/

-- Update Basic plan price ID
UPDATE subscription_plans 
SET stripe_price_id = 'price_1QypERGmarpEtABMTcKBe5wEa'
WHERE name = 'Basic' 
  AND (stripe_price_id IS NULL OR stripe_price_id != 'price_1QypERGmarpEtABMTcKBe5wEa');

-- Update Business plan price ID
UPDATE subscription_plans 
SET stripe_price_id = 'price_1QypERGmarpEtABMWQOjiPTR'
WHERE name = 'Business' 
  AND (stripe_price_id IS NULL OR stripe_price_id != 'price_1QypERGmarpEtABMWQOjiPTR');

-- Update Enterprise plan price ID
UPDATE subscription_plans 
SET stripe_price_id = 'price_1QypERGmarpEtABMXeIyF1Dq'
WHERE name = 'Enterprise' 
  AND (stripe_price_id IS NULL OR stripe_price_id != 'price_1QypERGmarpEtABMXeIyF1Dq');

-- Note: Free plan doesn't need a price ID since it's free