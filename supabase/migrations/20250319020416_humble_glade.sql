/*
  # Fix team members RLS policies
  
  1. Changes
    - Drop existing RLS policies
    - Create new simplified policies
    - Enable RLS on team_members table
    
  2. Security
    - Allow users to manage their direct reports
    - Ensure proper access control
*/

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their team members" ON team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON team_members;

-- Create new policies
CREATE POLICY "Users can manage their direct reports"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    -- Users can see team members where they are the parent
    auth.uid() = parent_user_id
  )
  WITH CHECK (
    -- Users can only modify team members where they are the parent
    auth.uid() = parent_user_id
  );

-- Create policy for team members to view their own record
CREATE POLICY "Team members can view their own record"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to see their own team member record
    auth.uid() = user_id
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_team_members_parent_user_id_user_id 
ON team_members(parent_user_id, user_id);