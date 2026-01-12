-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Create policy to allow public read access
CREATE POLICY "Public can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Create policy to allow authenticated users to delete their images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');