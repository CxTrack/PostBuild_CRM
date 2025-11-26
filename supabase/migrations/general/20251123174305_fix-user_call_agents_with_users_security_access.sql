create view public.user_call_agents_with_users with (security_invoker = on) as
 SELECT uca.call_agent_id,
    uca.user_id,
    au.email
   FROM user_call_agents uca
     JOIN auth.users au ON au.id = uca.user_id;