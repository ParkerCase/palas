import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { openaiService } from '@/lib/ai/openai'

interface ApplicationData {
  proposalText: string
  teamMembers: string
  timeline: string
  budget: string
  relevantExperience: string
  technicalApproach: string
  files: File[]
}

interface AIAnalysis {
  qualityScore: number
  strengths: string[]
  improvements: string[]
  winProbability: number
  recommendations: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opportunityId, applicationData } = body as {
      opportunityId: string
      applicationData: ApplicationData
    }

    console.log('Analyzing application with OpenAI...')

    // Get opportunity details for context
    const opportunityResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/opportunities/${opportunityId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    let opportunity = null
    if (opportunityResponse.ok) {
      const oppData = await opportunityResponse.json()
      opportunity = oppData.opportunity
    }

    // Prepare the analysis prompt
    const analysisPrompt = `
You are an expert government contracting consultant analyzing a proposal application. Please analyze the following application and provide a comprehensive assessment.

OPPORTUNITY CONTEXT:
${opportunity ? `
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Description: ${opportunity.description}
Award Amount: ${opportunity.awardAmount || 'Not specified'}
Set-Aside: ${opportunity.setAside || 'None'}
NAICS Codes: ${opportunity.naicsCodes?.join(', ') || 'Not specified'}
` : 'Opportunity details not available'}

APPLICATION CONTENT:
Proposal Overview: ${applicationData.proposalText}
Technical Approach: ${applicationData.technicalApproach}
Team Members: ${applicationData.teamMembers}
Timeline: ${applicationData.timeline}
Budget: ${applicationData.budget}
Relevant Experience: ${applicationData.relevantExperience}

Please provide a detailed analysis including:
1. Overall quality score (0-100)
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Win probability estimate (0.0-1.0)
5. Specific recommendations for enhancement

Format your response as JSON with the following structure:
{
  "qualityScore": number,
  "strengths": string[],
  "improvements": string[],
  "winProbability": number,
  "recommendations": string[]
}

Focus on:
- Alignment with opportunity requirements
- Technical feasibility and innovation
- Team qualifications and experience
- Budget reasonableness
- Timeline realism
- Compliance with government contracting standards
- Competitive positioning
`

    try {
      const analysis = await openaiService.scoreApplicationQuality(applicationData, opportunity)
      return NextResponse.json({
        success: true,
        analysis
      })
    } catch (error) {
      console.error('OpenAI API error:', error)
      return NextResponse.json({
        success: false,
        error: 'OpenAI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Application analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Fallback analysis functions
function calculateBasicQualityScore(applicationData: ApplicationData): number {
  let score = 50 // Base score

  // Check completeness
  if (applicationData.proposalText.length > 200) score += 15
  if (applicationData.technicalApproach.length > 100) score += 10
  if (applicationData.teamMembers.length > 50) score += 10
  if (applicationData.timeline.length > 50) score += 5
  if (applicationData.budget.length > 50) score += 5
  if (applicationData.relevantExperience.length > 100) score += 5

  return Math.min(100, score)
}

function generateBasicStrengths(applicationData: ApplicationData): string[] {
  const strengths: string[] = []

  if (applicationData.proposalText.length > 500) {
    strengths.push('Comprehensive proposal overview provided')
  }
  if (applicationData.technicalApproach.length > 200) {
    strengths.push('Detailed technical approach outlined')
  }
  if (applicationData.teamMembers.length > 100) {
    strengths.push('Well-defined team structure and qualifications')
  }
  if (applicationData.relevantExperience.length > 200) {
    strengths.push('Strong relevant experience demonstrated')
  }

  if (strengths.length === 0) {
    strengths.push('Application shows good foundation for development')
  }

  return strengths
}

function generateBasicImprovements(applicationData: ApplicationData): string[] {
  const improvements: string[] = []

  if (applicationData.proposalText.length < 300) {
    improvements.push('Expand the proposal overview with more detail')
  }
  if (applicationData.technicalApproach.length < 150) {
    improvements.push('Provide more comprehensive technical methodology')
  }
  if (applicationData.teamMembers.length < 100) {
    improvements.push('Include more detailed team member qualifications')
  }
  if (applicationData.timeline.length < 100) {
    improvements.push('Develop a more detailed project timeline')
  }
  if (applicationData.budget.length < 100) {
    improvements.push('Provide more detailed budget breakdown')
  }

  return improvements.slice(0, 5) // Limit to 5 improvements
}

function calculateBasicWinProbability(applicationData: ApplicationData): number {
  let probability = 0.3 // Base probability

  // Adjust based on content quality
  const totalContentLength = 
    applicationData.proposalText.length +
    applicationData.technicalApproach.length +
    applicationData.teamMembers.length +
    applicationData.relevantExperience.length

  if (totalContentLength > 1000) probability += 0.2
  if (totalContentLength > 2000) probability += 0.1
  if (applicationData.timeline.length > 100) probability += 0.05
  if (applicationData.budget.length > 100) probability += 0.05

  return Math.min(0.9, probability)
}

function generateBasicRecommendations(applicationData: ApplicationData): string[] {
  return [
    'Review and expand technical specifications where possible',
    'Include specific examples of past successful projects',
    'Ensure timeline aligns with project complexity',
    'Verify budget competitiveness and completeness',
    'Highlight unique value propositions and differentiators'
  ]
}
