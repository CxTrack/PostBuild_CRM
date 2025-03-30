/*
  # Add company, title and type fields to customers table
  
  1. Changes
    - Add company field
    - Add title field
    - Add type field with validation
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add company column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'company'
  ) THEN
    ALTER TABLE customers ADD COLUMN company text;
  END IF;

  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'title'
  ) THEN
    ALTER TABLE customers ADD COLUMN title text;
  END IF;

  -- Add type column with validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'type'
  ) THEN
    ALTER TABLE customers ADD COLUMN type text DEFAULT 'Individual'::text;
  END IF;
END $$;

-- Add type validation
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_type_check;
ALTER TABLE customers ADD CONSTRAINT customers_type_check 
  CHECK (type IN ('Individual', 'Business', 'Government', 'Non-Profit'));

-- Create index for type field
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);

-- Update existing customers to have default values
UPDATE customers 
SET 
  type = 'Individual' 
WHERE type IS NULL;