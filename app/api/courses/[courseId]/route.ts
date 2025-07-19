import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ courseId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Mock Supabase client for testing
    const supabase = null
    const { courseId } = await context.params
    
    // Mock course modules for testing
    const modules = [
      {
        id: 'module-1',
        course_id: courseId,
        title: 'Introduction to Grant Writing',
        description: 'Learn the fundamentals of grant writing',
        order_index: 1,
        file_path: null
      },
      {
        id: 'module-2', 
        course_id: courseId,
        title: 'Finding Grant Opportunities',
        description: 'How to identify and research grant opportunities',
        order_index: 2,
        file_path: null
      }
    ]
    
    /*
    // Get course modules
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index')
    
    if (modulesError) throw modulesError
    */
    
    // Mock course resources for testing
    const resources = [
      {
        id: 'resource-1',
        course_id: courseId,
        title: 'Grant Writing Template',
        description: 'A comprehensive template for grant proposals',
        file_path: 'templates/grant-template.pdf'
      }
    ]
    
    /*
    // Get course resources
    const { data: resources, error: resourcesError } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at')
    
    if (resourcesError) throw resourcesError
    */
    
    // Mock signed URLs for testing
    const modulesWithUrls = modules.map(module => ({
      ...module,
      file_url: module.file_path ? `https://example.com/files/${module.file_path}` : null
    }))
    
    const resourcesWithUrls = resources.map(resource => ({
      ...resource,
      file_url: `https://example.com/files/${resource.file_path}`
    }))
    
    /*
    // Generate signed URLs for files
    const modulesWithUrls = await Promise.all(
      (modules || []).map(async (module) => {
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
      (resources || []).map(async (resource) => {
        const { data: urlData } = await supabase.storage
          .from('course-materials')
          .createSignedUrl(resource.file_path, 3600)
        
        return {
          ...resource,
          file_url: urlData?.signedUrl
        }
      })
    )
    */
    
    return NextResponse.json({
      course_id: courseId,
      modules: modulesWithUrls,
      resources: resourcesWithUrls,
      total_modules: modules?.length || 0,
      total_resources: resources?.length || 0
    })
    
  } catch (error) {
    console.error('Course API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course data' },
      { status: 500 }
    )
  }
}
