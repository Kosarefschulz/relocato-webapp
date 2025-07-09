-- Korrigierter SQL-Befehl für die users Tabelle
-- Das Problem war ein fehlendes schließendes Klammer

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb,
  firebase_id VARCHAR(255) UNIQUE
); -- Diese schließende Klammer fehlte!

-- RLS deaktivieren
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Test
SELECT 'Users Tabelle erfolgreich erstellt!' as status;