-- Create storage buckets for furniture scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-scans', 'furniture-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'furniture-scans');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'furniture-scans' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'furniture-scans' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'furniture-scans');

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects 
FOR DELETE 
USING (bucket_id = 'furniture-scans' AND auth.uid()::text = (storage.foldername(name))[1]);