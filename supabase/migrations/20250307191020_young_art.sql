/*
  # Create AI Agents Table
  
  1. New Tables
    - ai_agents: Stores AI agent configurations
  
  2. Security
    - RLS enabled
    - Policy for user-based access
*/

DO $$ 
BEGIN
  -- Create ai_agents table if it doesn't exist
  CREATE TABLE IF NOT EXISTS ai_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    type agent_type NOT NULL,
    status agent_status NOT NULL DEFAULT 'active',
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_user
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE
  );

  -- Enable RLS
  ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

  -- Create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_agents' 
    AND policyname = 'Users can manage their own agents'
  ) THEN
    CREATE POLICY "Users can manage their own agents"
      ON ai_agents
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Create trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at' 
    AND tgrelid = 'ai_agents'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON ai_agents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating ai_agents table: %', SQLERRM;
END $$;