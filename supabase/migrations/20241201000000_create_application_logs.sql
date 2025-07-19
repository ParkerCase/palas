-- Create application_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  category TEXT NOT NULL CHECK (category IN ('API_CALL', 'DATA_SOURCE', 'MOCK_DATA', 'OPENAI_USAGE', 'SUPABASE', 'AUTH', 'PAYMENT', 'GENERAL')),
  component TEXT NOT NULL,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  request_id TEXT,
  data_source TEXT CHECK (data_source IN ('REAL', 'MOCK', 'CACHE', 'UNKNOWN')),
  api_provider TEXT,
  response_time INTEGER,
  error TEXT,
  stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_category ON application_logs(category);
CREATE INDEX IF NOT EXISTS idx_application_logs_component ON application_logs(component);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_data_source ON application_logs(data_source);
CREATE INDEX IF NOT EXISTS idx_application_logs_api_provider ON application_logs(api_provider);

-- Create a function to clean old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM application_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean old logs (if using pg_cron extension)
-- SELECT cron.schedule('clean-old-logs', '0 2 * * *', 'SELECT clean_old_logs();');

-- Enable RLS
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for log access
CREATE POLICY "Users can view their own logs" ON application_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all logs" ON application_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous inserts for logging (needed for server-side logging)
CREATE POLICY "Allow anonymous log inserts" ON application_logs
  FOR INSERT WITH CHECK (true); 