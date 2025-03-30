/*
  # AI Agents Infrastructure

  1. New Tables
    - `ai_agents`: Stores AI agent configurations
    - `ai_agent_logs`: Tracks agent activities and interactions
    - `voice_calls`: Records voice call data
    - `ai_training_data`: Stores training data for model improvement

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Ensure data isolation between users

  3. Changes
    - Add triggers for updated_at timestamps
*/

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('invoice_reminder', 'payment_collection', 'customer_service')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create voice_calls table
CREATE TABLE IF NOT EXISTS voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  call_sid text NOT NULL,
  to_number text NOT NULL,
  status text NOT NULL,
  duration integer DEFAULT 0,
  recording_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_training_data table
CREATE TABLE IF NOT EXISTS ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  input text NOT NULL,
  output text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can view logs for their agents" ON ai_agent_logs;
DROP POLICY IF EXISTS "Users can view calls for their agents" ON voice_calls;
DROP POLICY IF EXISTS "Users can view training data for their agents" ON ai_training_data;

-- Create policies for ai_agents
CREATE POLICY "Users can manage their own agents"
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Create policies for voice_calls
CREATE POLICY "Users can view calls for their agents"
  ON voice_calls
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = voice_calls.agent_id
    AND ai_agents.user_id = auth.uid()
  ));

-- Create policies for ai_training_data
CREATE POLICY "Users can view training data for their agents"
  ON ai_training_data
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = ai_training_data.agent_id
    AND ai_agents.user_id = auth.uid()
  ));

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_ai_agents_updated_at ON ai_agents;
DROP TRIGGER IF EXISTS set_voice_calls_updated_at ON voice_calls;

CREATE TRIGGER set_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_voice_calls_updated_at
  BEFORE UPDATE ON voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();