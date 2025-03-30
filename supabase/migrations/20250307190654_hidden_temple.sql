/*
  # Create AI Agent Logs Table
  
  Creates the table for tracking AI agent activities
*/

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

-- Enable RLS
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;