import { supabase } from '@/lib/supabaseClient'
import { loggedOpenAI } from './loggedOpenAI'

const openai = loggedOpenAI.getClient()

export interface DocumentAnalysisResult {
  title: string
  agency: string
  office?: string
  solicitation_number?: string
  submission_deadline?: string
  contract_value_min?: number
  contract_value_max?: number
  naics_codes: number[]
  description: string
  requirements: {
    technical: string[]
    experience: string[]
    certifications: string[]
    security_clearance?: string
    performance_period?: string
    place_of_performance?: string
  }
  evaluation_criteria: {
    technical_approach?: number
    past_performance?: number
    price?: number
    small_business?: number
    other?: { [key: string]: number }
  }
  set_aside_type?: string
  keywords: string[]
  opportunity_type: 'rfp' | 'rfq' | 'ib' | 'solicitation' | 'amendment' | 'award'
  contact_info?: {
    contracting_officer?: string
    email?: string
    phone?: string
  }
}

export interface OpportunityMatch {
  opportunity_id: string
  match_score: number
  win_probability: number
  reasoning: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    naics_match: boolean
    size_qualification: boolean
    past_performance_relevance: number
    geographic_advantage: boolean
  }
}

export interface QualityScoreResult {
  overall_score: number
  completeness_score: number
  technical_score: number
  compliance_score: number
  competitiveness_score: number
  recommendations: string[]
  missing_requirements: string[]
  improvement_suggestions: string[]
}

