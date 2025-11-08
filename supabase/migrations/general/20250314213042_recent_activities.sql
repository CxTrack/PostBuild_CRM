/*
  # Fix Recent Activities Table
  
  1. Changes
    - Add indexes for better performance
    - Add trigger to clean up old activities
    - Add function to format activity data
*/

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_recent_activities_user_id ON recent_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_activities_created_at ON recent_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_activities_type ON recent_activities(type);

-- Create function to clean up old activities
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS trigger AS $$
BEGIN
  -- Keep only the 50 most recent activities per user
  DELETE FROM recent_activities
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id 
          ORDER BY created_at DESC
        ) as rn
      FROM recent_activities
    ) ranked
    WHERE rn > 50
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_old_activities ON recent_activities;
CREATE TRIGGER trigger_cleanup_old_activities
  AFTER INSERT ON recent_activities
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_activities();

-- Create function to format amount
CREATE OR REPLACE FUNCTION format_activity_amount(amount numeric)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN amount IS NULL THEN NULL
    ELSE TO_CHAR(amount, 'FM999,999,999.00')
  END;
END;
$$ LANGUAGE plpgsql;