/*
  # Create AI Agents Tables
  
  1. New Tables
    - ai_agents: Stores AI agent configurations
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - name (text)
      - type (text with check constraint)
      - status (text with check constraint)
      - settings (jsonb)
      - created_at (timestamptz)
      - updated_at (timestamptz)
  
  2. Security
    - RLS enabled
    - Policy for authenticated users to manage their own agents
*/

-- Create AI agents table with proper error handling
DO $$ 
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS ai_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('invoice_reminder', 'payment_collection', 'customer_service')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Enable RLS
  ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

  -- Create the trigger only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'set_ai_agents_updated_at'
  ) THEN
    CREATE TRIGGER set_ai_agents_updated_at
      BEFORE UPDATE ON ai_agents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
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

EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Table ai_agents already exists, skipping creation';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy or trigger already exists, skipping creation';
  WHEN others THEN
    RAISE EXCEPTION 'Error creating AI agents table: %', SQLERRM;
END $$;