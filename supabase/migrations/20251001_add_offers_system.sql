-- Migration: Angebots-System für Rümpel Schmiede
-- Date: 2025-10-01
-- Description: Erstellt Tabellen für Angebotsverwaltung mit CRM-Integration

-- ============================================
-- ANGEBOTE (OFFERS) TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Verknüpfung zum Kunden
  customer_id TEXT NOT NULL,

  -- Angebotskopfdaten
  offer_number TEXT UNIQUE NOT NULL,           -- AG0159
  customer_number TEXT,                         -- 10253
  offer_date DATE NOT NULL,                     -- 01.10.2025
  valid_until DATE,                             -- 31.10.2025

  -- Status-Tracking
  status TEXT DEFAULT 'offen' CHECK (status IN (
    'offen',                  -- Angebot erstellt
    'verhandlung',            -- In Verhandlung
    'angenommen',             -- Angenommen
    'abgelehnt',              -- Abgelehnt
    'abgelaufen',             -- Gültigkeit abgelaufen
    'storniert'               -- Storniert
  )),

  -- Preisdaten
  net_amount DECIMAL(10,2),                     -- Nettobetrag
  vat_rate INTEGER DEFAULT 19,                  -- MwSt-Satz (%)
  vat_amount DECIMAL(10,2),                     -- MwSt-Betrag
  gross_amount DECIMAL(10,2) NOT NULL,          -- Bruttobetrag
  price_type TEXT,                              -- Pauschalpreis, Festpreis, etc.

  -- Zahlungsbedingungen
  payment_timing TEXT,                          -- "direkt nach Durchführung vor Ort"
  payment_methods JSONB,                        -- ["EC-Karte", "Bar"]

  -- Leistungsdetails (als JSON)
  service_details JSONB,                        -- Komplette Service-Info

  -- Termine
  appointments JSONB,                           -- [{"date": "13.10.2025", "time": "08:30"}]

  -- Metadaten
  document_type TEXT DEFAULT 'Angebot',         -- Angebot, Rechnung, Auftragsbestätigung
  pdf_file_name TEXT,                           -- Original PDF-Dateiname
  raw_text TEXT,                                -- Extrahierter Rohtext

  -- Wiedervorlage/Follow-up
  follow_up_date DATE,                          -- Automatisch 7 Tage vor valid_until
  follow_up_done BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,         -- Zeitpunkt der Annahme
  rejected_at TIMESTAMP WITH TIME ZONE          -- Zeitpunkt der Ablehnung
);

-- Indizes für Performance
CREATE INDEX idx_offers_customer_id ON public.offers(customer_id);
CREATE INDEX idx_offers_offer_number ON public.offers(offer_number);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_offer_date ON public.offers(offer_date);
CREATE INDEX idx_offers_valid_until ON public.offers(valid_until);
CREATE INDEX idx_offers_follow_up_date ON public.offers(follow_up_date);

-- Full-text search für Angebote
CREATE INDEX idx_offers_raw_text ON public.offers USING GIN(to_tsvector('german', raw_text));

