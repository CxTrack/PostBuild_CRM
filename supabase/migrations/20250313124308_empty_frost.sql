/*
  # Fix AI Articles Table
  
  1. Changes
    - Check if table exists before creating
    - Add missing constraints if needed
    - Update policies and indexes
*/

-- Check if ai_articles table exists and create if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_articles') THEN
    CREATE TABLE ai_articles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      content text NOT NULL,
      summary text,
      image_url text,
      published_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      status text NOT NULL DEFAULT 'draft',
      category text NOT NULL,
      tags text[],
      views integer DEFAULT 0
    );
  END IF;
END $$;

-- Add or update constraints
DO $$
BEGIN
  -- Add status check if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_articles_status_check'
  ) THEN
    ALTER TABLE ai_articles
    ADD CONSTRAINT ai_articles_status_check
    CHECK (status IN ('draft', 'published', 'archived'));
  END IF;

  -- Add category check if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_category'
  ) THEN
    ALTER TABLE ai_articles
    ADD CONSTRAINT valid_category
    CHECK (category IN ('market_trends', 'technology', 'business_impact', 'case_studies', 'news'));
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE ai_articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published articles" ON ai_articles;
DROP POLICY IF EXISTS "Admins can manage articles" ON ai_articles;

-- Create or update policies
CREATE POLICY "Public can view published articles"
  ON ai_articles
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage articles"
  ON ai_articles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_articles_published_at'
  ) THEN
    CREATE INDEX idx_ai_articles_published_at ON ai_articles(published_at DESC);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_articles_status'
  ) THEN
    CREATE INDEX idx_ai_articles_status ON ai_articles(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_articles_category'
  ) THEN
    CREATE INDEX idx_ai_articles_category ON ai_articles(category);
  END IF;
END $$;

-- Create or replace trigger for updated_at
DROP TRIGGER IF EXISTS set_ai_articles_updated_at ON ai_articles;
CREATE TRIGGER set_ai_articles_updated_at
  BEFORE UPDATE ON ai_articles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();