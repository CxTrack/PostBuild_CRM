create or replace view public.admin_user_view with (security_invoker = on) as
 SELECT a.user_id,
    u.email,
    a.is_admin,
    a.admin_access_level,
    a.created_at
   FROM admin_settings a
     JOIN auth.users u ON u.id = a.user_id;
