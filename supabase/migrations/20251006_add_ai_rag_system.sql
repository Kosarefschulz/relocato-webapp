-- ============================================
-- AI RAG SYSTEM - Migration
-- Date: 2025-10-06
-- Description: Vector database for RAG, Chat-Historie, Learning System
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- CHAT-HISTORIE TABELLE (mit Embeddings)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Session & User
  user_id TEXT,
  session_id UUID NOT NULL,

  -- Message
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
  message_content TEXT NOT NULL,
  embedding vector(1024), -- Voyage AI embedding dimension

  -- Kontext
  tools_used JSONB,
  customer_id TEXT,           -- Falls Chat über spezifischen Kunden
  quote_id TEXT,              -- Falls Chat über Angebot
  context_data JSONB,         -- Zusätzlicher Kontext

  -- Performance
  success BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  tokens_used INTEGER,

  -- Image (falls vorhanden)
  image_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index für schnelle Abfragen
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);

-- ============================================
-- CHAT-SESSIONS TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User
  user_id TEXT,
  user_name TEXT,

  -- Session Info
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Statistiken
  message_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  tools_used_count JSONB, -- {"create_customer": 3, "search": 5}

  -- Metadata
  metadata JSONB
);

-- ============================================
-- KNOWLEDGE BASE TABELLE (mit Embeddings)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Kategorisierung
  category TEXT NOT NULL CHECK (category IN (
    'pricing',        -- Preise & Kalkulation
    'faq_customer',   -- Kunden-FAQs
    'faq_internal',   -- Interne FAQs
    'process',        -- Prozesse & Workflows
    'email_template', -- E-Mail-Vorlagen
    'phone_script',   -- Telefon-Scripts
    'legal',          -- AGB, Haftung, etc.
    'troubleshooting',-- Problem-Lösungen
    'custom'          -- Benutzerdefiniert
  )),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024),

  -- Metadaten
  tags TEXT[],
  keywords TEXT[],
  source_file TEXT,           -- z.B. "pricing-guide.md"

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  helpful_count INTEGER DEFAULT 0,      -- Wie oft als hilfreich bewertet
  unhelpful_count INTEGER DEFAULT 0,    -- Wie oft als nicht hilfreich

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEARNED PATTERNS TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_learned_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Pattern
  user_question TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  embedding vector(1024),

  -- Context
  tools_used JSONB,
  customer_context JSONB,

  -- Success Metrics
  success_rating FLOAT CHECK (success_rating >= 0 AND success_rating <= 1),
  response_time_ms INTEGER,
  user_feedback TEXT,         -- Optional: Text-Feedback vom User

  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Learning
  confidence_score FLOAT DEFAULT 0.5,
  is_approved BOOLEAN DEFAULT false,  -- Manuell approved für Auto-Use

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER FEEDBACK TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Bezug
  chat_message_id UUID REFERENCES ai_chat_history(id),
  session_id UUID REFERENCES ai_chat_sessions(id),

  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 1-5 Sterne
  thumbs BOOLEAN,             -- true = 👍, false = 👎, null = keine Bewertung
  feedback_text TEXT,
  feedback_type TEXT CHECK (feedback_type IN (
    'helpful',
    'unhelpful',
    'incorrect',
    'incomplete',
    'perfect'
  )),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VECTOR SEARCH FUNCTIONS
-- ============================================

