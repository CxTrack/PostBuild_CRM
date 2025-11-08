alter table user_call_agents
add constraint fk_user_call_agents_user
foreign key (user_id) references auth.users(id) on delete cascade;


create or replace view public.user_call_agents_with_users as
select
  uca.call_agent_id,
  uca.user_id,
  au.email
from public.user_call_agents uca
join auth.users au on au.id = uca.user_id;