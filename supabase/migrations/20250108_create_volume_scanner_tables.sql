-- Volume Scanner Tables Migration

-- 1. Create scan sessions table
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_volume_m3 DECIMAL(10,2),
  item_count INTEGER DEFAULT 0,
  scan_quality_score DECIMAL(3,2),
  device_info JSONB,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create scanned furniture table
CREATE TABLE IF NOT EXISTS public.scanned_furniture (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Item identification
  furniture_type VARCHAR(50) NOT NULL,
  custom_name VARCHAR(200),
  room_name VARCHAR(50),
  
  -- Dimensions
  length_cm INTEGER NOT NULL,
  width_cm INTEGER NOT NULL,
  height_cm INTEGER NOT NULL,
  volume_m3 DECIMAL(10,3) NOT NULL,
  weight_estimate_kg DECIMAL(10,1),
  
  -- Scan metadata
  scan_method VARCHAR(20) NOT NULL, -- 'photo', 'manual', 'ar'
  confidence_score DECIMAL(3,2),
  scan_duration_seconds INTEGER,
  
  -- Additional information
  is_fragile BOOLEAN DEFAULT FALSE,
  requires_disassembly BOOLEAN DEFAULT FALSE,
  packing_materials JSONB,
  special_instructions TEXT,
  
  -- Media
  photos JSONB, -- Array of photo objects with URLs
  ar_model_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create room scans table
CREATE TABLE IF NOT EXISTS public.room_scans (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  room_type VARCHAR(50) NOT NULL,
  room_name VARCHAR(100),
  
  floor_area_m2 DECIMAL(10,2),
  ceiling_height_m DECIMAL(5,2),
  
  access_info JSONB, -- door width, elevator, stairs, etc.
  photos JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create furniture scan photos table (for better organization)
CREATE TABLE IF NOT EXISTS public.scan_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  furniture_id TEXT REFERENCES public.scanned_furniture(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  angle VARCHAR(20), -- 'front', 'side', 'top', 'perspective'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create storage bucket for scan photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-scans', 'furniture-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scan_sessions_customer_id ON public.scan_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_created_at ON public.scan_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scanned_furniture_customer_id ON public.scanned_furniture(customer_id);
CREATE INDEX IF NOT EXISTS idx_scanned_furniture_session_id ON public.scanned_furniture(session_id);
CREATE INDEX IF NOT EXISTS idx_scanned_furniture_type ON public.scanned_furniture(furniture_type);
CREATE INDEX IF NOT EXISTS idx_room_scans_session_id ON public.room_scans(session_id);

-- Enable RLS
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanned_furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view/edit scan data
CREATE POLICY "Users can view all scan sessions" ON public.scan_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create scan sessions" ON public.scan_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update scan sessions" ON public.scan_sessions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete scan sessions" ON public.scan_sessions
  FOR DELETE TO authenticated USING (true);

-- Same policies for scanned_furniture
CREATE POLICY "Users can view all scanned furniture" ON public.scanned_furniture
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create scanned furniture" ON public.scanned_furniture
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update scanned furniture" ON public.scanned_furniture
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete scanned furniture" ON public.scanned_furniture
  FOR DELETE TO authenticated USING (true);

-- Same policies for room_scans
CREATE POLICY "Users can view all room scans" ON public.room_scans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create room scans" ON public.room_scans
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update room scans" ON public.room_scans
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete room scans" ON public.room_scans
  FOR DELETE TO authenticated USING (true);

-- Same policies for scan_photos
CREATE POLICY "Users can view all scan photos" ON public.scan_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create scan photos" ON public.scan_photos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update scan photos" ON public.scan_photos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete scan photos" ON public.scan_photos
  FOR DELETE TO authenticated USING (true);

-- Storage policies for furniture-scans bucket
CREATE POLICY "Anyone can view scan photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'furniture-scans');

CREATE POLICY "Authenticated users can upload scan photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'furniture-scans');

CREATE POLICY "Authenticated users can update scan photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'furniture-scans');

CREATE POLICY "Authenticated users can delete scan photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'furniture-scans');

-- Helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_scan_sessions_updated_at BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scanned_furniture_updated_at BEFORE UPDATE ON public.scanned_furniture
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_scans_updated_at BEFORE UPDATE ON public.room_scans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.scan_sessions TO authenticated;
GRANT ALL ON public.scanned_furniture TO authenticated;
GRANT ALL ON public.room_scans TO authenticated;
GRANT ALL ON public.scan_photos TO authenticated;