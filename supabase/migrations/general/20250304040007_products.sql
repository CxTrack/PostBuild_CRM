/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `sku` (text, not null)
      - `description` (text)
      - `price` (numeric, not null)
      - `cost` (numeric)
      - `stock` (integer)
      - `category` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users.id)
  2. Security
    - Enable RLS on `products` table
    - Add policies for authenticated users to manage their own products
*/

-- Check if products table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    -- Create products table only if it doesn't exist
    CREATE TABLE products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      sku text NOT NULL,
      description text,
      price numeric NOT NULL DEFAULT 0,
      cost numeric DEFAULT 0,
      stock integer DEFAULT 0,
      category text,
      status text DEFAULT 'Out of Stock',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      user_id uuid REFERENCES auth.users(id) NOT NULL
    );

    -- Enable Row Level Security
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Policy for users to select their own products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Users can view their own products'
  ) THEN
    CREATE POLICY "Users can view their own products"
      ON products
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for users to insert their own products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Users can insert their own products'
  ) THEN
    CREATE POLICY "Users can insert their own products"
      ON products
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for users to update their own products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Users can update their own products'
  ) THEN
    CREATE POLICY "Users can update their own products"
      ON products
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for users to delete their own products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Users can delete their own products'
  ) THEN
    CREATE POLICY "Users can delete their own products"
      ON products
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();