/*
  # Create Base Types
  
  1. Changes
    - Creates basic enum types
    - Small, focused migration for type definitions only
*/

-- Create invoice status type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM (
      'Draft',
      'Issued', 
      'Paid',
      'Part paid',
      'Cancelled',
      'Disputed',
      'On hold'
    );
  END IF;
END $$;

-- Create quote status type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    CREATE TYPE quote_status AS ENUM (
      'Draft',
      'Sent',
      'Accepted',
      'Declined',
      'Expired'
    );
  END IF;
END $$;