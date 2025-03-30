/*
  # Enable RLS for AI Agent Tables
  
  Enables Row Level Security on the AI agent tables
*/

-- Enable RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;