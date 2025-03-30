/*
  # Create waitlist table and policies
  
  1. Drop existing objects first
  2. Create table with proper constraints
  3. Enable RLS and create policies
  4. Add performance indexes
*/

-- Drop existing objects
DROP POLICY IF EXISTS "Admins can view waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
DROP TABLE IF EXISTS waitlist;

-- Create waitlist table
CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  plan_type text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  viewed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view waitlist entries" ON waitlist
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