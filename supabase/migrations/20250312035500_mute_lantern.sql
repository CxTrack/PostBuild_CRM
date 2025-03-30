/*
  # Fix Calendar Events Invoice Relationship
  
  1. Changes
    - Add invoice_id column to calendar_events table
    - Add foreign key constraint to invoices table
    - Update existing triggers to handle the relationship
*/

-- Add invoice_id column to calendar_events if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for invoice_id
CREATE INDEX IF NOT EXISTS idx_calendar_events_invoice_id ON calendar_events(invoice_id);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;