/*
  # Calendar Invoice Integration

  1. New Functions
    - Creates trigger function to automatically create calendar events for invoice due dates
    - Creates trigger function to update calendar events when invoices change
    - Creates trigger function to delete calendar events when invoices are deleted

  2. Triggers
    - Adds triggers for invoice insert/update/delete to manage calendar events
    
  3. Changes
    - Adds type column to calendar_events table for categorizing events
*/

-- Add type column to calendar_events if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'type'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN type text NOT NULL DEFAULT 'custom';
  END IF;
END $$;

-- Create function to handle invoice calendar events
CREATE OR REPLACE FUNCTION handle_invoice_calendar_event()
RETURNS TRIGGER AS $$
DECLARE
  event_id uuid;
BEGIN
  -- For insert/update
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Check if calendar event already exists
    SELECT id INTO event_id FROM calendar_events 
    WHERE type = 'invoice' AND invoice_id = NEW.id;
    
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
    DELETE FROM calendar_events WHERE type = 'invoice' AND invoice_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for invoice calendar events
DROP TRIGGER IF EXISTS invoice_calendar_insert_trigger ON invoices;
CREATE TRIGGER invoice_calendar_insert_trigger
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_calendar_event();

DROP TRIGGER IF EXISTS invoice_calendar_update_trigger ON invoices;
CREATE TRIGGER invoice_calendar_update_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_calendar_event();

DROP TRIGGER IF EXISTS invoice_calendar_delete_trigger ON invoices;
CREATE TRIGGER invoice_calendar_delete_trigger
  BEFORE DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_calendar_event();