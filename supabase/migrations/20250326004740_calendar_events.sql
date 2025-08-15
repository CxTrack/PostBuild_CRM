/*
  # Fix calendar events table columns
  
  1. Changes
    - Rename start_time to start
    - Rename end_time to end
    - Update existing data
    - Add proper constraints
*/

-- First rename the columns
ALTER TABLE calendar_events
RENAME COLUMN start_time TO start;

ALTER TABLE calendar_events 
RENAME COLUMN end_time TO "end";

-- Add constraints to ensure end is after start
ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_dates_check
CHECK ("end" > start);

-- Create index for date range queries
CREATE INDEX idx_calendar_events_date_range 
ON calendar_events USING btree (start, "end");

-- Update any existing events to ensure end is after start
UPDATE calendar_events
SET "end" = start + interval '30 minutes'
WHERE "end" <= start;