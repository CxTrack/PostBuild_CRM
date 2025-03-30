/*
  # Create RLS Policies for AI Agent Tables
  
  Sets up the security policies for AI agent access
*/

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

CREATE POLICY "Users can create logs for their agents"
  ON ai_agent_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = ai_agent_logs.agent_id
    AND ai_agents.user_id = auth.uid()
  ));