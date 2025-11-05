-- Opportunity Discovery Workflow Migration
-- Adds necessary fields and tables for the dynamic opportunity discovery system

-- Ensure opportunities table has all necessary columns
DO $$ 
BEGIN
  -- Add recommended_by column if it doesn't exist (tracks admin who recommended)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunities' AND column_name = 'recommended_by') THEN
    ALTER TABLE opportunities ADD COLUMN recommended_by UUID REFERENCES auth.users(id);
  END IF;

  -- Add company_id column if it doesn't exist (for recommended opportunities)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunities' AND column_name = 'company_id') THEN
    ALTER TABLE opportunities ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- Add source_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunities' AND column_name = 'source_type') THEN
    ALTER TABLE opportunities ADD COLUMN source_type TEXT DEFAULT 'sam_gov';
  END IF;

  -- Add search_result_data column if it doesn't exist (stores Brave Search result)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunities' AND column_name = 'search_result_data') THEN
    ALTER TABLE opportunities ADD COLUMN search_result_data JSONB;
  END IF;

  -- Add match_score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunities' AND column_name = 'match_score') THEN
    ALTER TABLE opportunities ADD COLUMN match_score INTEGER;
  END IF;

  -- Add admin_notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunities' AND column_name = 'admin_notes') THEN
    ALTER TABLE opportunities ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Update applications table to support recommended opportunities
DO $$ 
BEGIN
  -- Ensure status column has 'recommended' as a valid option
  -- First, check if the status column uses a CHECK constraint or ENUM
  -- For now, we'll assume it's TEXT and update it if needed
  
  -- Add source column if it doesn't exist (tracks how application was created)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'source') THEN
    ALTER TABLE applications ADD COLUMN source TEXT DEFAULT 'user_created';
    COMMENT ON COLUMN applications.source IS 'Source of application: user_created, admin_recommended, ai_generated';
  END IF;

  -- Add recommended_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'recommended_at') THEN
    ALTER TABLE applications ADD COLUMN recommended_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add acceptance_status column for company acceptance/rejection
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'acceptance_status') THEN
    ALTER TABLE applications ADD COLUMN acceptance_status TEXT DEFAULT 'pending';
    COMMENT ON COLUMN applications.acceptance_status IS 'Company acceptance: pending, accepted, rejected';
  END IF;

  -- Add accepted_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'accepted_at') THEN
    ALTER TABLE applications ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update opportunity_requests table to support the new workflow
DO $$ 
BEGIN
  -- Ensure user_id column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'user_id') THEN
    ALTER TABLE opportunity_requests ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add email_sent column to track notification status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'email_sent') THEN
    ALTER TABLE opportunity_requests ADD COLUMN email_sent BOOLEAN DEFAULT false;
  END IF;

  -- Add email_sent_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'email_sent_at') THEN
    ALTER TABLE opportunity_requests ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add processed_by column (admin who processed the request)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'processed_by') THEN
    ALTER TABLE opportunity_requests ADD COLUMN processed_by UUID REFERENCES auth.users(id);
  END IF;

  -- Add processed_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'processed_at') THEN
    ALTER TABLE opportunity_requests ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add search_query_used column (stores the actual search query used)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'search_query_used') THEN
    ALTER TABLE opportunity_requests ADD COLUMN search_query_used TEXT;
  END IF;

  -- Add search_results column (stores raw Brave Search results)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'opportunity_requests' AND column_name = 'search_results') THEN
    ALTER TABLE opportunity_requests ADD COLUMN search_results JSONB;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_recommended_by ON opportunities(recommended_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_match_score ON opportunities(match_score);
CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);
CREATE INDEX IF NOT EXISTS idx_opportunity_requests_processed_by ON opportunity_requests(processed_by);
CREATE INDEX IF NOT EXISTS idx_opportunity_requests_email_sent ON opportunity_requests(email_sent);

-- Create a view for admin to see opportunity requests with company details
CREATE OR REPLACE VIEW admin_opportunity_requests_view AS
SELECT 
  opr.*,
  c.name AS company_name,
  c.industry AS company_industry,
  c.business_type AS company_business_type,
  c.headquarters_address AS company_location,
  p.email AS user_email,
  p.full_name AS user_name,
  admin_p.email AS processed_by_email
FROM opportunity_requests opr
LEFT JOIN companies c ON opr.company_id = c.id
LEFT JOIN profiles p ON opr.user_id = p.id
LEFT JOIN profiles admin_p ON opr.processed_by = admin_p.id;

-- Grant access to the view (adjust based on your RLS policies)
GRANT SELECT ON admin_opportunity_requests_view TO authenticated;

-- Update RLS policies for opportunities to allow company-specific access
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view recommended opportunities" ON opportunities;
  DROP POLICY IF EXISTS "Companies can view their recommended opportunities" ON opportunities;
  
  -- Create policy for companies to view their recommended opportunities
  CREATE POLICY "Companies can view their recommended opportunities" ON opportunities
    FOR SELECT USING (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      ) OR company_id IS NULL
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comments for documentation
COMMENT ON COLUMN opportunities.company_id IS 'Company this opportunity was recommended for (NULL for public opportunities)';
COMMENT ON COLUMN opportunities.recommended_by IS 'Admin user who recommended this opportunity';
COMMENT ON COLUMN opportunities.source_type IS 'Source of opportunity: sam_gov, grants_gov, brave_search, manual, etc.';
COMMENT ON COLUMN opportunities.search_result_data IS 'Raw search result data from Brave Search';
COMMENT ON COLUMN opportunities.match_score IS 'Algorithmic match score (0-100) for recommended opportunities';
COMMENT ON COLUMN applications.source IS 'How application was created: user_created, admin_recommended, ai_generated';

