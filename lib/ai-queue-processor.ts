import { createServerComponentClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function processAIQueue() {
  const supabase = await createServerComponentClient()

  try {
    // Get pending items from queue
    const { data: queueItems, error: queueError } = await supabase
      .from('ai_analysis_queue')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(5) // Process up to 5 items at a time

    if (queueError) {
      console.error('Error fetching queue items:', queueError)
      return
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No items in AI analysis queue')
      return
    }

    console.log(`Processing ${queueItems.length} items from AI analysis queue`)

    for (const item of queueItems) {
      try {
        // Update status to processing
        await supabase
          .from('ai_analysis_queue')
          .update({ 
            status: 'processing',
            attempts: item.attempts + 1
          })
          .eq('id', item.id)

        // Get file information
        const { data: fileData, error: fileError } = await supabase
          .from('checklist_files')
          .select('*')
          .eq('id', item.file_id)
          .single()

        if (fileError || !fileData) {
          throw new Error('File not found')
        }

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

        // Determine analysis type and prepare prompt
        let analysisPrompt = ''
        const fileType = ''

        switch (item.analysis_type) {
          case 'checklist_document':
            analysisPrompt = `Analyze this document for government contracting compliance. 
            Focus on: business licenses, certifications, insurance documents, financial statements, 
            past performance records, and any compliance-related information. 
            Provide a structured analysis with key findings, compliance status, and recommendations.
            
            Checklist Item: ${fileData.checklist_item_id}
            File Type: ${fileData.file_type}
            
            Please provide:
            1. Document summary
            2. Key compliance information found
            3. Missing requirements (if any)
            4. Recommendations for improvement
            5. Confidence level in the analysis`
            break
          
          case 'financial_document':
            analysisPrompt = `Analyze this financial document for government contracting purposes.
            Focus on: revenue, financial stability, bonding capacity, insurance coverage,
            and financial compliance requirements.
            
            Provide:
            1. Financial summary
            2. Bonding capacity assessment
            3. Insurance adequacy
            4. Financial stability indicators
            5. Compliance recommendations`
            break
          
          case 'certification_document':
            analysisPrompt = `Analyze this certification or license document.
            Focus on: certification type, validity period, issuing authority,
            scope of work, and compliance requirements.
            
            Provide:
            1. Certification details
            2. Validity status
            3. Scope and limitations
            4. Renewal requirements
            5. Compliance assessment`
            break
          
          default:
            analysisPrompt = `Analyze this document for government contracting compliance.
            Extract key information and provide structured analysis.`
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
              insights that help companies understand their compliance status and requirements.
              
              Always respond in JSON format with the following structure:
              {
                "summary": "Brief overview of the document",
                "key_findings": ["finding1", "finding2", "finding3"],
                "compliance_status": "compliant|partially_compliant|non_compliant",
                "missing_requirements": ["requirement1", "requirement2"],
                "recommendations": ["recommendation1", "recommendation2"],
                "confidence_score": 0.85,
                "extracted_data": {
                  "licenses": ["license1", "license2"],
                  "certifications": ["cert1", "cert2"],
                  "insurance": ["insurance1"],
                  "financial_info": ["info1", "info2"]
                }
              }`
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

        // Parse JSON response
        let structuredAnalysis
        try {
          structuredAnalysis = JSON.parse(analysisResult)
        } catch {
          // If JSON parsing fails, create structured response from text
          structuredAnalysis = {
            summary: analysisResult,
            key_findings: extractKeyFindings(analysisResult),
            compliance_status: 'unknown',
            missing_requirements: [],
            recommendations: [],
            confidence_score: 0.7,
            extracted_data: {
              licenses: [],
              certifications: [],
              insurance: [],
              financial_info: []
            },
            raw_analysis: analysisResult
          }
        }

        // Add metadata
        structuredAnalysis.analysis_timestamp = new Date().toISOString()
        structuredAnalysis.file_type = fileData.file_type
        structuredAnalysis.checklist_item = fileData.checklist_item_id
        structuredAnalysis.analysis_type = item.analysis_type

        // Update file with analysis results
        const { error: updateError } = await supabase
          .from('checklist_files')
          .update({
            ai_analysis: structuredAnalysis,
            ai_analysis_status: 'completed',
            ai_analysis_updated_at: new Date().toISOString()
          })
          .eq('id', item.file_id)

        if (updateError) {
          throw new Error(`Failed to save analysis: ${updateError.message}`)
        }

        // Update queue status to completed
        await supabase
          .from('ai_analysis_queue')
          .update({
            status: 'completed',
            result_data: structuredAnalysis,
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id)

        console.log(`✅ Successfully analyzed file: ${fileData.file_name}`)

      } catch (itemError) {
        console.error(`❌ Error processing queue item ${item.id}:`, itemError)
        
        // Update queue status based on attempts
        const newAttempts = item.attempts + 1
        const shouldRetry = newAttempts < item.max_attempts

        await supabase
          .from('ai_analysis_queue')
          .update({
            status: shouldRetry ? 'queued' : 'failed',
            attempts: newAttempts,
            error_message: itemError instanceof Error ? itemError.message : 'Unknown error'
          })
          .eq('id', item.id)

        // Update file status if max attempts reached
        if (!shouldRetry) {
          await supabase
            .from('checklist_files')
            .update({
              ai_analysis_status: 'failed',
              ai_analysis_updated_at: new Date().toISOString()
            })
            .eq('id', item.file_id)
        }
      }
    }

  } catch (error) {
    console.error('Error processing AI queue:', error)
  }
}

// Helper function to extract key findings from text
function extractKeyFindings(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  return sentences.slice(0, 5).map(s => s.trim())
}

// Export for use in cron jobs or manual triggers
