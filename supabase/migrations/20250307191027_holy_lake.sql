/*
  # Create AI Agent Logs Table
  
  1. New Tables
    - ai_agent_logs: Tracks agent activities
  
  2. Security
    - RLS enabled
    - Policies for viewing and creating logs
*/

DO $$ 
BEGIN
  -- Create ai_agent_logs table if it doesn't exist
  CREATE TABLE IF NOT EXISTS ai_agent_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL,
    action_type agent_action_type NOT NULL,
    channel communication_channel NOT NULL,
    customer_id uuid NOT NULL,
    invoice_id uuid,
    message text NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'failed')),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_agent
      FOREIGN KEY (agent_id) 
      REFERENCES ai_agents(id) 
      ON DELETE CASCADE,
    CONSTRAINT fk_customer
      FOREIGN KEY (customer_id) 
      REFERENCES customers(id) 
      ON DELETE CASCADE,
    CONSTRAINT fk_invoice
      FOREIGN KEY (invoice_id) 
      REFERENCES invoices(id) 
      ON DELETE CASCADE
  );

  -- Enable RLS
  ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_agent_logs' 
    AND policyname = 'Users can view logs for their agents'
  ) THEN
    CREATE POLICY "Users can view logs for their agents"
      ON ai_agent_logs
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM ai_agents
        WHERE ai_agents.id = ai_agent_logs.agent_id
        AND ai_agents.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_agent_logs' 
    AND policyname = 'Users can create logs for their agents'
  ) THEN
    CREATE POLICY "Users can create logs for their agents"
      ON ai_agent_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM ai_agents
        WHERE ai_agents.id = ai_agent_logs.agent_id
        AND ai_agents.user_id = auth.uid()
      ));
  END IF;

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating ai_agent_logs table: %', SQLERRM;
END $$;