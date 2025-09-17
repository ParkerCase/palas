-- Bidding Checklist File Uploads Migration
-- Add file upload functionality to bidding checklist system

-- Create bidding-checklist-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bidding-checklist-files', 
  'bidding-checklist-files', 
  false,  -- Private bucket for security
  104857600,  -- 100MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
);

-- Create storage policies for bidding checklist files
CREATE POLICY "Company members can view own checklist files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'bidding-checklist-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Company members can upload checklist files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bidding-checklist-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Company members can update own checklist files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'bidding-checklist-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Company members can delete own checklist files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'bidding-checklist-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Create checklist_files table to track uploaded files
CREATE TABLE checklist_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL, -- References the checklist item field name
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ai_analysis JSONB, -- Store AI evaluation results
  ai_analysis_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  ai_analysis_updated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- Additional file metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, checklist_item_id, file_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_files_company_id ON checklist_files(company_id);
CREATE INDEX IF NOT EXISTS idx_checklist_files_checklist_item ON checklist_files(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_files_ai_status ON checklist_files(ai_analysis_status);
CREATE INDEX IF NOT EXISTS idx_checklist_files_created_at ON checklist_files(created_at);

-- Enable Row Level Security (RLS) on checklist_files table
ALTER TABLE checklist_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_files
CREATE POLICY "Users can view own company checklist files" ON checklist_files
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert checklist files for own company" ON checklist_files
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own company checklist files" ON checklist_files
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete own company checklist files" ON checklist_files
  FOR DELETE USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_checklist_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checklist_files_updated_at
  BEFORE UPDATE ON checklist_files
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_files_updated_at();

-- Create AI analysis queue table for processing uploaded files
CREATE TABLE ai_analysis_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES checklist_files(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'checklist_document', -- Type of analysis to perform
  status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
  priority INTEGER DEFAULT 1, -- Higher numbers = higher priority
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  result_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI analysis queue
CREATE INDEX IF NOT EXISTS idx_ai_analysis_queue_status ON ai_analysis_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_queue_priority ON ai_analysis_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_queue_created_at ON ai_analysis_queue(created_at);

-- Enable RLS on AI analysis queue
ALTER TABLE ai_analysis_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI analysis queue (admin only for now)
CREATE POLICY "Admins can manage AI analysis queue" ON ai_analysis_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'company_owner')
    )
  );

-- Create trigger for AI analysis queue
CREATE TRIGGER trigger_update_ai_analysis_queue_updated_at
  BEFORE UPDATE ON ai_analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_files_updated_at();

-- Add file upload fields to company_checklist table
ALTER TABLE company_checklist ADD COLUMN IF NOT EXISTS file_uploads_enabled BOOLEAN DEFAULT true;
ALTER TABLE company_checklist ADD COLUMN IF NOT EXISTS file_upload_limits JSONB DEFAULT '{"max_files_per_item": 5, "max_file_size_mb": 100}';

-- Create function to automatically queue files for AI analysis
CREATE OR REPLACE FUNCTION queue_file_for_ai_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into AI analysis queue when a new file is uploaded
  INSERT INTO ai_analysis_queue (file_id, analysis_type, status, priority)
  VALUES (NEW.id, 'checklist_document', 'queued', 1);
  
  -- Update the file's AI analysis status
  UPDATE checklist_files 
  SET ai_analysis_status = 'pending'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically queue files for AI analysis
CREATE TRIGGER trigger_queue_file_for_ai_analysis
  AFTER INSERT ON checklist_files
  FOR EACH ROW
  EXECUTE FUNCTION queue_file_for_ai_analysis();

-- Add comments for documentation
COMMENT ON TABLE checklist_files IS 'Stores uploaded files for bidding checklist items';
COMMENT ON COLUMN checklist_files.checklist_item_id IS 'References the checklist item field name (e.g., business_license_state)';
COMMENT ON COLUMN checklist_files.ai_analysis IS 'JSON object containing AI analysis results';
COMMENT ON COLUMN checklist_files.ai_analysis_status IS 'Status of AI analysis: pending, processing, completed, failed';
COMMENT ON TABLE ai_analysis_queue IS 'Queue for processing uploaded files with AI analysis';
COMMENT ON COLUMN ai_analysis_queue.analysis_type IS 'Type of analysis to perform on the file';
COMMENT ON COLUMN ai_analysis_queue.priority IS 'Processing priority (higher numbers = higher priority)';

-- Create view for easy access to checklist files with company info
CREATE OR REPLACE VIEW checklist_files_with_company AS
SELECT 
  cf.*,
  c.name as company_name,
  c.slug as company_slug,
  p.full_name as uploaded_by_name,
  p.email as uploaded_by_email
FROM checklist_files cf
JOIN companies c ON cf.company_id = c.id
LEFT JOIN profiles p ON cf.uploaded_by = p.id;

-- Grant access to the view
GRANT SELECT ON checklist_files_with_company TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view own company checklist files with company info" ON checklist_files_with_company
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));
