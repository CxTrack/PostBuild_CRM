/*
  # Fix AI Agent Policies

  1. Changes
    - Drop existing policy for ai_agents table
    - Recreate policy with correct permissions
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own agents" ON ai_agents;

-- Recreate policy with correct permissions
CREATE POLICY "Users can manage their own agents"
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);