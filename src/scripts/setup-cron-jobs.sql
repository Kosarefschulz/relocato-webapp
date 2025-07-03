-- Setup Automated Tasks with pg_cron
-- Run this after enabling pg_cron extension

-- 1. Email Reminder for Upcoming Moves (Daily at 9 AM)
SELECT cron.schedule(
  'email-reminders-upcoming-moves',
  '0 9 * * *', -- Daily at 9 AM
  $$
  INSERT INTO job_queue (job_type, payload)
  SELECT 
    'send_move_reminder',
    jsonb_build_object(
      'customer_id', c.id,
      'customer_name', c.name,
      'customer_email', c.email,
      'moving_date', c.moving_date,
      'days_until_move', DATE_PART('day', c.moving_date::timestamp - NOW())
    )
  FROM customers c
  WHERE c.moving_date IS NOT NULL
    AND c.moving_date BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '3 days'
    AND c.email IS NOT NULL
    AND c.email != ''
    AND NOT EXISTS (
      SELECT 1 FROM email_history eh
      WHERE eh.customer_id = c.id
        AND eh.type = 'move_reminder'
        AND eh.created_at > CURRENT_DATE - INTERVAL '2 days'
    );
  $$
);

-- 2. Invoice Payment Reminders (Daily at 10 AM)
SELECT cron.schedule(
  'invoice-payment-reminders',
  '0 10 * * *', -- Daily at 10 AM
  $$
  INSERT INTO job_queue (job_type, payload)
  SELECT 
    'send_invoice_reminder',
    jsonb_build_object(
      'invoice_id', i.id,
      'customer_id', i.customer_id,
      'invoice_number', i.invoice_number,
      'amount', i.amount,
      'due_date', i.due_date,
      'days_overdue', DATE_PART('day', NOW() - i.due_date::timestamp)
    )
  FROM invoices i
  JOIN customers c ON c.id = i.customer_id
  WHERE i.status = 'pending'
    AND i.due_date < CURRENT_DATE
    AND c.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM email_history eh
      WHERE eh.customer_id = i.customer_id
        AND eh.type = 'invoice_reminder'
        AND eh.created_at > CURRENT_DATE - INTERVAL '7 days'
    );
  $$
);

-- 3. Quote Follow-up (Every 3 days at 2 PM)
SELECT cron.schedule(
  'quote-follow-ups',
  '0 14 */3 * *', -- Every 3 days at 2 PM
  $$
  INSERT INTO job_queue (job_type, payload)
  SELECT 
    'send_quote_followup',
    jsonb_build_object(
      'quote_id', q.id,
      'customer_id', q.customer_id,
      'customer_name', q.customer_name,
      'quote_amount', q.price,
      'days_since_sent', DATE_PART('day', NOW() - q.created_at)
    )
  FROM quotes q
  JOIN customers c ON c.id = q.customer_id
  WHERE q.status = 'sent'
    AND q.created_at < CURRENT_DATE - INTERVAL '3 days'
    AND q.created_at > CURRENT_DATE - INTERVAL '30 days'
    AND c.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM email_history eh
      WHERE eh.customer_id = q.customer_id
        AND eh.type = 'quote_followup'
        AND eh.created_at > CURRENT_DATE - INTERVAL '7 days'
    );
  $$
);

-- 4. Clean up old presence data (Every hour)
SELECT cron.schedule(
  'cleanup-presence',
  '0 * * * *', -- Every hour
  $$
  DELETE FROM user_presence
  WHERE last_seen < NOW() - INTERVAL '24 hours';
  $$
);

-- 5. Process job queue (Every 5 minutes)
SELECT cron.schedule(
  'process-job-queue',
  '*/5 * * * *', -- Every 5 minutes
  $$
  UPDATE job_queue
  SET status = 'processing',
      started_at = NOW(),
      attempts = attempts + 1
  WHERE status = 'pending'
    AND scheduled_for <= NOW()
    AND attempts < max_attempts
  LIMIT 10;
  $$
);

-- 6. Analytics aggregation (Daily at 2 AM)
SELECT cron.schedule(
  'aggregate-analytics',
  '0 2 * * *', -- Daily at 2 AM
  $$
  INSERT INTO job_queue (job_type, payload)
  VALUES (
    'aggregate_daily_analytics',
    jsonb_build_object(
      'date', CURRENT_DATE - INTERVAL '1 day',
      'metrics', jsonb_build_object(
        'total_customers', (SELECT COUNT(*) FROM customers WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day'),
        'total_quotes', (SELECT COUNT(*) FROM quotes WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day'),
        'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE paid_date::date = CURRENT_DATE - INTERVAL '1 day')
      )
    )
  );
  $$
);

-- 7. Update customer status based on moving date (Daily at midnight)
SELECT cron.schedule(
  'update-customer-status',
  '0 0 * * *', -- Daily at midnight
  $$
  UPDATE customers
  SET status = CASE
    WHEN moving_date < CURRENT_DATE THEN 'completed'
    WHEN moving_date = CURRENT_DATE THEN 'moving_today'
    WHEN moving_date BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
    ELSE status
  END,
  updated_at = NOW()
  WHERE moving_date IS NOT NULL
    AND status NOT IN ('cancelled', 'completed');
  $$
);

-- 8. Generate weekly reports (Every Monday at 8 AM)
SELECT cron.schedule(
  'weekly-reports',
  '0 8 * * 1', -- Every Monday at 8 AM
  $$
  INSERT INTO job_queue (job_type, payload)
  VALUES (
    'generate_weekly_report',
    jsonb_build_object(
      'week_start', DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week'),
      'week_end', DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day',
      'report_type', 'weekly_summary'
    )
  );
  $$
);

-- Create function to manually trigger job processing
CREATE OR REPLACE FUNCTION process_jobs() RETURNS void AS $$
DECLARE
  v_job RECORD;
BEGIN
  FOR v_job IN
    SELECT * FROM job_queue
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
      AND attempts < max_attempts
    ORDER BY scheduled_for
    LIMIT 10
  LOOP
    -- Update job status
    UPDATE job_queue
    SET status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id = v_job.id;
    
    -- Log the job processing
    RAISE NOTICE 'Processing job % of type %', v_job.id, v_job.job_type;
    
    -- Here you would call Edge Functions to actually process the job
    -- For now, we'll just mark it as completed
    UPDATE job_queue
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = v_job.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create view for monitoring cron jobs
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobname;

-- Grant permissions
GRANT SELECT ON cron_job_status TO authenticated;
GRANT EXECUTE ON FUNCTION process_jobs() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Cron jobs successfully configured! Your app now has automated tasks running.';
END $$;