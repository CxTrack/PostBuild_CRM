/*
  # Fix customer address fields
  
  1. Changes
    - Add postal_code column
    - Add street, city, state columns
    - Add country column with default
    - Add proper constraints and defaults
*/

-- Add address fields if they don't exist
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

  -- Add country column with default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers ADD COLUMN country text DEFAULT 'CA';
  END IF;
END $$;

-- Create function to split existing address
CREATE OR REPLACE FUNCTION split_customer_address()
RETURNS void AS $$
BEGIN
  -- Split existing address into components if it exists
  UPDATE customers
  SET 
    street = address,
    city = NULL,
    state = NULL,
    postal_code = NULL,
    country = 'CA'
  WHERE address IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT split_customer_address();

-- Drop the function since we only need it once
DROP FUNCTION split_customer_address();

-- Create indexes for address fields
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON customers(state);
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country);
CREATE INDEX IF NOT EXISTS idx_customers_postal_code ON customers(postal_code);