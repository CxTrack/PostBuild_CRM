-- Create subscription_plans table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans') THEN
    CREATE TABLE subscription_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      price numeric NOT NULL DEFAULT 0,
      interval text NOT NULL CHECK (interval IN ('month', 'year')),
      features jsonb DEFAULT '[]'::jsonb,
      is_active boolean DEFAULT true,
      stripe_price_id text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    CREATE TABLE subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) NOT NULL,
      plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
      status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
      current_period_start timestamptz NOT NULL,
      current_period_end timestamptz NOT NULL,
      cancel_at_period_end boolean DEFAULT false,
      stripe_subscription_id text,
      stripe_customer_id text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create payment_methods table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    CREATE TABLE payment_methods (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) NOT NULL,
      type text NOT NULL DEFAULT 'card',
      card_brand text,
      card_last4 text,
      card_exp_month integer,
      card_exp_year integer,
      is_default boolean DEFAULT false,
      stripe_payment_method_id text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;

-- Create policies
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default subscription plans if they don't exist
INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id)
SELECT 
  'Free', 'Basic features for small businesses', 0, 'month', 
  '["Basic invoicing functionality", "PDF invoice generation", "Manual invoice downloads", "Limited to 5 invoices per month"]'::jsonb, NULL
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Free');

INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id)
SELECT 
  'Basic', 'Essential features for small businesses', 19.99, 'month',
  '["All Free Plan features", "Email delivery to customers", "Invoice templates", "Recurring invoices", "Up to 25 customers", "Customer contact management", "Basic customer history", "Up to 10 products", "Basic product catalog"]'::jsonb,
  'price_1OxXXXXXXXXXXXXXXXXXXXXX'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Basic');

INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id)
SELECT 
  'Business', 'Advanced features for growing businesses', 99.99, 'month',
  '["All Basic Plan features", "Up to 50 customers", "Customer segmentation", "Advanced customer analytics", "Customer communication history", "Up to 50 products", "Product categories", "Stock tracking", "Accounting software integration", "Payment gateway integration", "Email marketing tools", "Multiple invoice templates", "Bulk invoice generation", "Invoice scheduling", "Custom branding"]'::jsonb,
  'price_1OxXXXXXXXXXXXXXXXXXXXXY'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Business');

INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id)
SELECT 
  'Enterprise', 'Complete solution for established businesses', 399.99, 'month',
  '["All Business Plan features", "Unlimited customers", "Advanced customer analytics", "Customer behavior tracking", "Custom customer fields", "Unlimited products", "Advanced inventory management", "Product variants", "Bulk product import/export", "AI-powered features", "Automated follow-up emails", "Smart SMS notifications", "AI collection calling", "Payment reminder automation", "Stripe integration", "Multiple payment gateways", "Automated payment collection", "Payment plan management", "API access", "Webhook support", "Custom integration support", "Custom reports", "Financial analytics", "Revenue forecasting", "Customer insights", "Priority support", "Dedicated account manager", "Custom feature requests", "Early access to new features"]'::jsonb,
  'price_1OxXXXXXXXXXXXXXXXXXXXXZ'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS set_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER set_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();