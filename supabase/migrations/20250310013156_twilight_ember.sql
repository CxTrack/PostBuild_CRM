/*
  # Create Waitlist Table

  1. New Tables
    - `waitlist`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text)
      - `company` (text)
      - `phone` (text)
      - `plan_type` (text)
      - `message` (text)
      - `created_at` (timestamp)
      - `viewed` (boolean)

  2. Security
    - Enable RLS on waitlist table
    - Add policy for admin access
*/

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
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

-- Allow admins to view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries" ON waitlist
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings a
      WHERE a.user_id = auth.uid() 
      AND a.is_admin = true
    )
  );

-- Allow anyone to insert into waitlist
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT TO public
  WITH CHECK (true);

-- Create index on created_at for sorting
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);

-- Create index on viewed status
CREATE INDEX idx_waitlist_viewed ON waitlist(viewed);