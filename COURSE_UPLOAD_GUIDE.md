# Course Upload Guide for GovContractAI

## Overview

This guide explains how to upload and manage courses on the GovContractAI platform. The platform supports various course formats including PowerPoint presentations, videos, documents, and interactive content.

## Prerequisites

- Admin access to the GovContractAI platform
- Course materials ready in supported formats
- Supabase storage bucket configured for course materials

## Supported File Formats

### Primary Formats

- **PowerPoint**: `.pptx`, `.ppt` (recommended for modules)
- **Images**: `.png`, `.jpg`, `.jpeg` (for thumbnails and diagrams)
- **Documents**: `.pdf`, `.docx`, `.txt`
- **Videos**: `.mp4`, `.webm`, `.mov`
- **HTML**: `.html` (for interactive content)

### File Size Limits

- Individual files: Up to 50MB
- Total course size: Up to 500MB
- Recommended module size: 5-20MB

## Course Structure

### Standard Course Layout

```
course-materials/
├── {course-id}/
│   ├── modules/
│   │   ├── module-1-introduction.pptx
│   │   ├── module-2-process.pptx
│   │   └── module-3-legal.pptx
│   ├── resources/
│   │   ├── additional-resources.pptx
│   │   └── reference-materials.pdf
│   ├── images/
│   │   ├── course-overview.png
│   │   └── course-diagram.png
│   └── content/
│       ├── lecture-module-1.html
│       └── workbook-assignment.html
```

## Upload Methods

### Method 1: Automated Script (Recommended)

#### Step 1: Prepare Your Course Files

Organize your course materials in a local folder with the following structure:

```
my-course/
├── MODULE 1.pptx
├── MODULE 2.pptx
├── MODULE 3.pptx
├── course-overview.png
└── additional-resources.pdf
```

#### Step 2: Run the Upload Script

```bash
# Navigate to your project directory
cd /path/to/govcontract-ai

# Run the upload script
node upload-course-materials.js ./my-course
```

#### Step 3: Verify Upload

Check the console output for upload status and any errors.

### Method 2: Manual Upload via Supabase Dashboard

#### Step 1: Access Supabase Storage

1. Go to your Supabase project dashboard
2. Navigate to Storage → course-materials bucket
3. Create the course folder structure

#### Step 2: Upload Files

1. Navigate to your course folder
2. Click "Upload file" and select your course materials
3. Ensure proper file naming and organization

#### Step 3: Update Database

Manually update the `course_modules` and `course_resources` tables with file information.

## Database Schema

### Course Modules Table

```sql
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Course Resources Table

```sql
CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  resource_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Course Configuration

### Module Metadata

Each module should include:

- **Title**: Clear, descriptive name
- **Description**: Brief overview of content
- **Order**: Sequential numbering for proper flow
- **File Path**: Storage location reference

### Example Module Entry

```sql
INSERT INTO course_modules (
  course_id,
  module_number,
  title,
  description,
  file_path,
  order_index
) VALUES (
  'government-procurement-101',
  1,
  'Introduction to Government Contracting',
  'Overview of federal procurement processes and key concepts',
  'government-procurement-101/modules/module-1-introduction.pptx',
  1
);
```

## Best Practices

### File Organization

1. **Consistent Naming**: Use clear, descriptive filenames
2. **Logical Structure**: Organize by content type and module
3. **Version Control**: Include version numbers in filenames if needed

### Content Quality

1. **File Optimization**: Compress large files without losing quality
2. **Format Consistency**: Use consistent formats across modules
3. **Accessibility**: Ensure content is accessible to all users

### Metadata Management

1. **Complete Information**: Fill in all required database fields
2. **Regular Updates**: Keep course information current
3. **SEO Optimization**: Use descriptive titles and descriptions

## Troubleshooting

### Common Issues

#### Upload Failures

- **File Size**: Check if file exceeds size limits
- **Format**: Ensure file format is supported
- **Permissions**: Verify storage bucket permissions

#### Database Errors

- **Missing Fields**: Ensure all required fields are populated
- **Foreign Keys**: Check course_id references
- **Data Types**: Verify data type compatibility

#### Access Issues

- **Row Level Security**: Check RLS policies
- **User Permissions**: Verify user role and access
- **Bucket Policies**: Ensure storage bucket is accessible

### Error Messages

- `File too large`: Reduce file size or split into smaller parts
- `Invalid file type`: Convert to supported format
- `Permission denied`: Check user role and bucket policies
- `Database constraint`: Verify data integrity and relationships

## Monitoring and Maintenance

### Upload Verification

1. Check file storage in Supabase dashboard
2. Verify database entries are correct
3. Test course access in the application

### Regular Maintenance

1. **File Cleanup**: Remove unused or outdated files
2. **Database Optimization**: Clean up orphaned records
3. **Storage Monitoring**: Track storage usage and costs

### Performance Optimization

1. **CDN Integration**: Use CDN for faster file delivery
2. **File Compression**: Optimize file sizes for faster loading
3. **Caching**: Implement appropriate caching strategies

## Support and Resources

### Documentation

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Platform API Reference](https://docs.govcontractai.com/api)
- [Course Management Guide](https://docs.govcontractai.com/courses)

### Contact Information

- **Technical Support**: support@govcontractai.com
- **Platform Issues**: platform@govcontractai.com
- **Course Content**: content@govcontractai.com

### Community Resources

- **Developer Forum**: forum.govcontractai.com
- **GitHub Repository**: github.com/govcontractai/platform
- **Discord Community**: discord.gg/govcontractai

## Example Course Upload

### Sample Course: "Government Procurement 101"

#### File Structure

```
government-procurement-101/
├── modules/
│   ├── module-1-introduction.pptx
│   ├── module-2-process.pptx
│   ├── module-3-legal.pptx
│   ├── module-4-proposals.pptx
│   ├── module-5-management.pptx
│   └── module-6-strategies.pptx
├── resources/
│   ├── additional-resources.pptx
│   └── reference-materials.pdf
├── images/
│   ├── course-overview.png
│   └── course-diagram.png
└── content/
    ├── lecture-module-1.html
    └── workbook-assignment.html
```

#### Upload Command

```bash
node upload-course-materials.js ./government-procurement-101
```

#### Expected Output

```
📁 Starting course materials upload...
📤 Uploading MODULE 1.pptx -> government-procurement-101/modules/module-1-introduction.pptx
✅ Uploaded MODULE 1.pptx
📤 Uploading MODULE 2.pptx -> government-procurement-101/modules/module-2-process.pptx
✅ Uploaded MODULE 2.pptx
...
🎉 Course upload completed!
📚 Access your course at: https://your-project.supabase.co/storage/v1/object/public/course-materials/government-procurement-101/
```

## Conclusion

This guide provides comprehensive information for uploading and managing courses on the GovContractAI platform. Follow the best practices outlined here to ensure successful course deployment and optimal user experience.

For additional support or questions, please refer to the contact information above or consult the platform documentation.
