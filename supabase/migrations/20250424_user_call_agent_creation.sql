CREATE TABLE IF NOT EXISTS user_calls (
  call_agent_id text PRIMARY KEY,  -- ✅ OR at least UNIQUE
  user_id uuid REFERENCES auth.users(id) NOT NULL
);


-- Enable Row Level Security
ALTER TABLE user_calls ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for users to select agent calls history
CREATE POLICY "Users can view agent calls history"
  ON user_calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert agent calls history
CREATE POLICY "Users can insert agent calls history"
  ON user_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update agent calls history
CREATE POLICY "Users can update agent calls history"
  ON user_calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete agent calls history
CREATE POLICY "Users can delete agent calls history"
  ON user_calls 
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
DROP TRIGGER IF EXISTS set_user_calls_updated_at ON user_calls;
CREATE TRIGGER set_user_calls_updated_at
  BEFORE UPDATE ON user_calls
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();