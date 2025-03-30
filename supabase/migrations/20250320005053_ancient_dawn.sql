/*
  # Add source field to waitlist table
  
  1. Changes
    - Add source field to track where users found us
    - Make company and phone required
*/

-- Add source column if it doesn't exist
ALTER TABLE waitlist 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'other';

-- Make company and phone required
ALTER TABLE waitlist 
ALTER COLUMN company SET NOT NULL,
ALTER COLUMN phone SET NOT NULL;

-- Add check constraint for source
ALTER TABLE waitlist
ADD CONSTRAINT waitlist_source_check
CHECK (source IN (
  'google',
  'linkedin', 
  'twitter',
  'facebook',
  'referral',
  'conference',
  'blog',
  'youtube',
  'other'
));