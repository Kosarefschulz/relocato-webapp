-- =====================================================
-- KORRIGIERTE REIHENFOLGE FÜR DATABASE SETUP
-- =====================================================
-- Führen Sie diese Befehle in der richtigen Reihenfolge aus

-- 1. Zuerst prüfen ob scan_sessions existiert
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_sessions') THEN
        -- scan_sessions Tabelle erstellen (falls nicht vorhanden)
        CREATE TABLE scan_sessions (
            id TEXT PRIMARY KEY,
            customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
            employee_id UUID,
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
    END IF;
END $$;

-- 2. Dann prüfen ob scanned_furniture existiert
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scanned_furniture') THEN
        -- scanned_furniture Tabelle erstellen (falls nicht vorhanden)
        CREATE TABLE scanned_furniture (
            id TEXT PRIMARY KEY,
            session_id TEXT REFERENCES scan_sessions(id) ON DELETE CASCADE,
            customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
            furniture_type VARCHAR(50) NOT NULL,
            custom_name VARCHAR(200),
            room_name VARCHAR(50),
            length_cm INTEGER NOT NULL,
            width_cm INTEGER NOT NULL,
            height_cm INTEGER NOT NULL,
            volume_m3 DECIMAL(10,3) NOT NULL,
            weight_estimate_kg DECIMAL(10,1),
            scan_method VARCHAR(20) NOT NULL,
            confidence_score DECIMAL(3,2),
            scan_duration_seconds INTEGER,
            is_fragile BOOLEAN DEFAULT FALSE,
            requires_disassembly BOOLEAN DEFAULT FALSE,
            packing_materials JSONB,
            special_instructions TEXT,
            photos JSONB,
            ar_model_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 3. Jetzt können wir scan_photos erstellen
CREATE TABLE IF NOT EXISTS scan_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_session_id TEXT REFERENCES scan_sessions(id) ON DELETE CASCADE,
    furniture_id TEXT REFERENCES scanned_furniture(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    photo_type VARCHAR(50), -- 'overview', 'detail', 'damage', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS auf den neuen Tabellen deaktivieren
ALTER TABLE IF EXISTS scan_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scanned_furniture DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scan_photos DISABLE ROW LEVEL SECURITY;

-- Test
SELECT 'Scan-Tabellen erfolgreich erstellt!' as status;