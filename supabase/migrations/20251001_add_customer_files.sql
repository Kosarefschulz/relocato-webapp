-- Migration: Kundendateien-System
-- Date: 2025-10-01
-- Description: Dateiverwaltung für Kunden mit automatischer PDF-Analyse

-- ============================================
-- KUNDENDATEIEN TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Verknüpfung
  customer_id TEXT NOT NULL,

  -- Datei-Informationen
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,                    -- PDF, DOCX, XLSX, PNG, etc.
  file_size BIGINT NOT NULL,                  -- in Bytes
  file_path TEXT NOT NULL,                    -- Storage-Pfad
  mime_type TEXT,

  -- Kategorisierung
  category TEXT DEFAULT 'allgemein' CHECK (category IN (
    'angebot',          -- Angebote
    'rechnung',         -- Rechnungen
    'vertrag',          -- Verträge
    'besichtigung',     -- Besichtigungsfotos/-dokumente
    'sonstiges',        -- Sonstige Dokumente
    'allgemein'         -- Allgemeine Dateien
  )),

  -- Automatisch extrahierte Daten (für PDFs)
  parsed_data JSONB,                          -- Geparste Daten aus PDF
  is_parsed BOOLEAN DEFAULT false,            -- Wurde bereits geparst?
  parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN (
    'pending',          -- Wartet auf Parsing
    'processing',       -- Wird gerade geparst
    'completed',        -- Erfolgreich geparst
    'failed',           -- Parsing fehlgeschlagen
    'skipped'           -- Kein PDF, übersprungen
  )),
  parse_error TEXT,                           -- Fehler beim Parsing

  -- Metadaten
  description TEXT,                           -- Optionale Beschreibung
  tags TEXT[],                                -- Tags für bessere Suche

  -- Upload-Info
  uploaded_by TEXT,                           -- Wer hat hochgeladen
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,        -- Soft Delete
  is_deleted BOOLEAN DEFAULT false
);

-- Indizes
CREATE INDEX idx_customer_files_customer_id ON public.customer_files(customer_id);
CREATE INDEX idx_customer_files_category ON public.customer_files(category);
CREATE INDEX idx_customer_files_file_type ON public.customer_files(file_type);
CREATE INDEX idx_customer_files_is_deleted ON public.customer_files(is_deleted);
CREATE INDEX idx_customer_files_uploaded_at ON public.customer_files(uploaded_at);
CREATE INDEX idx_customer_files_parsed_data ON public.customer_files USING GIN(parsed_data);

-- Full-text search
CREATE INDEX idx_customer_files_search ON public.customer_files USING GIN(
  to_tsvector('german', COALESCE(file_name, '') || ' ' || COALESCE(description, ''))
);

-- ============================================
-- STORAGE BUCKET KONFIGURATION
-- ============================================

-- Erstelle Storage Bucket für Kundendateien
-- (wird im Supabase Dashboard oder via API erstellt)

-- ============================================
-- TRIGGER-FUNKTIONEN
-- ============================================

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_customer_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_files_updated_at_trigger
  BEFORE UPDATE ON public.customer_files
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_files_updated_at();

-- Automatisches Parsing für PDF-Dateien nach Upload
CREATE OR REPLACE FUNCTION trigger_pdf_parsing()
RETURNS TRIGGER AS $$
BEGIN
  -- Wenn es ein PDF ist und noch nicht geparst wurde
  IF NEW.file_type = 'pdf' AND NEW.is_parsed = false THEN
    NEW.parse_status := 'pending';
  ELSIF NEW.file_type != 'pdf' THEN
    NEW.parse_status := 'skipped';
    NEW.is_parsed := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_files_auto_parse_trigger
  BEFORE INSERT ON public.customer_files
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pdf_parsing();

-- ============================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE public.customer_files ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view files" ON public.customer_files
  FOR SELECT TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can upload files" ON public.customer_files
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update files" ON public.customer_files
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete files" ON public.customer_files
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- VIEWS
-- ============================================

-- Datei-Übersicht pro Kunde
CREATE OR REPLACE VIEW public.v_customer_files_overview AS
SELECT
  customer_id,
  COUNT(*) as total_files,
  COUNT(*) FILTER (WHERE file_type = 'pdf') as pdf_count,
  COUNT(*) FILTER (WHERE category = 'angebot') as angebot_count,
  COUNT(*) FILTER (WHERE category = 'rechnung') as rechnung_count,
  COUNT(*) FILTER (WHERE is_parsed = true AND file_type = 'pdf') as parsed_pdf_count,
  SUM(file_size) as total_size_bytes,
  MAX(uploaded_at) as last_upload
FROM public.customer_files
WHERE is_deleted = false
GROUP BY customer_id;

-- Dateien die auf Parsing warten
CREATE OR REPLACE VIEW public.v_pending_pdf_parsing AS
SELECT
  cf.*,
  c.name as customer_name,
  c.email as customer_email
FROM public.customer_files cf
LEFT JOIN public.customers c ON cf.customer_id::text = c.id::text
WHERE cf.file_type = 'pdf'
  AND cf.parse_status = 'pending'
  AND cf.is_deleted = false
ORDER BY cf.uploaded_at ASC;

-- ============================================
-- FUNKTIONEN FÜR DATEI-OPERATIONEN
-- ============================================

-- Funktion zum Markieren einer Datei als geparst
CREATE OR REPLACE FUNCTION mark_file_as_parsed(
  p_file_id UUID,
  p_parsed_data JSONB,
  p_success BOOLEAN DEFAULT true,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_success THEN
    UPDATE public.customer_files
    SET
      is_parsed = true,
      parse_status = 'completed',
      parsed_data = p_parsed_data,
      parse_error = NULL,
      updated_at = NOW()
    WHERE id = p_file_id;
  ELSE
    UPDATE public.customer_files
    SET
      parse_status = 'failed',
      parse_error = p_error,
      updated_at = NOW()
    WHERE id = p_file_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Soft-Delete
CREATE OR REPLACE FUNCTION soft_delete_file(p_file_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.customer_files
  SET
    is_deleted = true,
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Abrufen aller Dateien eines Kunden
CREATE OR REPLACE FUNCTION get_customer_files(p_customer_id TEXT)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_path TEXT,
  category TEXT,
  parsed_data JSONB,
  is_parsed BOOLEAN,
  description TEXT,
  tags TEXT[],
  uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id,
    cf.file_name,
    cf.file_type,
    cf.file_size,
    cf.file_path,
    cf.category,
    cf.parsed_data,
    cf.is_parsed,
    cf.description,
    cf.tags,
    cf.uploaded_at
  FROM public.customer_files cf
  WHERE cf.customer_id = p_customer_id
    AND cf.is_deleted = false
  ORDER BY cf.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- KOMMENTARE
-- ============================================

COMMENT ON TABLE public.customer_files IS 'Dateiverwaltung für Kunden mit automatischer PDF-Analyse';
COMMENT ON COLUMN public.customer_files.parsed_data IS 'Automatisch extrahierte Daten aus PDF (Preise, Leistungen, etc.)';
COMMENT ON COLUMN public.customer_files.file_path IS 'Pfad in Supabase Storage: customer-files/{customer_id}/{file_id}/{filename}';

-- Beispiel parsed_data Struktur:
-- {
--   "type": "angebot",
--   "number": "AG0159",
--   "date": "2025-10-01",
--   "total": 3500.00,
--   "net": 2941.18,
--   "vat": 558.82,
--   "services": [...],
--   "customer": {...}
-- }
