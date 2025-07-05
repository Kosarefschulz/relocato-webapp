-- Create health_checks table for storing system health history
CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  overall_status VARCHAR(20) NOT NULL,
  services JSONB NOT NULL,
  uptime_minutes INTEGER NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at DESC);

-- Keep only last 30 days of health checks
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM health_checks 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-health-checks', '0 2 * * *', 'SELECT cleanup_old_health_checks();');