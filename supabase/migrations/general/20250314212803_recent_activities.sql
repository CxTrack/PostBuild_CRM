/*
  # Add Recent Activities Table
  
  1. New Tables
    - `recent_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text: invoice, purchase, customer, product)
      - `title` (text)
      - `customer` (text)
      - `supplier` (text)
      - `product` (text)
      - `amount` (numeric)
      - `quantity` (integer)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for users to view their own activities
*/

-- Create recent_activities table
CREATE TABLE IF NOT EXISTS recent_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('invoice', 'purchase', 'customer', 'product')),
  title text NOT NULL,
  customer text,
  supplier text,
  product text,
  amount numeric,
  quantity integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recent_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own activities
CREATE POLICY "Users can view their own activities"
  ON recent_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_recent_activities_user_id ON recent_activities(user_id);
CREATE INDEX idx_recent_activities_created_at ON recent_activities(created_at DESC);
CREATE INDEX idx_recent_activities_type ON recent_activities(type);

-- Create function to add activity
CREATE OR REPLACE FUNCTION add_activity(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_customer text DEFAULT NULL,
  p_supplier text DEFAULT NULL,
  p_product text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_quantity integer DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO recent_activities (
    user_id,
    type,
    title,
    customer,
    supplier,
    product,
    amount,
    quantity
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_customer,
    p_supplier,
    p_product,
    p_amount,
    p_quantity
  ) RETURNING id INTO v_activity_id;

  -- Keep only last 50 activities per user
  DELETE FROM recent_activities
  WHERE id IN (
    SELECT id FROM recent_activities
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    OFFSET 50
  );

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;