/*
  # Create Blog System Tables

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `summary` (text)
      - `slug` (text, unique)
      - `published_at` (timestamptz)
      - `category_id` (uuid, references categories)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  slug text UNIQUE NOT NULL,
  published_at timestamptz DEFAULT now(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_settings
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create policies for blog posts
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts
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
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

-- Create updated_at triggers
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Insert default categories
INSERT INTO categories (name, description)
VALUES 
  ('AI Market', 'Latest trends and insights in the AI industry'),
  ('Technology', 'Technical deep dives and tutorials'),
  ('Business Impact', 'How AI is transforming business operations'),
  ('Case Studies', 'Real-world implementation stories'),
  ('News', 'Latest updates and announcements')
ON CONFLICT (name) DO NOTHING;