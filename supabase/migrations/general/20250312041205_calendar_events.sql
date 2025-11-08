/*
  # Fix Calendar Integration
  
  1. Changes
    - Ensure users table exists with proper structure
    - Update calendar_events foreign key to reference auth.users directly
    - Fix handle_invoice_calendar_event function
    
  2. Security
    - Maintain RLS policies
    - Set proper security context for functions
*/

-- Update calendar_events foreign key to reference auth.users directly
ALTER TABLE calendar_events 
  DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey,
  ADD CONSTRAINT calendar_events_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update handle_invoice_calendar_event function to handle user relationships
CREATE OR REPLACE FUNCTION handle_invoice_calendar_event()
RETURNS TRIGGER AS $$
DECLARE
  event_id uuid;
BEGIN
  -- For insert/update
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Check if calendar event already exists
    SELECT id INTO event_id FROM calendar_events 
    WHERE invoice_id = NEW.id;
    
    IF event_id IS NULL THEN
      -- Create new calendar event
      INSERT INTO calendar_events (
        user_id,
        title,
        description,
        start_time,
        end_time,
        type,
        invoice_id
      ) VALUES (
        NEW.user_id,
        'Invoice Due: ' || NEW.invoice_number || ' - ' || NEW.customer_name,
        'Invoice ' || NEW.invoice_number || ' for ' || NEW.customer_name || ' is due. Amount: $' || NEW.total::text,
        NEW.due_date,
        NEW.due_date + interval '1 day',
        'invoice',
        NEW.id
      );
    ELSE
      -- Update existing calendar event
      UPDATE calendar_events SET
        title = 'Invoice Due: ' || NEW.invoice_number || ' - ' || NEW.customer_name,
        description = 'Invoice ' || NEW.invoice_number || ' for ' || NEW.customer_name || ' is due. Amount: $' || NEW.total::text,
        start_time = NEW.due_date,
        end_time = NEW.due_date + interval '1 day'
      WHERE id = event_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- For delete
  IF (TG_OP = 'DELETE') THEN
    -- Delete associated calendar event
    DELETE FROM calendar_events WHERE invoice_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS invoice_calendar_insert_trigger ON invoices;
DROP TRIGGER IF EXISTS invoice_calendar_update_trigger ON invoices;
DROP TRIGGER IF EXISTS invoice_calendar_delete_trigger ON invoices;

-- Create triggers for invoice calendar events
CREATE TRIGGER invoice_calendar_insert_trigger
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_calendar_event();

CREATE TRIGGER invoice_calendar_update_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_calendar_event();

CREATE TRIGGER invoice_calendar_delete_trigger
  BEFORE DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_calendar_event();

-- Backfill calendar events for existing invoices
INSERT INTO calendar_events (
  user_id,
  title,
  description,
  start_time,
  end_time,
  type,
  invoice_id
)
SELECT
  i.user_id,
  'Invoice Due: ' || i.invoice_number || ' - ' || i.customer_name,
  'Invoice ' || i.invoice_number || ' for ' || i.customer_name || ' is due. Amount: $' || i.total::text,
  i.due_date,
  i.due_date + interval '1 day',
  'invoice',
  i.id
FROM invoices i
WHERE NOT EXISTS (
  SELECT 1 FROM calendar_events ce WHERE ce.invoice_id = i.id
);