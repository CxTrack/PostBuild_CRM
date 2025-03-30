/*
  # Fix Team Member Registration
  
  1. Changes
    - Add trigger function to handle team member registration
    - Add proper error handling
    - Fix race conditions in user creation
    
  2. Security
    - Maintain RLS policies
    - Use proper security context
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_team_member ON auth.users;
DROP FUNCTION IF EXISTS handle_team_member_registration();

-- Create improved team member registration function
CREATE OR REPLACE FUNCTION handle_team_member_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  matching_invite RECORD;
BEGIN
  -- First create the user's profile and settings
  INSERT INTO public.profiles (user_id, company)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company', 'CxTrack'))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.admin_settings (user_id, is_admin, admin_access_level)
  VALUES (NEW.id, false, 'none')
  ON CONFLICT (user_id) DO NOTHING;

  -- Check for pending team member invite
  SELECT * INTO matching_invite
  FROM team_members
  WHERE email = NEW.email
    AND status = 'pending'
    AND invite_token IS NOT NULL
    AND invite_expires_at > now()
  LIMIT 1;

  -- If there's a matching invite, update it
  IF matching_invite IS NOT NULL THEN
    UPDATE team_members
    SET 
      user_id = NEW.id,
      status = 'active',
      invite_token = NULL,
      invite_expires_at = NULL,
      updated_at = now()
    WHERE id = matching_invite.id;

    -- Get the free plan for team members
    WITH free_plan AS (
      SELECT id FROM subscription_plans WHERE price = 0 LIMIT 1
    )
    INSERT INTO subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    )
    SELECT
      NEW.id,
      free_plan.id,
      'active',
      now(),
      now() + interval '100 years',
      false
    FROM free_plan
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log error but don't prevent user creation
  RAISE WARNING 'Error in handle_team_member_registration: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created_team_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_team_member_registration();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_invite_expires_at ON team_members(invite_expires_at);

-- Add constraint to prevent duplicate active team members
ALTER TABLE team_members
DROP CONSTRAINT IF EXISTS team_members_email_parent_user_id_key,
ADD CONSTRAINT team_members_email_parent_user_id_key 
  UNIQUE (email, parent_user_id);

-- Add status check constraint if it doesn't exist
DO $$ 
BEGIN
  ALTER TABLE team_members
    ADD CONSTRAINT team_members_status_check
    CHECK (status IN ('pending', 'active', 'inactive'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;