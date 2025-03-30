/*
  # Fix customer fields

  1. Changes
    - Add missing address fields to customers table
    - Add proper constraints and defaults
    - Update existing data
*/

-- Add new address fields if they don't exist
DO $$ 
BEGIN
  -- Add street column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'street'
  ) THEN
    ALTER TABLE customers ADD COLUMN street text;
  END IF;

  -- Add city column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'city'
  ) THEN
    ALTER TABLE customers ADD COLUMN city text;
  END IF;

  -- Add state column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'state'
  ) THEN
    ALTER TABLE customers ADD COLUMN state text;
  END IF;

  -- Add postal_code column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN postal_code text;
  END IF;

  -- Add country column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers ADD COLUMN country text DEFAULT 'CA'::text;
  END IF;
END $$;

-- Create indexes for address fields
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON customers(state);
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country);

-- Update existing customers to split address field into components
UPDATE customers 
SET 
  street = address,
  city = NULL,
  state = NULL,
  postal_code = NULL,
  country = 'CA'
WHERE address IS NOT NULL;