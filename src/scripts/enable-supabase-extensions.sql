-- Enable Supabase Extensions for MEGA Performance
-- Run this in Supabase SQL Editor to activate all power features

-- 1. Enable pgvector for AI-powered features
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Enable pg_cron for automated tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Enable PostGIS for advanced geo features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 4. Enable pg_stat_statements for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 5. Enable pgcrypto for enhanced security
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 6. Enable uuid-ossp (already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 7. Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 8. Enable unaccent for better text search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 9. Enable plv8 for JavaScript in database (if available)
-- CREATE EXTENSION IF NOT EXISTS plv8;

-- Grant permissions for cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create vector embeddings column for customers (for AI features)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create location columns for PostGIS
ALTER TABLE customers ADD COLUMN IF NOT EXISTS from_location geometry(Point, 4326);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS to_location geometry(Point, 4326);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_embedding ON customers USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_customers_from_location ON customers USING GIST (from_location);
CREATE INDEX IF NOT EXISTS idx_customers_to_location ON customers USING GIST (to_location);

-- Create GIN indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_customers_name_gin ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_address_gin ON customers USING gin (from_address gin_trgm_ops, to_address gin_trgm_ops);

-- Create automated tasks table
CREATE TABLE IF NOT EXISTS automated_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name VARCHAR(255) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  schedule VARCHAR(100),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create queue table for background jobs
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for job queue
CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled ON job_queue(status, scheduled_for);

-- Create real-time presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'online',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_page VARCHAR(255),
  device_info JSONB,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for presence
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  properties JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Enable Row Level Security on new tables
ALTER TABLE automated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow authenticated users to manage tasks" ON automated_tasks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage jobs" ON job_queue
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage presence" ON user_presence
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to write analytics" ON analytics_events
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id VARCHAR,
  p_user_name VARCHAR,
  p_status VARCHAR DEFAULT 'online',
  p_current_page VARCHAR DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_location JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, user_name, status, current_page, device_info, location, last_seen)
  VALUES (p_user_id, p_user_name, p_status, p_current_page, p_device_info, p_location, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    user_name = EXCLUDED.user_name,
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    device_info = EXCLUDED.device_info,
    location = EXCLUDED.location,
    last_seen = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to enqueue job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type VARCHAR,
  p_payload JSONB,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO job_queue (job_type, payload, scheduled_for)
  VALUES (p_job_type, p_payload, p_scheduled_for)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'All extensions enabled successfully! Your database is now SUPERCHARGED!';
END $$;