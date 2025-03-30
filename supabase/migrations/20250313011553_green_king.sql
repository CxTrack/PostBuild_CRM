/*
  # Add AI Article Generation Settings
  
  1. Changes
    - Add settings for controlling article generation frequency
    - Add permissions for scheduled function execution
    - Add logging table for generation attempts
*/

-- Create article generation settings table
CREATE TABLE IF NOT EXISTS article_generation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT true,
  frequency text DEFAULT 'daily',
  categories text[] DEFAULT ARRAY['market_trends', 'technology', 'business_impact']::text[],
  last_run timestamptz,
  next_run timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create generation logs table
CREATE TABLE IF NOT EXISTS article_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  error text,
  article_id uuid REFERENCES ai_articles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE article_generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_generation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage generation settings"
  ON article_generation_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_settings
    WHERE user_id = auth.uid()
    AND is_admin = true
  ));

CREATE POLICY "Admins can view generation logs"
  ON article_generation_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_settings
    WHERE user_id = auth.uid()
    AND is_admin = true
  ));

-- Insert default settings
INSERT INTO article_generation_settings (enabled, frequency, categories)
VALUES (
  true,
  'daily',
  ARRAY['market_trends', 'technology', 'business_impact', 'case_studies', 'news']
);

-- Create indexes
CREATE INDEX idx_article_generation_logs_created_at 
ON article_generation_logs(created_at DESC);

CREATE INDEX idx_article_generation_logs_status 
ON article_generation_logs(status);