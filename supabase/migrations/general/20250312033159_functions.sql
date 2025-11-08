/*
  # Fix Security Settings

  1. Changes
    - Fix function search paths
    - Set security definer for privileged functions
    - Set proper search paths for security definer functions
*/

-- Fix function search paths
--ALTER FUNCTION validate_accounts_agent_settings() SET search_path = public;
--ALTER FUNCTION update_calendar_reminders() SET search_path = public;
--ALTER FUNCTION validate_email_settings() SET search_path = public;
ALTER FUNCTION handle_invoice_calendar_event() SET search_path = public;
ALTER FUNCTION create_default_user_settings() SET search_path = public;
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION set_updated_at() SET search_path = public;

-- Add security definer to functions that need elevated privileges
ALTER FUNCTION handle_new_user() SECURITY DEFINER;
ALTER FUNCTION create_default_user_settings() SECURITY DEFINER;
--ALTER FUNCTION validate_accounts_agent_settings() SECURITY DEFINER;
--ALTER FUNCTION validate_email_settings() SECURITY DEFINER;
ALTER FUNCTION handle_invoice_calendar_event() SECURITY DEFINER;

-- Set proper search path for security definer functions
ALTER FUNCTION handle_new_user() SET search_path = public, auth;
ALTER FUNCTION create_default_user_settings() SET search_path = public, auth;
--ALTER FUNCTION validate_accounts_agent_settings() SET search_path = public, auth;
--ALTER FUNCTION validate_email_settings() SET search_path = public, auth;
ALTER FUNCTION handle_invoice_calendar_event() SET search_path = public, auth;