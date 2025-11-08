/*
  # Create Trigger Functions
  
  1. Changes
    - Creates utility trigger functions
    - Handles timestamp updates
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';