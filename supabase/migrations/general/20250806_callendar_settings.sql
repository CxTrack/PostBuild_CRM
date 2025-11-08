CREATE TABLE IF NOT EXISTS callendar_settings (
  event_type_id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL
);


-- Enable Row Level Security
ALTER TABLE callendar_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for users to select agent calls history
CREATE POLICY "Users can view callendar settings history"
  ON callendar_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert agent calls history
CREATE POLICY "Users can insert record - callendar settings"
  ON callendar_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update agent calls history
CREATE POLICY "Users can update callendar settings"
  ON callendar_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete agent calls history
CREATE POLICY "Users can delete callendar settings"
  ON callendar_settings 
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
DROP TRIGGER IF EXISTS set_callendar_settings_updated_at ON callendar_settings;
CREATE TRIGGER set_user_callendar_settings_updated_at
  BEFORE UPDATE ON callendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();