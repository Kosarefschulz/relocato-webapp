-- Setup Vector Search with pgvector
-- Prerequisite: pgvector extension must be enabled first

-- Create vector embeddings table for customers
CREATE TABLE IF NOT EXISTS customer_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'name', 'address', 'notes', 'combined'
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX idx_customer_embeddings_vector ON customer_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_customer_embeddings_customer_id ON customer_embeddings(customer_id);
CREATE INDEX idx_customer_embeddings_content_type ON customer_embeddings(content_type);

-- Create vector embeddings table for quotes
CREATE TABLE IF NOT EXISTS quote_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'services', 'notes', 'items', 'combined'
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for quote embeddings
CREATE INDEX idx_quote_embeddings_vector ON quote_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_quote_embeddings_quote_id ON quote_embeddings(quote_id);
CREATE INDEX idx_quote_embeddings_content_type ON quote_embeddings(content_type);

-- Create knowledge base table for company information
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'faq', 'policy', 'service', 'pricing'
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for knowledge base
CREATE INDEX idx_knowledge_base_vector ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_active ON knowledge_base(is_active);

-- Function to search similar customers
CREATE OR REPLACE FUNCTION search_similar_customers(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  threshold FLOAT DEFAULT 0.8
)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  similarity FLOAT,
  content TEXT,
  content_type VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.customer_id,
    c.name as customer_name,
    1 - (ce.embedding <=> query_embedding) as similarity,
    ce.content,
    ce.content_type
  FROM customer_embeddings ce
  JOIN customers c ON c.id = ce.customer_id
  WHERE 1 - (ce.embedding <=> query_embedding) > threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search similar quotes
CREATE OR REPLACE FUNCTION search_similar_quotes(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  threshold FLOAT DEFAULT 0.8
)
RETURNS TABLE (
  quote_id UUID,
  customer_name TEXT,
  similarity FLOAT,
  content TEXT,
  content_type VARCHAR(50),
  price DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qe.quote_id,
    q.customer_name,
    1 - (qe.embedding <=> query_embedding) as similarity,
    qe.content,
    qe.content_type,
    q.price
  FROM quote_embeddings qe
  JOIN quotes q ON q.id = qe.quote_id
  WHERE 1 - (qe.embedding <=> query_embedding) > threshold
  ORDER BY qe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  threshold FLOAT DEFAULT 0.7,
  filter_category VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  content TEXT,
  category VARCHAR(100),
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE kb.is_active = true
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND 1 - (kb.embedding <=> query_embedding) > threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to update embeddings when customer data changes
CREATE OR REPLACE FUNCTION update_customer_embedding_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark for re-embedding by setting embedding to NULL
  UPDATE customer_embeddings
  SET embedding = NULL,
      updated_at = NOW()
  WHERE customer_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_update_embedding
AFTER UPDATE ON customers
FOR EACH ROW
WHEN (
  OLD.name IS DISTINCT FROM NEW.name OR
  OLD.email IS DISTINCT FROM NEW.email OR
  OLD.phone IS DISTINCT FROM NEW.phone OR
  OLD.address IS DISTINCT FROM NEW.address OR
  OLD.destination_address IS DISTINCT FROM NEW.destination_address
)
EXECUTE FUNCTION update_customer_embedding_trigger();

-- Trigger for quote embeddings
CREATE OR REPLACE FUNCTION update_quote_embedding_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark for re-embedding
  UPDATE quote_embeddings
  SET embedding = NULL,
      updated_at = NOW()
  WHERE quote_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_update_embedding
AFTER UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION update_quote_embedding_trigger();

-- Add some sample knowledge base entries
INSERT INTO knowledge_base (title, content, category) VALUES
('Umzugskosten Berechnung', 'Die Umzugskosten setzen sich aus verschiedenen Faktoren zusammen: Volumen des Umzugsguts, Entfernung, Etage, Zusatzleistungen wie Packservice oder Möbelmontage. Durchschnittlich kostet ein Umzug innerhalb der Stadt zwischen 500-1500€, bei Fernumzügen 1500-5000€.', 'pricing'),
('Verpackungsmaterial', 'Wir bieten professionelles Verpackungsmaterial: Umzugskartons in verschiedenen Größen, Luftpolsterfolie, Packpapier, Klebeband. Spezialverpackungen für Bilder, Spiegel und Kleidung sind ebenfalls verfügbar. Die Kosten betragen ca. 2-5€ pro Karton.', 'service'),
('Versicherung', 'Unsere Umzugsversicherung deckt Schäden bis zu 620€ pro Kubikmeter ab. Für wertvolle Gegenstände empfehlen wir eine zusätzliche Transportversicherung. Die Versicherung kostet üblicherweise 1-2% des Umzugswerts.', 'policy'),
('Umzugstermin', 'Wir empfehlen, den Umzug mindestens 4-6 Wochen im Voraus zu planen. In der Hauptsaison (Mai-September) und zum Monatsende sind Termine schnell ausgebucht. Flexible Termine können zu günstigeren Preisen führen.', 'faq'),
('Möbelmontage', 'Unser Team bietet professionelle Demontage und Montage Ihrer Möbel. Dies umfasst Schränke, Betten, Regale und Küchenmöbel. Die Kosten betragen ca. 30-50€ pro Stunde und Monteur.', 'service');

-- RLS Policies for vector tables
ALTER TABLE customer_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read embeddings
CREATE POLICY "Allow authenticated read customer embeddings" ON customer_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read quote embeddings" ON quote_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read knowledge base" ON knowledge_base
  FOR SELECT TO authenticated USING (is_active = true);

-- Allow service role to manage embeddings
CREATE POLICY "Allow service role all operations on customer embeddings" ON customer_embeddings
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role all operations on quote embeddings" ON quote_embeddings
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role all operations on knowledge base" ON knowledge_base
  FOR ALL TO service_role USING (true);

-- Grant permissions
GRANT SELECT ON customer_embeddings TO authenticated;
GRANT SELECT ON quote_embeddings TO authenticated;
GRANT SELECT ON knowledge_base TO authenticated;

GRANT EXECUTE ON FUNCTION search_similar_customers TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_quotes TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_base TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Vector search tables and functions created successfully!';
  RAISE NOTICE 'Remember to enable pgvector extension first with: CREATE EXTENSION IF NOT EXISTS vector;';
END $$;