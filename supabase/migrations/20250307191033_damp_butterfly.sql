/*
  # Create Indexes
  
  1. Changes
    - Adds performance-optimizing indexes
    - Improves query performance for common operations
*/

DO $$ 
BEGIN
  -- Create indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_agents' 
    AND indexname = 'idx_ai_agents_user_id'
  ) THEN
    CREATE INDEX idx_ai_agents_user_id ON ai_agents(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_agent_logs' 
    AND indexname = 'idx_ai_agent_logs_agent_id'
  ) THEN
    CREATE INDEX idx_ai_agent_logs_agent_id ON ai_agent_logs(agent_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_agent_logs' 
    AND indexname = 'idx_ai_agent_logs_customer_id'
  ) THEN
    CREATE INDEX idx_ai_agent_logs_customer_id ON ai_agent_logs(customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_agent_logs' 
    AND indexname = 'idx_ai_agent_logs_created_at'
  ) THEN
    CREATE INDEX idx_ai_agent_logs_created_at ON ai_agent_logs(created_at DESC);
  END IF;

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating indexes: %', SQLERRM;
END $$;