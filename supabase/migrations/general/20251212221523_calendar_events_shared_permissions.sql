/*
  # Update calendar_events RLS policies to support shared calendars
  
  1. Changes
    - Update SELECT policy to allow viewing events from shared calendars (viewer and editor roles)
    - Add INSERT policy to allow editors to create events on shared calendars
    - Add UPDATE policy to allow editors to update events on shared calendars
    - Add DELETE policy to allow editors to delete events on shared calendars
*/

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
  DROP POLICY IF EXISTS "Users can create their own calendar events" ON calendar_events;
  DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
  DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create updated SELECT policy: users can view their own events OR events from calendars shared with them
CREATE POLICY "Users can view their own calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.owner_id = calendar_events.user_id
      AND calendar_shares.shared_with_id = auth.uid()
      AND calendar_shares.role IN ('viewer', 'editor')
    )
  );

-- Create INSERT policy: users can create their own events OR editors can create events on shared calendars
-- Note: When editors create events, the user_id should be the calendar owner's ID
CREATE POLICY "Users can create their own calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.owner_id = user_id
      AND calendar_shares.shared_with_id = auth.uid()
      AND calendar_shares.role = 'editor'
    )
  );

-- Create UPDATE policy: users can update their own events OR editors can update events on shared calendars
CREATE POLICY "Users can update their own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.owner_id = calendar_events.user_id
      AND calendar_shares.shared_with_id = auth.uid()
      AND calendar_shares.role = 'editor'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.owner_id = user_id
      AND calendar_shares.shared_with_id = auth.uid()
      AND calendar_shares.role = 'editor'
    )
  );

-- Create DELETE policy: users can delete their own events OR editors can delete events on shared calendars
CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.owner_id = calendar_events.user_id
      AND calendar_shares.shared_with_id = auth.uid()
      AND calendar_shares.role = 'editor'
    )
  );

