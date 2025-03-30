/*
  # Create Update Timestamp Trigger
  
  1. Changes
    - Creates trigger function for updating timestamps
*/

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';