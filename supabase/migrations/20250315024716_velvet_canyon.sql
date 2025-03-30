/*
  # Add Team Management
  
  1. New Tables
    - `team_members`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `parent_user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `role` (text)
      - `status` (text)
      - `invite_token` (text)
      - `invite_expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for team management
*/

-- Create team_members table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invite_token text,
  invite_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, parent_user_id)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to see team members they manage
    parent_user_id = auth.uid() OR
    -- Allow team members to see their own record
    user_id = auth.uid()
  );

CREATE POLICY "Users can manage their team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_team_members_parent_user_id ON team_members(parent_user_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_status ON team_members(status);

-- Create trigger for updated_at
CREATE TRIGGER set_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create function to handle team member registration
CREATE OR REPLACE FUNCTION handle_team_member_registration()
RETURNS trigger AS $$
BEGIN
  -- Check if there's a pending team member invite for this email
  UPDATE team_members
  SET 
    user_id = NEW.id,
    status = 'active',
    invite_token = NULL,
    invite_expires_at = NULL,
    updated_at = now()
  WHERE 
    email = NEW.email AND
    status = 'pending' AND
    invite_token IS NOT NULL AND
    invite_expires_at > now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for team member registration
CREATE TRIGGER on_auth_user_created_team_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_team_member_registration();