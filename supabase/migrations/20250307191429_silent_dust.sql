/*
  # Add AI Agents Policies
  
  1. Changes
    - Add RLS policy for AI agents table to allow users to manage their own agents
    - Policy allows authenticated users to perform all operations on their own agents
  
  2. Security
    - Policy uses auth.uid() to match user_id
    - Both read (USING) and write (WITH CHECK) conditions enforce user ownership
*/

DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Users can manage their own agents" ON ai_agents;
  
  -- Create policy
  CREATE POLICY "Users can manage their own agents"
    ON ai_agents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Table ai_agents does not exist';
  WHEN undefined_object THEN
    RAISE NOTICE 'Policy could not be dropped (may not exist)';
  WHEN others THEN
    RAISE EXCEPTION 'Error managing AI agents policy: %', SQLERRM;
END $$;