-- ============================================
-- LEISTUNGSPOSITIONEN (OFFER LINE ITEMS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.offer_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,

  position INTEGER NOT NULL,                    -- Positionsnummer
  designation TEXT NOT NULL,                    -- Bezeichnung der Leistung

  -- Details
  object_size TEXT,                             -- "200 qm"
  rooms JSONB,                                  -- ["Dachboden", "EG", "1. OG"]
  exceptions JSONB,                             -- ["3x Küche verbleibt"]
  condition TEXT,                               -- "besenrein"

  -- Preise
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'Pauschal',
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_offer_line_items_offer_id ON public.offer_line_items(offer_id);

-- ============================================
-- ANGEBOTS-HISTORIE (AUDIT LOG)
-- ============================================

CREATE TABLE IF NOT EXISTS public.offer_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,

  action TEXT NOT NULL,                         -- Status-Änderung, Kommentar, etc.
  old_value TEXT,
  new_value TEXT,
  comment TEXT,

  user_id TEXT,                                 -- Wer hat die Änderung gemacht

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_offer_history_offer_id ON public.offer_history(offer_id);
CREATE INDEX idx_offer_history_created_at ON public.offer_history(created_at);

-- ============================================
-- WIEDERVORLAGEN (FOLLOW-UPS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Verknüpfung
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,

  -- Wiedervorlage-Details
  due_date DATE NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('niedrig', 'normal', 'hoch', 'dringend')),
  type TEXT NOT NULL,                           -- "Angebot abgelaufen", "Termin vorgeschlagen", etc.

  -- Status
  status TEXT DEFAULT 'offen' CHECK (status IN ('offen', 'erledigt', 'verschoben', 'abgebrochen')),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Notizen
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_follow_ups_offer_id ON public.follow_ups(offer_id);
CREATE INDEX idx_follow_ups_customer_id ON public.follow_ups(customer_id);
CREATE INDEX idx_follow_ups_due_date ON public.follow_ups(due_date);
CREATE INDEX idx_follow_ups_status ON public.follow_ups(status);

-- ============================================
-- TRIGGER-FUNKTIONEN
-- ============================================

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offers_updated_at_trigger
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();

-- Automatische Follow-up Erstellung bei neuem Angebot
CREATE OR REPLACE FUNCTION create_offer_follow_ups()
RETURNS TRIGGER AS $$
BEGIN
  -- Follow-up 7 Tage vor Ablauf
  IF NEW.valid_until IS NOT NULL THEN
    INSERT INTO public.follow_ups (offer_id, customer_id, due_date, type, notes)
    VALUES (
      NEW.id,
      NEW.customer_id,
      NEW.valid_until - INTERVAL '7 days',
      'Angebot läuft bald ab',
      'Angebot ' || NEW.offer_number || ' läuft am ' || NEW.valid_until || ' ab. Kunde kontaktieren.'
    );

    -- Update follow_up_date im Angebot
    NEW.follow_up_date := NEW.valid_until - INTERVAL '7 days';
  END IF;

  -- Follow-up für vorgeschlagene Termine
  IF NEW.appointments IS NOT NULL AND jsonb_array_length(NEW.appointments) > 0 THEN
    INSERT INTO public.follow_ups (offer_id, customer_id, due_date, type, notes)
    VALUES (
      NEW.id,
      NEW.customer_id,
      (NEW.appointments->0->>'date')::date - INTERVAL '2 days',
      'Terminbestätigung einholen',
      'Termin am ' || (NEW.appointments->0->>'date') || ' bestätigen lassen.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offers_create_follow_ups_trigger
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION create_offer_follow_ups();

-- Status-Änderung loggen
CREATE OR REPLACE FUNCTION log_offer_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.offer_history (offer_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      'Status geändert',
      OLD.status,
      NEW.status
    );

    -- Bei Annahme oder Ablehnung Zeitstempel setzen
    IF NEW.status = 'angenommen' THEN
      NEW.accepted_at := NOW();
    ELSIF NEW.status = 'abgelehnt' THEN
      NEW.rejected_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offers_log_status_change_trigger
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION log_offer_status_change();

-- ============================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Policies (vorerst alle authenticated users)
CREATE POLICY "Authenticated users can view offers" ON public.offers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create offers" ON public.offers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update offers" ON public.offers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete offers" ON public.offers
  FOR DELETE TO authenticated USING (true);

-- Gleiche Policies für andere Tabellen
CREATE POLICY "Authenticated users can manage line items" ON public.offer_line_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view history" ON public.offer_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage follow-ups" ON public.follow_ups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- VIEWS FÜR REPORTING
-- ============================================

-- Offene Angebote mit Kundeninformationen
CREATE OR REPLACE VIEW public.v_active_offers AS
SELECT
  o.*,
  c.name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  c.current_phase as customer_phase,
  COUNT(DISTINCT oli.id) as line_items_count,
  (SELECT COUNT(*) FROM public.follow_ups f WHERE f.offer_id = o.id AND f.status = 'offen') as pending_follow_ups
FROM public.offers o
LEFT JOIN public.customers c ON o.customer_id::text = c.id::text
LEFT JOIN public.offer_line_items oli ON o.id = oli.offer_id
WHERE o.status IN ('offen', 'verhandlung')
GROUP BY o.id, c.name, c.email, c.phone, c.current_phase;

-- Angebote die bald ablaufen
CREATE OR REPLACE VIEW public.v_expiring_offers AS
SELECT
  o.*,
  c.name as customer_name,
  c.email as customer_email,
  (o.valid_until - CURRENT_DATE) as days_until_expiry
FROM public.offers o
LEFT JOIN public.customers c ON o.customer_id::text = c.id::text
WHERE o.status = 'offen'
  AND o.valid_until IS NOT NULL
  AND o.valid_until >= CURRENT_DATE
  AND o.valid_until <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY o.valid_until ASC;

-- ============================================
-- KOMMENTARE
-- ============================================

COMMENT ON TABLE public.offers IS 'Angebotsverwaltung für Hausauflösungen und Umzüge';
COMMENT ON TABLE public.offer_line_items IS 'Einzelne Leistungspositionen eines Angebots';
COMMENT ON TABLE public.offer_history IS 'Audit-Log für Angebots-Änderungen';
COMMENT ON TABLE public.follow_ups IS 'Wiedervorlagen und Follow-up Tasks';

COMMENT ON COLUMN public.offers.offer_number IS 'Eindeutige Angebotsnummer (z.B. AG0159)';
COMMENT ON COLUMN public.offers.customer_number IS 'Kundennummer aus dem PDF';
COMMENT ON COLUMN public.offers.service_details IS 'JSON mit allen Service-Details (Räume, Ausnahmen, Zustand)';
COMMENT ON COLUMN public.offers.follow_up_date IS 'Automatisch berechnet: 7 Tage vor Ablauf';
