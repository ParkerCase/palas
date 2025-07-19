-- Create course materials bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials', 
  'course-materials', 
  true, 
  52428800,  -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/xml', 'text/html', 'text/plain']
);

-- Create storage policies for course materials
CREATE POLICY "Public access for course materials" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users can upload course materials" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users can update course materials" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'course-materials');

-- Create course_modules table to track course structure
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(course_id, module_number)
);

-- Create course_resources table for additional files
CREATE TABLE IF NOT EXISTS course_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'image', 'document', 'media', 'xml_config'
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Government Procurement 101 course structure
INSERT INTO course_modules (course_id, module_number, title, description, file_path, order_index) VALUES
('government-procurement-101', 1, 'Introduction to Government Procurement', 'Foundation concepts and overview', 'government-procurement-101/modules/MODULE 1.pptx', 1),
('government-procurement-101', 2, 'Understanding the Procurement Process', 'Step-by-step procurement workflow', 'government-procurement-101/modules/MODULE 2.pptx', 2),
('government-procurement-101', 3, 'Legal Framework and Regulations', 'FAR, DFARS, and compliance requirements', 'government-procurement-101/modules/MODULE 3.pptx', 3),
('government-procurement-101', 4, 'Proposal Writing and Submission', 'Crafting winning proposals', 'government-procurement-101/modules/MODULE 4.pptx', 4),
('government-procurement-101', 5, 'Contract Management', 'Managing awarded contracts effectively', 'government-procurement-101/modules/MODULE 5.pptx', 5),
('government-procurement-101', 6, 'Advanced Strategies', 'Advanced procurement strategies', 'government-procurement-101/modules/MODULE 6.pptx', 6);

-- Enable RLS
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view published course modules" ON course_modules
FOR SELECT TO public
USING (is_published = true);

CREATE POLICY "Anyone can view course resources" ON course_resources
FOR SELECT TO public
USING (true);

CREATE POLICY "Authenticated users can manage course modules" ON course_modules
FOR ALL TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage course resources" ON course_resources
FOR ALL TO authenticated
USING (true);
