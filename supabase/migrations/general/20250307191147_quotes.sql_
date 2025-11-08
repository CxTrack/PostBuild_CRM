/*
  # Create Quotes Table
  
  1. New Tables
    - quotes: Stores quote information
  
  2. Security
    - RLS enabled
    - Policies for user-based access
*/

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_address text,
  date timestamptz NOT NULL,
  expiry_date timestamptz NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric DEFAULT 0 NOT NULL,
  tax_rate numeric DEFAULT 0 NOT NULL,
  tax numeric DEFAULT 0 NOT NULL,
  total numeric DEFAULT 0 NOT NULL,
  notes text,
  message text,
  status quote_status DEFAULT 'Draft' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();