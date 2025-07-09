-- Create WhatsApp Media Storage Bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  true,
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for WhatsApp media
CREATE POLICY "Authenticated users can upload WhatsApp media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can view WhatsApp media" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can update their own WhatsApp media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can delete their own WhatsApp media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'whatsapp-media');