/*
  # Fix AI Agents and Logs Tables
  
  1. Tables
    - Drop and recreate tables to ensure clean state
    - Add proper constraints and defaults
    - Set up proper relationships
    
  2. Security
    - Enable RLS
    - Create policies with proper checks
    
  3. Changes
    - Remove duplicate tables/policies
    - Ensure proper trigger setup
    - Add comprehensive documentation
*/

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS ai_agent_logs;
DROP TABLE IF EXISTS ai_agents;

-- Create ai_agents table
CREATE TABLE ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('invoice_reminder', 'payment_collection', 'customer_service')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_agents
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_agents
CREATE POLICY "Users can manage their own agents"
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create ai_agent_logs table
CREATE TABLE ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('reminder_sent', 'payment_collected', 'customer_contacted')),
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_agent_logs
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_agent_logs
CREATE POLICY "Users can view logs for their agents"
  ON ai_agent_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = ai_agent_logs.agent_id
    AND ai_agents.user_id = auth.uid()
  ));

CREATE POLICY "Users can create logs for their agents"
  ON ai_agent_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = ai_agent_logs.agent_id
    AND ai_agents.user_id = auth.uid()
  ));