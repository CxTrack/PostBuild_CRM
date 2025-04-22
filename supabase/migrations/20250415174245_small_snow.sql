/*
  # Fix calendar events column references
  
  1. Changes
    - Update handle_invoice_calendar_event function to use "end" instead of "end_time"
    - Ensures compatibility with the calendar_events table schema
    
  2. Security
    - No changes to RLS policies
    - Maintains existing access controls
*/

-- Update the handle_invoice_calendar_event function
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
        start,
        "end",
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
        start = NEW.due_date,
        "end" = NEW.due_date + interval '1 day'
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