class OpenAIService {
  private async getCachedResult<T>(cacheKey: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .select('data')
        .eq('cache_key', cacheKey)
        .single()
      if (error || !data) return null
      return data.data as T
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding without cache:', error)
      return null
    }
  }

  private async setCachedResult<T>(cacheKey: string, data: T, tier: 'tier1_realtime' | 'tier2_hourly' | 'tier3_daily' | 'tier4_weekly' = 'tier2_hourly'): Promise<void> {
    try {
      const now = new Date()
      let expiresAt: Date
      switch (tier) {
        case 'tier1_realtime':
          expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
          break
        case 'tier2_hourly':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
          break
        case 'tier3_daily':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'tier4_weekly':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
      }
      await supabase.from('ai_cache').upsert({
        cache_key: cacheKey,
        cache_type: 'document_analysis',
        data,
        tier,
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      })
    } catch (error) {
      console.warn('Cache storage failed, proceeding without cache:', error)
    }
  }

  async analyzeDocument(documentText: string, documentUrl?: string): Promise<DocumentAnalysisResult> {
    const cacheKey = `doc_analysis_${Buffer.from(documentText.substring(0, 1000)).toString('base64')}`
    const cached = await this.getCachedResult<DocumentAnalysisResult>(cacheKey)
    if (cached) return cached
    const prompt = `You are an expert at analyzing government procurement documents (RFPs, RFQs, solicitations, etc.). Analyze the following document and extract key information in a structured JSON format.\n\nDocument text:\n${documentText}\n\nReturn the following fields: title, agency, office, solicitation_number, submission_deadline, contract_value_min, contract_value_max, naics_codes, description, requirements (technical, experience, certifications, security_clearance, performance_period, place_of_performance), evaluation_criteria (technical_approach, past_performance, price, small_business, other), set_aside_type, keywords, opportunity_type, contact_info (contracting_officer, email, phone). If information is not available, use null.`
    const response = await loggedOpenAI.createChatCompletion(
      'analyzeDocument',
      'gpt-4o',
      [
        { role: 'system', content: 'You are a government contracting expert.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 2000, temperature: 0.2 }
    )
    const responseText = response.choices[0].message?.content || ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No valid JSON found in AI response')
    const result = JSON.parse(jsonMatch[0]) as DocumentAnalysisResult
    await this.setCachedResult(cacheKey, result, 'tier3_daily')
    return result
  }

  async findOpportunityMatches(companyProfile: any, opportunities: unknown[]): Promise<OpportunityMatch[]> {
    const cacheKey = `opp_match_${companyProfile.naics_codes.join(',')}_${opportunities.length}`
    const cached = await this.getCachedResult<OpportunityMatch[]>(cacheKey)
    if (cached) return cached
    const prompt = `You are an expert at matching companies to government contract opportunities. Analyze the company profile and the following opportunities, and provide a JSON array of matches with match_score (0-100), win_probability (0-100), and detailed reasoning.\n\nCompany Profile: ${JSON.stringify(companyProfile)}\n\nOpportunities: ${JSON.stringify(opportunities)}\n\nReturn an array of objects: {opportunity_id, match_score, win_probability, reasoning: {strengths, weaknesses, recommendations, naics_match, size_qualification, past_performance_relevance, geographic_advantage}}.`
    const response = await loggedOpenAI.createChatCompletion(
      'findOpportunityMatches',
      'gpt-4o',
      [
        { role: 'system', content: 'You are a government contracting expert.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 2000, temperature: 0.2 }
    )
    const responseText = response.choices[0].message?.content || ''
    const jsonMatch = responseText.match(/\[([\s\S]*)\]/)
    if (!jsonMatch) throw new Error('No valid JSON found in AI response')
    const matches = JSON.parse(jsonMatch[0]) as OpportunityMatch[]
    await this.setCachedResult(cacheKey, matches, 'tier2_hourly')
    return matches
  }

  async scoreApplicationQuality(application: unknown, opportunity: any): Promise<QualityScoreResult> {
    const appDataForCache = application as { id: string }
    const oppDataForCache = opportunity as { id: string }
    const cacheKey = `quality_score_${appDataForCache.id}_${oppDataForCache.id}`
    const cached = await this.getCachedResult<QualityScoreResult>(cacheKey)
    if (cached) return cached
    const prompt = `You are an expert at evaluating government contract proposal quality. Analyze this application against the opportunity requirements and provide a comprehensive quality score and recommendations in JSON.\n\nOpportunity: ${JSON.stringify(opportunity)}\n\nApplication: ${JSON.stringify(application)}\n\nReturn: {overall_score, completeness_score, technical_score, compliance_score, competitiveness_score, recommendations, missing_requirements, improvement_suggestions}`
    const response = await loggedOpenAI.createChatCompletion(
      'scoreApplicationQuality',
      'gpt-4o',
      [
        { role: 'system', content: 'You are a government contracting expert.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 1500, temperature: 0.2 }
    )
    const responseText = response.choices[0].message?.content || ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No valid JSON found in AI response')
    const result = JSON.parse(jsonMatch[0]) as QualityScoreResult
    await this.setCachedResult(cacheKey, result, 'tier2_hourly')
    return result
  }

  async generateProposalContent(opportunity: unknown, companyProfile: unknown, section: 'technical_approach' | 'past_performance' | 'company_overview' | 'pricing_strategy'): Promise<string> {
    const oppDataForCache = opportunity as { id: string }
    const companyDataForCache = companyProfile as { id: string }
    const cacheKey = `proposal_${oppDataForCache.id}_${section}_${companyDataForCache.id}`
    const cached = await this.getCachedResult<string>(cacheKey)
    if (cached) return cached
    const prompt = `You are an expert proposal writer for government contracts. Generate compelling content for the ${section} section of a proposal, tailored to the following opportunity and company profile.\n\nOpportunity: ${JSON.stringify(opportunity)}\n\nCompany Profile: ${JSON.stringify(companyProfile)}\n\nReturn only the content for the ${section} section.`
    const response = await loggedOpenAI.createChatCompletion(
      'generateProposalContent',
      'gpt-4o',
      [
        { role: 'system', content: 'You are a government contracting expert.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 1200, temperature: 0.3 }
    )
    const content = response.choices[0].message?.content || ''
    await this.setCachedResult(cacheKey, content, 'tier3_daily')
    return content
  }
}

export const openaiService = new OpenAIService() 