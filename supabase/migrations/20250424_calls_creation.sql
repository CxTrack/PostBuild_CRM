  
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_number text NOT NULL,
  to_number text NOT NULL,
  call_agent_id text NOT NULL REFERENCES user_call_agents(call_agent_id),
  -- optionally, include user_id for RLS or filtering
  user_id uuid NOT NULL REFERENCES auth.users(id),
  start_time timestamptz,
  end_time timestamptz,
  disconnection_reason text,
  transcript text,
  provider_call_id text,
  provider_agent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for users to select their own calls
CREATE POLICY "Users can view their own calls"
  ON calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own calls
CREATE POLICY "Users can insert their own call"
  ON calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own calls
CREATE POLICY "Users can update their own calls"
  ON calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own calls
CREATE POLICY "Users can delete their own calls"
  ON calls
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
DROP TRIGGER IF EXISTS set_calls_updated_at ON calls;
CREATE TRIGGER set_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();