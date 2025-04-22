/*
  # Remove invoice_number uniqueness constraint
  
  1. Changes
    - Drop the unique constraint on invoice_number in the invoices table
    - This allows multiple invoices to have the same invoice_number
    - Helps prevent errors when generating invoice numbers
    
  2. Security
    - No changes to RLS policies
    - Maintains existing access controls
*/

-- Drop the unique constraint on invoice_number
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS invoices_invoice_number_key;

-- Create a non-unique index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);