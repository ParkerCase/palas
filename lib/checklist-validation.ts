import { CompanyChecklist } from '@/types/checklist'
import { CHECKLIST_ITEMS } from '@/lib/checklist-data'

export interface ChecklistValidationResult {
  isComplete: boolean
  missingItems: string[]
  recommendations: string[]
  completionPercentage: number
  canApply: boolean
}

export interface JurisdictionRequirements {
  State: string[]
  County: string[]
  City: string[]
  All: string[]
}

export function validateChecklistForJurisdiction(
  checklist: CompanyChecklist,
  jurisdiction: 'State' | 'County' | 'City' | 'All'
): ChecklistValidationResult {
  const jurisdictionItems = CHECKLIST_ITEMS.filter(item => item.category === jurisdiction)
  const missingItems: string[] = []
  const recommendations: string[] = []

  // Check each item for the jurisdiction
  jurisdictionItems.forEach(item => {
    if (!checklist[item.field]) {
      missingItems.push(item.label)
    }
  })

  const completionPercentage = jurisdictionItems.length > 0 
    ? Math.round(((jurisdictionItems.length - missingItems.length) / jurisdictionItems.length) * 100)
    : 100

  const isComplete = missingItems.length === 0
  const canApply = completionPercentage >= 80 // Allow application if 80% complete

  // Generate recommendations
  if (missingItems.length > 0) {
    recommendations.push(`Complete the ${missingItems.length} missing ${jurisdiction.toLowerCase()} requirements`)
    
    if (missingItems.length <= 3) {
      recommendations.push('You\'re almost ready! Complete the remaining items to improve your competitive position.')
    } else {
      recommendations.push('Focus on completing the most critical items first: Business License, Insurance Certificates, and Financial Statements.')
    }
  } else {
    recommendations.push(`Excellent! All ${jurisdiction} requirements are complete.`)
  }

  return {
    isComplete,
    missingItems,
    recommendations,
    completionPercentage,
    canApply
  }
}

export function validateChecklistForApplication(
  checklist: CompanyChecklist,
  jurisdictions: ('State' | 'County' | 'City' | 'All')[]
): ChecklistValidationResult {
  const allMissingItems: string[] = []
  const allRecommendations: string[] = []
  let totalItems = 0
  let completedItems = 0

  // Check each jurisdiction
  jurisdictions.forEach(jurisdiction => {
    const validation = validateChecklistForJurisdiction(checklist, jurisdiction)
    allMissingItems.push(...validation.missingItems)
    allRecommendations.push(...validation.recommendations)
    
    const jurisdictionItems = CHECKLIST_ITEMS.filter(item => item.category === jurisdiction)
    totalItems += jurisdictionItems.length
    completedItems += jurisdictionItems.length - validation.missingItems.length
  })

  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100
  const isComplete = allMissingItems.length === 0
  const canApply = completionPercentage >= 80

  // Generate overall recommendations
  const overallRecommendations: string[] = []
  if (allMissingItems.length > 0) {
    overallRecommendations.push(`You have ${allMissingItems.length} missing requirements across ${jurisdictions.length} jurisdictions`)
    
    if (allMissingItems.length <= 5) {
      overallRecommendations.push('You\'re very close to being fully prepared for government contracting!')
    } else if (allMissingItems.length <= 10) {
      overallRecommendations.push('Good progress! Focus on completing the most common requirements first.')
    } else {
      overallRecommendations.push('Consider starting with smaller jurisdictions or focusing on your strongest areas first.')
    }
  } else {
    overallRecommendations.push('Perfect! You\'re fully prepared for government contracting across all jurisdictions.')
  }

  return {
    isComplete,
    missingItems: allMissingItems,
    recommendations: overallRecommendations,
    completionPercentage,
    canApply
  }
}

export function getCriticalItems(checklist: CompanyChecklist): string[] {
  const criticalItemFields = [
    'business_license_state',
    'business_license_county', 
    'business_license_city',
    'federal_ein_state',
    'federal_ein_county',
    'federal_ein_city',
    'insurance_certificates_state',
    'insurance_certificates_county',
    'insurance_certificates_city',
    'financial_statements_state',
    'financial_statements_county',
    'financial_statements_city',
    'legal_business_name_dba',
    'duns_uei_number',
    'naics_unspsc_codes'
  ] as const

  const missingCriticalItems: string[] = []
  
  criticalItemFields.forEach(field => {
    if (!checklist[field as keyof CompanyChecklist]) {
      const item = CHECKLIST_ITEMS.find(item => item.field === field)
      if (item) {
        missingCriticalItems.push(item.label)
      }
    }
  })

  return missingCriticalItems
}

export function getChecklistSummary(checklist: CompanyChecklist): {
  totalItems: number
  completedItems: number
  completionPercentage: number
  byJurisdiction: {
    State: number
    County: number
    City: number
    All: number
  }
  criticalItemsMissing: number
} {
  const totalItems = CHECKLIST_ITEMS.length
  let completedItems = 0
  const byJurisdiction: { [key: string]: number } = {}

  CHECKLIST_ITEMS.forEach(item => {
    if (checklist[item.field as keyof CompanyChecklist]) {
      completedItems++
      byJurisdiction[item.category] = (byJurisdiction[item.category] || 0) + 1
    }
  })

  const criticalItemsMissing = getCriticalItems(checklist).length

  return {
    totalItems,
    completedItems,
    completionPercentage: Math.round((completedItems / totalItems) * 100),
    byJurisdiction: {
      State: byJurisdiction['State'] || 0,
      County: byJurisdiction['County'] || 0,
      City: byJurisdiction['City'] || 0,
      All: byJurisdiction['All'] || 0
    },
    criticalItemsMissing
  }
}
