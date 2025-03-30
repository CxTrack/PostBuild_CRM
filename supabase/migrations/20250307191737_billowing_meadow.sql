/*
  # Create AI Agents and Logs Tables
  
  1. New Tables
    - `ai_agents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `type` (text, enum)
      - `status` (text, enum)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_agent_logs`
      - `id` (uuid, primary key) 
      - `agent_id` (uuid, references ai_agents)
      - `action_type` (text, enum)
      - `channel` (text, enum)
      - `customer_id` (uuid, references customers)
      - `invoice_id` (uuid, references invoices)
      - `message` (text)
      - `status` (text, enum)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
    
  3. Changes
    - Create trigger function for updated_at
    - Create both tables with constraints
    - Set up RLS policies
*/

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create ai_agents table
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

-- Enable RLS on ai_agents
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own agents" ON ai_agents;

-- Create policy for ai_agents
CREATE POLICY "Users can manage their own agents"
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at ON ai_agents;

-- Create trigger for ai_agents
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create ai_agent_logs table
CREATE TABLE IF NOT EXISTS ai_agent_logs (
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view logs for their agents" ON ai_agent_logs;
DROP POLICY IF EXISTS "Users can create logs for their agents" ON ai_agent_logs;

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