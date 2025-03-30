/*
  # Fix team members table schema
  
  1. Changes
    - Remove invitation-related columns
    - Add first_name and last_name columns
    - Add employee_id and telephone columns
    - Update constraints and indexes
    
  2. Security
    - Maintain RLS policies
    - Update trigger function
*/

-- Drop invitation-related columns
ALTER TABLE team_members 
DROP COLUMN IF EXISTS invite_token,
DROP COLUMN IF EXISTS invite_expires_at;

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add employee_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE team_members ADD COLUMN employee_id text;
  END IF;

  -- Add telephone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE team_members ADD COLUMN telephone text;
  END IF;

  -- Add first_name and last_name columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'first_name'
  ) THEN
    -- First add the new columns
    ALTER TABLE team_members 
    ADD COLUMN first_name text,
    ADD COLUMN last_name text;

    -- Then migrate existing data
    UPDATE team_members
    SET 
      first_name = split_part(name, ' ', 1),
      last_name = substring(name from (length(split_part(name, ' ', 1)) + 2))
    WHERE name IS NOT NULL;

    -- Make the columns required
    ALTER TABLE team_members
    ALTER COLUMN first_name SET NOT NULL,
    ALTER COLUMN last_name SET NOT NULL;

    -- Drop the old name column
    ALTER TABLE team_members DROP COLUMN IF EXISTS name;
  END IF;
END $$;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_parent_user_id ON team_members(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- Update trigger function to handle new schema
CREATE OR REPLACE FUNCTION handle_team_member_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update team member record if exists
  UPDATE team_members
  SET 
    user_id = NEW.id,
    status = 'active',
    updated_at = now()
  WHERE 
    email = NEW.email AND
    status = 'pending';
    
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_team_member ON auth.users;
CREATE TRIGGER on_auth_user_created_team_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_team_member_registration();