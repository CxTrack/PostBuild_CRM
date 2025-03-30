/*
  # Create AI Agent Logs Table and Policies
  
  1. New Tables
    - `ai_agent_logs`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, references ai_agents)
      - `action_type` (text, enum)
      - `channel` (text, enum)
      - `customer_id` (uuid, references customers)
      - `invoice_id` (uuid, references invoices, nullable)
      - `message` (text)
      - `status` (text, enum)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policy for users to view logs for their agents
    - Add policy for users to create logs for their agents
  
  3. Changes
    - Create table with all necessary columns and constraints
    - Add foreign key relationships
    - Set up RLS policies
*/

-- Create AI Agent Logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('reminder_sent', 'payment_collected', 'customer_contacted')),
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view logs for their agents" ON ai_agent_logs;
  DROP POLICY IF EXISTS "Users can create logs for their agents" ON ai_agent_logs;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Users can view logs for their agents"
  ON ai_agent_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_agents
      WHERE ai_agents.id = ai_agent_logs.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create logs for their agents"
  ON ai_agent_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_agents
      WHERE ai_agents.id = ai_agent_logs.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );