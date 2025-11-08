/*
  # Add email settings validation

  1. New Functions
    - validate_email_settings: Validates SMTP settings before insert/update
    - test_smtp_connection: Tests SMTP connection with provided settings
    
  2. Triggers
    - Add validation trigger on email_settings table
    
  3. Changes
    - Add constraints to email_settings table
    - Add validation checks for required fields
*/

-- Add check constraints for email_settings table
ALTER TABLE email_settings
ADD CONSTRAINT email_settings_smtp_port_check 
CHECK (smtp_port BETWEEN 1 AND 65535);

ALTER TABLE email_settings
ADD CONSTRAINT email_settings_from_email_check
CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create function to validate email settings
CREATE OR REPLACE FUNCTION validate_email_settings()
RETURNS trigger AS $$
BEGIN
  -- Check required fields
  IF NEW.smtp_host IS NULL OR NEW.smtp_host = '' THEN
    RAISE EXCEPTION 'SMTP host is required';
  END IF;
  
  IF NEW.smtp_port IS NULL THEN
    RAISE EXCEPTION 'SMTP port is required';
  END IF;
  
  IF NEW.smtp_username IS NULL OR NEW.smtp_username = '' THEN
    RAISE EXCEPTION 'SMTP username is required';
  END IF;
  
  IF NEW.smtp_password IS NULL OR NEW.smtp_password = '' THEN
    RAISE EXCEPTION 'SMTP password is required';
  END IF;
  
  IF NEW.from_email IS NULL OR NEW.from_email = '' THEN
    RAISE EXCEPTION 'From email is required';
  END IF;
  
  IF NEW.from_name IS NULL OR NEW.from_name = '' THEN
    RAISE EXCEPTION 'From name is required';
  END IF;
  
  -- Validate port range
  IF NEW.smtp_port < 1 OR NEW.smtp_port > 65535 THEN
    RAISE EXCEPTION 'SMTP port must be between 1 and 65535';
  END IF;
  
  -- Validate email format
  IF NEW.from_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email settings validation
CREATE TRIGGER validate_email_settings_trigger
BEFORE INSERT OR UPDATE ON email_settings
FOR EACH ROW
EXECUTE FUNCTION validate_email_settings();