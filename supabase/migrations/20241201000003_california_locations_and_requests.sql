-- California Location Fields for Companies Table
-- Add California-specific location fields to existing companies table

ALTER TABLE companies ADD COLUMN IF NOT EXISTS california_county TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS california_cities TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS operating_regions TEXT[] DEFAULT '{}';

-- Create opportunity requests table
DROP TABLE IF EXISTS opportunity_requests CASCADE;
CREATE TABLE opportunity_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  target_counties TEXT[],
  target_cities TEXT[],
  industry_codes TEXT[],
  budget_min INTEGER,
  budget_max INTEGER,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opportunity_requests_company_id ON opportunity_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_requests_status ON opportunity_requests(status);
CREATE INDEX IF NOT EXISTS idx_opportunity_requests_created_at ON opportunity_requests(created_at);

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE opportunity_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own company requests" ON opportunity_requests;
DROP POLICY IF EXISTS "Users can insert requests for own company" ON opportunity_requests;
DROP POLICY IF EXISTS "Users can update own company requests" ON opportunity_requests;
DROP POLICY IF EXISTS "Users can delete own company requests" ON opportunity_requests;

-- RLS Policies for opportunity_requests
CREATE POLICY "Users can view own company requests" ON opportunity_requests
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert requests for own company" ON opportunity_requests
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own company requests" ON opportunity_requests
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete own company requests" ON opportunity_requests
  FOR DELETE USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opportunity_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opportunity_requests_updated_at
  BEFORE UPDATE ON opportunity_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_requests_updated_at();

-- Add comments for documentation
COMMENT ON TABLE opportunity_requests IS 'Stores opportunity requests from companies';
COMMENT ON COLUMN opportunity_requests.company_id IS 'Reference to the company making the request';
COMMENT ON COLUMN opportunity_requests.request_type IS 'Type of opportunity request (e.g., construction, services, etc.)';
COMMENT ON COLUMN opportunity_requests.target_counties IS 'Array of California county IDs';
COMMENT ON COLUMN opportunity_requests.target_cities IS 'Array of California city IDs';
COMMENT ON COLUMN opportunity_requests.industry_codes IS 'Array of NAICS or UNSPSC codes';
COMMENT ON COLUMN opportunity_requests.budget_min IS 'Minimum budget range in dollars';
COMMENT ON COLUMN opportunity_requests.budget_max IS 'Maximum budget range in dollars';
COMMENT ON COLUMN opportunity_requests.status IS 'Request status (pending, processing, completed, cancelled)';
