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
