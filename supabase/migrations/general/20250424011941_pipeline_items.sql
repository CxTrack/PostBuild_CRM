  
CREATE TABLE IF NOT EXISTS pipeline_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  user_id uuid,
  stage text,
  closing_date timestamptz,
  closing_probability text,
  dollar_value numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read"
ON pipeline_items
FOR SELECT
USING (true);

-- Create policies
-- Policy for users to select their own pipeline_items
CREATE POLICY "Users can view their own pipeline_items"
  ON pipeline_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own pipeline_items
CREATE POLICY "Users can insert their own pipeline_items"
  ON pipeline_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own pipeline_items
CREATE POLICY "Users can update their own pipeline_items"
  ON pipeline_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own pipeline_items
CREATE POLICY "Users can delete their own pipeline_items"
  ON pipeline_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY allow_delete ON pipeline_items
FOR DELETE
USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_calls_updated_at ON calls;
CREATE TRIGGER set_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();