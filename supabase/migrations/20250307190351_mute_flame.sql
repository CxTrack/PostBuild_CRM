/*
  # Create AI Agent Tables
  
  Creates the base tables for the AI agent system
*/

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT ai_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT ai_agents_type_check CHECK (type IN ('invoice_reminder', 'payment_collection', 'customer_service')),
  CONSTRAINT ai_agents_status_check CHECK (status IN ('active', 'paused'))
);

-- Create ai_agent_logs table
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  action_type text NOT NULL,
  channel text NOT NULL,
  customer_id uuid NOT NULL,
  invoice_id uuid,
  message text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT ai_agent_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
  CONSTRAINT ai_agent_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT ai_agent_logs_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT ai_agent_logs_action_type_check CHECK (action_type IN ('reminder_sent', 'payment_collected', 'customer_contacted')),
  CONSTRAINT ai_agent_logs_channel_check CHECK (channel IN ('email', 'sms')),
  CONSTRAINT ai_agent_logs_status_check CHECK (status IN ('success', 'failed'))
);