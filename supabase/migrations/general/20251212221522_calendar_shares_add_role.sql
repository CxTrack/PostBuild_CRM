/*
  # Create calendar_shares table
  
  1. New Tables
    - `calendar_shares`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users.id)
      - `shared_with_id` (uuid, references auth.users.id)
      - `role` (text, 'viewer' or 'editor', default 'viewer')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (owner_id, shared_with_id)
  
  2. Security
    - Enable RLS on calendar_shares table
    - Add policies for authenticated users to manage their own shares
  
  3. Indexes
    - Index on owner_id for faster lookups
    - Index on shared_with_id for faster lookups
    - Index on role for filtering
  
  4. Views
    - calendar_shares_with_users view with user emails
  
  5. Triggers
    - Trigger to update updated_at timestamp
*/

-- Create calendar_shares table
CREATE TABLE calendar_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, shared_with_id)
);

-- Enable RLS if not already enabled
ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own calendar shares" ON calendar_shares;
  DROP POLICY IF EXISTS "Users can view calendar shares shared with them" ON calendar_shares;
  DROP POLICY IF EXISTS "Users can create their own calendar shares" ON calendar_shares;
  DROP POLICY IF EXISTS "Users can update their own calendar shares" ON calendar_shares;
  DROP POLICY IF EXISTS "Users can delete their own calendar shares" ON calendar_shares;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create RLS policies
CREATE POLICY "Users can view their own calendar shares"
  ON calendar_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view calendar shares shared with them"
  ON calendar_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_with_id);

CREATE POLICY "Users can create their own calendar shares"
  ON calendar_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own calendar shares"
  ON calendar_shares
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own calendar shares"
  ON calendar_shares
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_calendar_shares_owner_id ON calendar_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_shares_shared_with_id ON calendar_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_calendar_shares_role ON calendar_shares(role);

-- Create or replace the calendar_shares_with_users view
CREATE OR REPLACE VIEW calendar_shares_with_users AS
SELECT 
  cs.id,
  cs.owner_id,
  cs.shared_with_id,
  cs.role,
  cs.created_at,
  cs.updated_at,
  owner.email AS owner_email,
  shared_with.email AS shared_with_email
FROM calendar_shares cs
LEFT JOIN auth.users owner ON cs.owner_id = owner.id
LEFT JOIN auth.users shared_with ON cs.shared_with_id = shared_with.id;

-- Grant access to the view
GRANT SELECT ON calendar_shares_with_users TO authenticated;

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_calendar_shares_updated_at'
  ) THEN
    CREATE TRIGGER set_calendar_shares_updated_at
      BEFORE UPDATE ON calendar_shares
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

