/*
  # Add quote preview image

  1. New Files
    - Add quote preview image to storage bucket
    - Set public access policy for the image

  2. Security
    - Enable public read access for the image
    - Restrict write access to authenticated users
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow public access to the images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

-- Set up storage policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Note: After applying this migration, you'll need to manually upload 
-- the quote preview image to the public bucket with the path:
-- /images/quote-preview.jpg