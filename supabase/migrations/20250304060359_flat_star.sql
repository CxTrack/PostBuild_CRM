/*
  # Fix profile refresh issues

  1. Security
    - Ensure profiles table has proper defaults
    - Fix RLS policies to prevent unnecessary refreshing
*/

-- Update profiles table to ensure proper defaults
ALTER TABLE profiles 
  ALTER COLUMN company SET DEFAULT 'CxTrack',
  ALTER COLUMN address SET DEFAULT '',
  ALTER COLUMN city SET DEFAULT '',
  ALTER COLUMN state SET DEFAULT '',
  ALTER COLUMN "zipCode" SET DEFAULT '',
  ALTER COLUMN country SET DEFAULT '',
  ALTER COLUMN phone SET DEFAULT '';

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create policies with proper conditions
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;