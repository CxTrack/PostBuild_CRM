/*
  # Remove quote_number uniqueness constraint
  
  1. Changes
    - Drop the unique constraint on quote_number in the quotes table
    - This allows multiple quotes to have the same quote_number
    - Helps prevent errors when generating quote numbers
    
  2. Security
    - No changes to RLS policies
    - Maintains existing access controls
*/

-- Drop the unique constraint on quote_number
ALTER TABLE quotes 
DROP CONSTRAINT IF EXISTS quotes_quote_number_key;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS quotes_quote_number_key;

-- Create a non-unique index for performance
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);