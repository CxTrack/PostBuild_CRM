/*
  # Create AI Market Articles System
  
  1. New Tables
    - `ai_articles`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `summary` (text)
      - `image_url` (text)
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text)
      - `category` (text)
      - `tags` (text[])
      - `views` (integer)
      
  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create ai_articles table
CREATE TABLE ai_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  image_url text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category text NOT NULL,
  tags text[],
  views integer DEFAULT 0,
  CONSTRAINT valid_category CHECK (category IN ('market_trends', 'technology', 'business_impact', 'case_studies', 'news'))
);

-- Enable RLS
ALTER TABLE ai_articles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create indexes
CREATE INDEX idx_ai_articles_published_at ON ai_articles(published_at DESC);
CREATE INDEX idx_ai_articles_status ON ai_articles(status);
CREATE INDEX idx_ai_articles_category ON ai_articles(category);

-- Create trigger for updated_at
CREATE TRIGGER set_ai_articles_updated_at
  BEFORE UPDATE ON ai_articles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();