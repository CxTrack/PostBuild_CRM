/*
  # Add Accounts AI Agent Type and Settings

  1. New Agent Type
    - Add 'accounts_receivable' and 'accounts_payable' to ai_agents type enum
    - Add new settings fields for accounts management
  
  2. Security
    - Maintain existing RLS policies
    - Add validation for new agent types

  3. Changes
    - Update ai_agents table constraints
    - Add new agent log types
*/

-- Add new agent types to the check constraint
ALTER TABLE ai_agents DROP CONSTRAINT IF EXISTS ai_agents_type_check;
ALTER TABLE ai_agents ADD CONSTRAINT ai_agents_type_check 
  CHECK (type = ANY (ARRAY[
    'invoice_reminder'::text,
    'payment_collection'::text, 
    'customer_service'::text,
    'accounts_receivable'::text,
    'accounts_payable'::text
  ]));

-- Add new action types to the check constraint
ALTER TABLE ai_agent_logs DROP CONSTRAINT IF EXISTS ai_agent_logs_action_type_check;
ALTER TABLE ai_agent_logs ADD CONSTRAINT ai_agent_logs_action_type_check 
  CHECK (action_type = ANY (ARRAY[
    'reminder_sent'::text,
    'payment_collected'::text,
    'customer_contacted'::text,
    'invoice_processed'::text,
    'payment_processed'::text,
    'report_generated'::text
  ]));

-- Create a function to validate accounts agent settings
CREATE OR REPLACE FUNCTION validate_accounts_agent_settings()
RETURNS trigger AS $$
BEGIN
  IF NEW.type IN ('accounts_receivable', 'accounts_payable') THEN
    -- Validate required settings for accounts agents
    IF NOT (
      NEW.settings ? 'processing_schedule' AND
      NEW.settings ? 'notification_preferences' AND
      NEW.settings ? 'approval_thresholds' AND
      NEW.settings ? 'aging_brackets'
    ) THEN
      RAISE EXCEPTION 'Invalid settings for accounts agent';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings validation
DROP TRIGGER IF EXISTS validate_accounts_agent_settings_trigger ON ai_agents;
CREATE TRIGGER validate_accounts_agent_settings_trigger
  BEFORE INSERT OR UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION validate_accounts_agent_settings();

-- Add calendar integration table
CREATE TABLE IF NOT EXISTS calendar_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('invoice_due', 'payment_due', 'aging_alert', 'reconciliation')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  due_date timestamptz NOT NULL,
  amount numeric,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for calendar reminders
ALTER TABLE calendar_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
  ON calendar_reminders
  USING (
    EXISTS (
      SELECT 1 FROM ai_agents
      WHERE ai_agents.id = calendar_reminders.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

-- Add function to update calendar reminders
CREATE OR REPLACE FUNCTION update_calendar_reminders()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_calendar_reminders_updated_at
  BEFORE UPDATE ON calendar_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_reminders();