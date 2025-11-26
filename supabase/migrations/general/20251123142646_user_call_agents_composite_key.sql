ALTER TABLE user_call_agents DROP CONSTRAINT user_call_agents_pkey CASCADE;

ALTER TABLE user_call_agents
  ADD PRIMARY KEY (call_agent_id, user_id);