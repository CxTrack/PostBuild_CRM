/*
  # Add first_name and last_name columns to customers table
  
  1. Changes
    - Add first_name and last_name columns
    - Split existing name field into components
    - Add indexes for performance
*/

-- Add new columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Create function to split name
CREATE OR REPLACE FUNCTION split_customer_name()
RETURNS void AS $$
BEGIN
  -- Split existing name into first_name and last_name
  UPDATE customers
  SET 
    first_name = split_part(name, ' ', 1),
    last_name = CASE 
      WHEN position(' ' in name) > 0 
      THEN substring(name from position(' ' in name) + 1)
      ELSE NULL 
    END
  WHERE name IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT split_customer_name();

-- Drop the function since we only need it once
DROP FUNCTION split_customer_name();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(last_name);