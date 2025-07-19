#!/bin/bash

echo "📁 SETTING UP SUPABASE STORAGE FOR COURSE MATERIALS"
echo "=================================================="

# Create the Supabase storage bucket SQL
cat > course-storage-setup.sql << 'EOF'
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
EOF

echo "✅ Created Supabase storage setup SQL"

# Create upload script for course materials
cat > upload-course-materials.js << 'EOF'
/**
 * Course Materials Upload Script
 * Uploads your Government Procurement 101 course to Supabase storage
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadCourseFiles(localCoursePath) {
  console.log('📁 Starting course materials upload...')
  
  const courseId = 'government-procurement-101'
  const fileMapping = {
    // PowerPoint modules
    'MODULE 1.pptx': `${courseId}/modules/module-1-introduction.pptx`,
    'MODULE 2.pptx': `${courseId}/modules/module-2-process.pptx`,
    'MODULE 3.pptx': `${courseId}/modules/module-3-legal.pptx`,
    'MODULE 4.pptx': `${courseId}/modules/module-4-proposals.pptx`,
    'MODULE 5.pptx': `${courseId}/modules/module-5-management.pptx`,
    'MODULE 5-1.pptx': `${courseId}/modules/module-5-1-advanced.pptx`,
    'MODULE 6.pptx': `${courseId}/modules/module-6-strategies.pptx`,
    'RESOURCES.pptx': `${courseId}/resources/additional-resources.pptx`,
    
    // Images
    'Screenshot 2023-11-29 at 6.44.39 PM.png': `${courseId}/images/course-overview.png`,
    'Screenshot 2023-11-04 at 2.33.50 AM.png': `${courseId}/images/uploaded-media-1.png`,
    'Screenshot 2023-11-29 at 7.10.19 PM.png': `${courseId}/images/uploaded-media-2.png`,
    'image.png': `${courseId}/images/course-diagram.png`,
    
    // Configuration files
    'assignment_groups.xml': `${courseId}/config/assignment-groups.xml`,
    'canvas_export.txt': `${courseId}/config/canvas-export.txt`,
    'context.xml': `${courseId}/config/context.xml`,
    'course_settings.xml': `${courseId}/config/course-settings.xml`,
    'files_meta.xml': `${courseId}/config/files-meta.xml`,
    'module_meta.xml': `${courseId}/config/module-meta.xml`,
    'imsmanifest.xml': `${courseId}/config/imsmanifest.xml`,
    
    // HTML content
    'lecture-module-1.html': `${courseId}/content/lecture-module-1.html`,
    'workbook-assignment.html': `${courseId}/content/workbook-assignment.html`
  }
  
  try {
    for (const [filename, uploadPath] of Object.entries(fileMapping)) {
      const filePath = findFile(localCoursePath, filename)
      if (filePath && fs.existsSync(filePath)) {
        console.log(`📤 Uploading ${filename} -> ${uploadPath}`)
        
        const fileBuffer = fs.readFileSync(filePath)
        const { data, error } = await supabase.storage
          .from('course-materials')
          .upload(uploadPath, fileBuffer, {
            contentType: getMimeType(filename),
            upsert: true
          })
        
        if (error) {
          console.error(`❌ Failed to upload ${filename}:`, error.message)
        } else {
          console.log(`✅ Uploaded ${filename}`)
          
          // Update database record
          await updateCourseDatabase(courseId, filename, uploadPath, fileBuffer.length)
        }
      } else {
        console.warn(`⚠️  File not found: ${filename}`)
      }
    }
    
    console.log('🎉 Course upload completed!')
    console.log(`📚 Access your course at: ${supabaseUrl}/storage/v1/object/public/course-materials/${courseId}/`)
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
  }
}

function findFile(basePath, filename) {
  // Recursively search for file in directory tree
  function searchDir(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        const found = searchDir(fullPath)
        if (found) return found
      } else if (file === filename) {
        return fullPath
      }
    }
    return null
  }
  return searchDir(basePath)
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes = {
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.xml': 'text/xml',
    '.html': 'text/html',
    '.txt': 'text/plain'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

async function updateCourseDatabase(courseId, filename, uploadPath, fileSize) {
  try {
    if (filename.includes('MODULE') && filename.endsWith('.pptx')) {
      const moduleNumber = parseInt(filename.match(/MODULE (\d+)/)?.[1] || '0')
      if (moduleNumber > 0) {
        await supabase
          .from('course_modules')
          .update({
            file_path: uploadPath,
            file_size: fileSize,
            file_type: 'powerpoint',
            is_published: true,
            updated_at: new Date().toISOString()
          })
          .eq('course_id', courseId)
          .eq('module_number', moduleNumber)
      }
    }
    
    // Add to resources table
    await supabase
      .from('course_resources')
      .upsert({
        course_id: courseId,
        name: filename,
        file_path: uploadPath,
        file_size: fileSize,
        mime_type: getMimeType(filename),
        resource_type: getResourceType(filename),
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Database update error:', error.message)
  }
}

function getResourceType(filename) {
  if (filename.endsWith('.pptx') || filename.endsWith('.ppt')) return 'presentation'
  if (filename.endsWith('.png') || filename.endsWith('.jpg')) return 'image'
  if (filename.endsWith('.xml')) return 'xml_config'
  if (filename.endsWith('.html')) return 'content'
  return 'document'
}

// Usage
if (require.main === module) {
  const coursePath = process.argv[2]
  if (!coursePath) {
    console.log('Usage: node upload-course-materials.js <path-to-course-folder>')
    console.log('Example: node upload-course-materials.js ./web_resources')
    process.exit(1)
  }
  
  uploadCourseFiles(coursePath)
}

module.exports = { uploadCourseFiles }
EOF

echo "✅ Created course upload script"

# Create course access API
cat > app/api/courses/[courseId]/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createRouteHandlerClient()
    const { courseId } = params
    
    // Get course modules
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index')
    
    if (modulesError) throw modulesError
    
    // Get course resources
    const { data: resources, error: resourcesError } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at')
    
    if (resourcesError) throw resourcesError
    
    // Generate signed URLs for files
    const modulesWithUrls = await Promise.all(
      modules.map(async (module) => {
        if (module.file_path) {
          const { data: urlData } = await supabase.storage
            .from('course-materials')
            .createSignedUrl(module.file_path, 3600) // 1 hour expiry
          
          return {
            ...module,
            file_url: urlData?.signedUrl
          }
        }
        return module
      })
    )
    
    const resourcesWithUrls = await Promise.all(
      resources.map(async (resource) => {
        const { data: urlData } = await supabase.storage
          .from('course-materials')
          .createSignedUrl(resource.file_path, 3600)
        
        return {
          ...resource,
          file_url: urlData?.signedUrl
        }
      })
    )
    
    return NextResponse.json({
      course_id: courseId,
      modules: modulesWithUrls,
      resources: resourcesWithUrls,
      total_modules: modules.length,
      total_resources: resources.length
    })
    
  } catch (error) {
    console.error('Course API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course data' },
      { status: 500 }
    )
  }
}
EOF

echo "✅ Created course API endpoint"

echo ""
echo "📋 COURSE MATERIALS SETUP INSTRUCTIONS"
echo "======================================"
echo ""
echo "1. Set up Supabase storage:"
echo "   - Go to your Supabase dashboard"
echo "   - Navigate to SQL Editor"
echo "   - Run the SQL in: course-storage-setup.sql"
echo ""
echo "2. Upload your course files:"
echo "   - Place your web_resources folder in this directory"
echo "   - Run: node upload-course-materials.js ./web_resources"
echo ""
echo "3. Access your course:"
echo "   - API: /api/courses/government-procurement-101"
echo "   - Files: https://your-project.supabase.co/storage/v1/object/public/course-materials/"
echo ""
echo "✅ Course materials system is ready!"
