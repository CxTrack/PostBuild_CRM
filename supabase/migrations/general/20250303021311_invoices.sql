/*
  # Create invoices table

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `invoice_number` (text, unique)
      - `customer_id` (uuid, foreign key to customers)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_address` (text)
      - `date` (timestamptz)
      - `due_date` (timestamptz)
      - `items` (jsonb)
      - `subtotal` (numeric)
      - `tax_rate` (numeric)
      - `tax` (numeric)
      - `total` (numeric)
      - `notes` (text)
      - `status` (text)
      - `payment_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)
  
  2. Security
    - Enable RLS on `invoices` table
    - Add policies for authenticated users to manage their own invoices
*/

-- Check if invoices table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    -- Create invoices table only if it doesn't exist
    CREATE TABLE invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_number text NOT NULL UNIQUE,
      customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
      customer_name text NOT NULL,
      customer_email text,
      customer_address text,
      date timestamptz NOT NULL,
      due_date timestamptz NOT NULL,
      items jsonb NOT NULL DEFAULT '[]'::jsonb,
      subtotal numeric NOT NULL DEFAULT 0,
      tax_rate numeric NOT NULL DEFAULT 0,
      tax numeric NOT NULL DEFAULT 0,
      total numeric NOT NULL DEFAULT 0,
      notes text,
      status text NOT NULL DEFAULT 'Draft',
      payment_date timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      user_id uuid REFERENCES auth.users(id) NOT NULL
    );

    -- Enable Row Level Security
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Policy for users to select their own invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' AND policyname = 'Users can view their own invoices'
  ) THEN
    CREATE POLICY "Users can view their own invoices"
      ON invoices
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for users to insert their own invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' AND policyname = 'Users can insert their own invoices'
  ) THEN
    CREATE POLICY "Users can insert their own invoices"
      ON invoices
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for users to update their own invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' AND policyname = 'Users can update their own invoices'
  ) THEN
    CREATE POLICY "Users can update their own invoices"
      ON invoices
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for users to delete their own invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' AND policyname = 'Users can delete their own invoices'
  ) THEN
    CREATE POLICY "Users can delete their own invoices"
      ON invoices
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS set_invoices_updated_at ON invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();