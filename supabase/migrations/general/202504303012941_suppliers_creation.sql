/*
  # Create customers table

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)
  2. Security
    - Enable RLS on `customers` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  
  city text,
  state text,
  street text,
  postal_code text,
  country text,
  company text,

  notes text,
  total_spent numeric DEFAULT 0,
  last_purchase timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for users to select their own suppliers
CREATE POLICY "Users can view their own suppliers"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own customers
CREATE POLICY "Users can insert their own suppliers"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own suppliers
CREATE POLICY "Users can update their own suppliers"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own suppliers
CREATE POLICY "Users can delete their own suppliers"
  ON suppliers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_suppliers_updated_at ON suppliers;
CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();