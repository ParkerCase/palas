import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, analysisType = 'checklist_document' } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get file information
    const { data: fileData, error: fileError } = await supabase
      .from('checklist_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify user has access to this file
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.company_id !== fileData.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update file status to processing
    await supabase
      .from('checklist_files')
      .update({ 
        ai_analysis_status: 'processing',
        ai_analysis_updated_at: new Date().toISOString()
      })
      .eq('id', fileId)

    try {
      // Download file from storage
      const { data: fileBuffer, error: downloadError } = await supabase.storage
        .from('bidding-checklist-files')
        .download(fileData.file_path)

      if (downloadError || !fileBuffer) {
        throw new Error('Failed to download file')
      }

      // Convert file to base64 for OpenAI
      const arrayBuffer = await fileBuffer.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      // Determine file type and prepare for analysis
      let analysisPrompt = ''
      let fileType = ''

      if (fileData.file_type.includes('pdf')) {
        fileType = 'pdf'
        analysisPrompt = `Analyze this PDF document for government contracting compliance. 
        Focus on: business licenses, certifications, insurance documents, financial statements, 
        past performance records, and any compliance-related information. 
        Provide a structured analysis with key findings, compliance status, and recommendations.`
      } else if (fileData.file_type.includes('word') || fileData.file_type.includes('document')) {
        fileType = 'docx'
        analysisPrompt = `Analyze this Word document for government contracting compliance.
        Extract key information about: business capabilities, certifications, licenses,
        insurance coverage, financial information, and compliance documentation.
        Provide a structured summary with key findings and compliance assessment.`
      } else if (fileData.file_type.includes('image')) {
        fileType = 'image'
        analysisPrompt = `Analyze this image/document scan for government contracting compliance.
        Extract text and identify: certificates, licenses, insurance documents, 
        financial statements, or other compliance-related information.
        Provide a structured analysis of what you can identify in the document.`
      } else {
        fileType = 'text'
        analysisPrompt = `Analyze this text document for government contracting compliance.
        Extract key information about: business capabilities, certifications, licenses,
        insurance coverage, financial information, and compliance documentation.
        Provide a structured summary with key findings and compliance assessment.`
      }

      // Call OpenAI API for analysis
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in government contracting compliance. Analyze documents 
            to identify compliance requirements, certifications, licenses, and other relevant 
            information for government contracting opportunities. Provide structured, actionable 
            insights that help companies understand their compliance status and requirements.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: analysisPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileData.file_type};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })

      const analysisResult = completion.choices[0]?.message?.content

      if (!analysisResult) {
        throw new Error('No analysis result received')
      }

      // Parse and structure the analysis result
      const structuredAnalysis = {
        summary: analysisResult,
        extracted_info: {
          business_licenses: extractInfo(analysisResult, ['license', 'permit', 'registration']),
          certifications: extractInfo(analysisResult, ['certification', 'certificate', 'accreditation']),
          insurance: extractInfo(analysisResult, ['insurance', 'coverage', 'policy']),
          financial_info: extractInfo(analysisResult, ['financial', 'revenue', 'budget', 'cost']),
          compliance_status: extractInfo(analysisResult, ['compliant', 'compliance', 'requirement']),
          recommendations: extractInfo(analysisResult, ['recommend', 'suggest', 'should', 'need'])
        },
        confidence_score: calculateConfidence(analysisResult),
        analysis_timestamp: new Date().toISOString(),
        file_type: fileData.file_type,
        checklist_item: fileData.checklist_item_id
      }

      // Update file with analysis results
      const { error: updateError } = await supabase
        .from('checklist_files')
        .update({
          ai_analysis: structuredAnalysis,
          ai_analysis_status: 'completed',
          ai_analysis_updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      if (updateError) {
        throw new Error(`Failed to save analysis: ${updateError.message}`)
      }

      // Update AI analysis queue status
      await supabase
        .from('ai_analysis_queue')
        .update({
          status: 'completed',
          result_data: structuredAnalysis,
          processed_at: new Date().toISOString()
        })
        .eq('file_id', fileId)

      return NextResponse.json({
        success: true,
        analysis: structuredAnalysis
      })

    } catch (analysisError) {
      console.error('Analysis error:', analysisError)
      
      // Update file status to failed
      await supabase
        .from('checklist_files')
        .update({
          ai_analysis_status: 'failed',
          ai_analysis_updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      // Update queue status
      await supabase
        .from('ai_analysis_queue')
        .update({
          status: 'failed',
          error_message: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        })
        .eq('file_id', fileId)

      return NextResponse.json({
        error: 'Analysis failed',
        details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to extract specific information from analysis
function extractInfo(text: string, keywords: string[]): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const relevantSentences = sentences.filter(sentence => 
    keywords.some(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    )
  )
  return relevantSentences.map(s => s.trim()).slice(0, 5) // Limit to 5 most relevant
}

// Helper function to calculate confidence score
function calculateConfidence(text: string): number {
  const confidenceIndicators = [
    { pattern: /definitely|certainly|clearly|obviously/i, score: 0.9 },
    { pattern: /likely|probably|appears|seems/i, score: 0.7 },
    { pattern: /possibly|might|could be|unclear/i, score: 0.5 },
    { pattern: /unable to|cannot|not visible/i, score: 0.2 }
  ]

  let maxScore = 0.6 // Default confidence
  for (const indicator of confidenceIndicators) {
    if (indicator.pattern.test(text)) {
      maxScore = Math.max(maxScore, indicator.score)
    }
  }

  return Math.round(maxScore * 100) / 100
}

// GET endpoint to retrieve analysis results
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const companyId = searchParams.get('companyId')

    if (!fileId && !companyId) {
      return NextResponse.json({ error: 'File ID or Company ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('checklist_files')
      .select('*')

    if (fileId) {
      query = query.eq('id', fileId)
    } else if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: files, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({ files })

  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
