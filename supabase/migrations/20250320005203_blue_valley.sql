/*
  # Fix waitlist source field
  
  1. Changes
    - Drop and recreate waitlist table with all required fields
    - Add proper constraints and defaults
    - Maintain existing policies
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS waitlist CASCADE;

-- Create waitlist table with all fields
CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  phone text NOT NULL,
  source text NOT NULL,
  plan_type text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  viewed boolean DEFAULT false,
  CONSTRAINT waitlist_source_check CHECK (
    source IN (
      'google',
      'linkedin', 
      'twitter',
      'facebook',
      'referral',
      'conference',
      'blog',
      'youtube',
      'other'
    )
  )
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