-- Sucht ähnliche Chat-Nachrichten
CREATE OR REPLACE FUNCTION match_chat_history(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_session_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  message_content text,
  message_role text,
  tools_used jsonb,
  similarity float,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_chat_history.id,
    ai_chat_history.message_content,
    ai_chat_history.message_role,
    ai_chat_history.tools_used,
    1 - (ai_chat_history.embedding <=> query_embedding) as similarity,
    ai_chat_history.created_at
  FROM ai_chat_history
  WHERE
    ai_chat_history.embedding IS NOT NULL
    AND (filter_session_id IS NULL OR ai_chat_history.session_id != filter_session_id) -- Exclude current session
    AND 1 - (ai_chat_history.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_chat_history.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Sucht in Knowledge Base
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 3,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  similarity float,
  usage_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_knowledge_base.id,
    ai_knowledge_base.category,
    ai_knowledge_base.title,
    ai_knowledge_base.content,
    1 - (ai_knowledge_base.embedding <=> query_embedding) as similarity,
    ai_knowledge_base.usage_count
  FROM ai_knowledge_base
  WHERE
    ai_knowledge_base.embedding IS NOT NULL
    AND (filter_category IS NULL OR ai_knowledge_base.category = filter_category)
    AND 1 - (ai_knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Sucht erfolgreiche Learned Patterns
CREATE OR REPLACE FUNCTION match_learned_patterns(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 2
)
RETURNS TABLE (
  id uuid,
  user_question text,
  ai_response text,
  tools_used jsonb,
  success_rating float,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_learned_patterns.id,
    ai_learned_patterns.user_question,
    ai_learned_patterns.ai_response,
    ai_learned_patterns.tools_used,
    ai_learned_patterns.success_rating,
    1 - (ai_learned_patterns.embedding <=> query_embedding) as similarity
  FROM ai_learned_patterns
  WHERE
    ai_learned_patterns.embedding IS NOT NULL
    AND ai_learned_patterns.success_rating > 0.7  -- Nur erfolgreiche Patterns
    AND 1 - (ai_learned_patterns.embedding <=> query_embedding) > match_threshold
  ORDER BY
    ai_learned_patterns.success_rating DESC,
    ai_learned_patterns.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- INDEXES FÜR PERFORMANCE
-- ============================================

-- Vector Indexes (HNSW für schnellere Suche)
CREATE INDEX IF NOT EXISTS ai_chat_history_embedding_idx
  ON ai_chat_history
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS ai_knowledge_base_embedding_idx
  ON ai_knowledge_base
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS ai_learned_patterns_embedding_idx
  ON ai_learned_patterns
  USING hnsw (embedding vector_cosine_ops);

-- Standard Indexes
CREATE INDEX IF NOT EXISTS ai_chat_history_session_idx ON ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS ai_chat_history_created_idx ON ai_chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_knowledge_base_category_idx ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS ai_learned_patterns_rating_idx ON ai_learned_patterns(success_rating DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-Update usage_count in knowledge base
CREATE OR REPLACE FUNCTION increment_knowledge_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_knowledge_base
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update session statistics
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_chat_sessions
  SET
    message_count = message_count + 1,
    last_activity_at = NOW(),
    total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_used, 0)
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_history_stats_trigger
  AFTER INSERT ON ai_chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_session_stats();

-- ============================================
-- VIEWS
-- ============================================

-- View: Aktive Sessions
CREATE OR REPLACE VIEW v_active_ai_sessions AS
SELECT
  s.id,
  s.user_id,
  s.started_at,
  s.message_count,
  s.total_tokens_used,
  COUNT(DISTINCT h.id) as total_messages,
  MAX(h.created_at) as last_message_at
FROM ai_chat_sessions s
LEFT JOIN ai_chat_history h ON h.session_id = s.id
WHERE s.ended_at IS NULL
GROUP BY s.id, s.user_id, s.started_at, s.message_count, s.total_tokens_used;

-- View: Top Knowledge Items
CREATE OR REPLACE VIEW v_top_knowledge AS
SELECT
  id,
  category,
  title,
  usage_count,
  helpful_count,
  unhelpful_count,
  CASE
    WHEN (helpful_count + unhelpful_count) > 0
    THEN helpful_count::float / (helpful_count + unhelpful_count)
    ELSE 0.5
  END as helpfulness_ratio,
  last_used_at
FROM ai_knowledge_base
WHERE usage_count > 0
ORDER BY usage_count DESC, helpfulness_ratio DESC
LIMIT 50;

-- ============================================
-- CLEANUP POLICIES
-- ============================================

-- Auto-delete alte Chat-Historie (>90 Tage)
CREATE OR REPLACE FUNCTION cleanup_old_chat_history()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_chat_history
  WHERE created_at < NOW() - INTERVAL '90 days';

  DELETE FROM ai_chat_sessions
  WHERE started_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Beispiel: Knowledge Base Entry
INSERT INTO ai_knowledge_base (category, title, content, tags, keywords) VALUES
('faq_customer', 'Was kostet ein Umzug?',
 'Die Kosten hängen von Volumen, Entfernung und Etagen ab. Beispiel: 3-Zimmer (25m³) = 1.099€ Basis. Jede Etage ohne Aufzug +50€. Über 50km: +1,20€/km.',
 ARRAY['preis', 'kosten', 'kalkulation'],
 ARRAY['umzugskosten', 'preisberechnung', '3-zimmer']
),
('pricing', 'Preistabelle Basis',
 '10m³=749€, 15m³=899€, 20m³=1.099€, 25m³=1.299€, 30m³=1.499€, 35m³=1.699€, 40m³=1.899€',
 ARRAY['preise', 'tabelle'],
 ARRAY['preistabelle', 'grundpreis']
);

-- ============================================
-- GRANTS (für Supabase RLS)
-- ============================================

-- Public read access für Knowledge Base
GRANT SELECT ON ai_knowledge_base TO anon, authenticated;

-- Authenticated users können Chat-Historie lesen/schreiben
GRANT SELECT, INSERT ON ai_chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_chat_sessions TO authenticated;

-- Nur authenticated für Learned Patterns
GRANT SELECT, INSERT ON ai_learned_patterns TO authenticated;

-- Nur authenticated für Feedback
GRANT SELECT, INSERT ON ai_user_feedback TO authenticated;

-- ============================================
-- KOMMENTARE
-- ============================================

COMMENT ON TABLE ai_chat_history IS 'Persistente Chat-Historie mit Vector Embeddings für RAG';
COMMENT ON TABLE ai_knowledge_base IS 'Knowledge Base mit Embeddings - Basis für RAG';
COMMENT ON TABLE ai_learned_patterns IS 'Automatisch gelernte erfolgreiche Interaktions-Patterns';
COMMENT ON TABLE ai_user_feedback IS 'User-Feedback für Continuous Learning';

-- ============================================
-- FERTIG!
-- ============================================

SELECT 'AI RAG System Migration completed successfully!' as status;
