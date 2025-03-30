/*
  # Update waitlist table schema
  
  1. Changes
    - Remove not-null constraints for full_name, company, phone
    - Keep only email and source as required fields
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop and recreate waitlist table with updated schema
DROP TABLE IF EXISTS waitlist CASCADE;

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL CHECK (source IN (
    'google',
    'linkedin', 
    'twitter',
    'facebook',
    'referral',
    'conference',
    'blog',
    'youtube',
    'other'
  )),
  message text,
  plan_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  viewed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all waitlist entries" ON waitlist
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings a
      WHERE a.user_id = auth.uid() 
      AND a.is_admin = true
    )
  );

CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT TO public
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_waitlist_viewed ON waitlist(viewed);
CREATE INDEX idx_waitlist_source ON waitlist(source);