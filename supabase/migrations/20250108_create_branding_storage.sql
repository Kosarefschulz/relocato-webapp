-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to branding assets
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');

-- Allow authenticated users to upload branding assets
CREATE POLICY "Authenticated users can upload branding assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their branding assets
CREATE POLICY "Authenticated users can update branding assets" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their branding assets
CREATE POLICY "Authenticated users can delete branding assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);