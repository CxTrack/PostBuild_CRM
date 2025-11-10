CREATE OR REPLACE VIEW admin_user_view AS
SELECT
  a.user_id,
  u.email,
  a.is_admin,
  a.admin_access_level,
  a.created_at
FROM public.admin_settings a
JOIN auth.users u ON u.id = a.user_id;


GRANT SELECT ON admin_user_view TO authenticated;

--ALTER VIEW admin_user_view ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Admins can view admin_user_view"
--   ON admin_user_view
--   FOR SELECT
--   TO authenticated
--   USING (is_admin(auth.uid()));