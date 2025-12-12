/*
  # Create calendar_events_with_users view
  
  1. New Views
    - `calendar_events_with_users`
      - Includes all calendar_events columns plus user_email
      - Joins calendar_events with auth.users to get email
      - Has RLS policies that mirror calendar_events policies
  
  2. Security
    - Enable RLS on the view
    - Create SELECT policy that matches calendar_events RLS
    - Grant SELECT permission to authenticated users
*/

-- Create or replace the calendar_events_with_users view
CREATE OR REPLACE VIEW calendar_events_with_users
WITH (security_invoker = true) AS
SELECT 
  ce.id,
  ce.user_id,
  ce.title,
  ce.description,
  ce.start,
  ce."end",
  ce.type,
  ce.invoice_id,
  ce.created_at,
  ce.updated_at,
  u.email AS user_email
FROM calendar_events ce
LEFT JOIN auth.users u ON ce.user_id = u.id;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON calendar_events_with_users TO authenticated;

