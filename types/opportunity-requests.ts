export interface OpportunityRequest {
  id: string
  company_id: string
  requested_by?: string
  request_type: string
  target_counties: string[]
  target_cities: string[]
  industry_codes: string[]
  budget_min?: number
  budget_max?: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateOpportunityRequest {
  request_type: string
  target_counties: string[]
  target_cities: string[]
  industry_codes: string[]
  budget_min?: number
  budget_max?: number
  notes?: string
}

export interface UpdateOpportunityRequest {
  request_type?: string
  target_counties?: string[]
  target_cities?: string[]
  industry_codes?: string[]
  budget_min?: number
  budget_max?: number
  status?: 'pending' | 'processing' | 'completed' | 'cancelled'
  notes?: string
}

export interface CompanyLocationData {
  california_county?: string
  california_cities: string[]
  operating_regions: string[]
}

export interface RequestType {
  id: string
  name: string
  description: string
  category: string
}

export interface IndustryCode {
  code: string
  name: string
  category: string
}

export interface BudgetRange {
  min: number
  max: number
  label: string
}

// Request type options
export const REQUEST_TYPES: RequestType[] = [
  {
    id: 'construction',
    name: 'Construction',
    description: 'Building, renovation, and infrastructure projects',
    category: 'Construction'
  },
  {
    id: 'services',
    name: 'Professional Services',
    description: 'Consulting, legal, accounting, and other professional services',
    category: 'Services'
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Software, IT services, and technology solutions',
    category: 'Technology'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical services, equipment, and healthcare solutions',
    category: 'Healthcare'
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Educational services, training, and learning materials',
    category: 'Education'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Product manufacturing and industrial services',
    category: 'Manufacturing'
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Logistics, transportation, and fleet services',
    category: 'Transportation'
  },
  {
    id: 'environmental',
    name: 'Environmental',
    description: 'Environmental services, waste management, and sustainability',
    category: 'Environmental'
  }
]

// Common industry codes (NAICS)
export const INDUSTRY_CODES: IndustryCode[] = [
  // Construction
  { code: '236220', name: 'Commercial Building Construction', category: 'Construction' },
  { code: '236210', name: 'Industrial Building Construction', category: 'Construction' },
  { code: '237310', name: 'Highway, Street, and Bridge Construction', category: 'Construction' },
  { code: '238190', name: 'Other Building Equipment Contractors', category: 'Construction' },
  
  // Professional Services
  { code: '541330', name: 'Engineering Services', category: 'Services' },
  { code: '541511', name: 'Custom Computer Programming Services', category: 'Services' },
  { code: '541519', name: 'Other Computer Related Services', category: 'Services' },
  { code: '541612', name: 'Human Resources Consulting Services', category: 'Services' },
  
  // Technology
  { code: '511210', name: 'Software Publishers', category: 'Technology' },
  { code: '518210', name: 'Data Processing, Hosting, and Related Services', category: 'Technology' },
  { code: '541512', name: 'Computer Systems Design Services', category: 'Technology' },
  
  // Healthcare
  { code: '621111', name: 'Offices of Physicians (except Mental Health Specialists)', category: 'Healthcare' },
  { code: '621210', name: 'Offices of Dentists', category: 'Healthcare' },
  { code: '339112', name: 'Surgical and Medical Instrument Manufacturing', category: 'Healthcare' },
  
  // Education
  { code: '611110', name: 'Elementary and Secondary Schools', category: 'Education' },
  { code: '611310', name: 'Colleges, Universities, and Professional Schools', category: 'Education' },
  { code: '611420', name: 'Computer Training', category: 'Education' },
  
  // Manufacturing
  { code: '332996', name: 'Fabricated Pipe and Pipe Fitting Manufacturing', category: 'Manufacturing' },
  { code: '332312', name: 'Fabricated Structural Metal Manufacturing', category: 'Manufacturing' },
  { code: '332323', name: 'Ornamental and Architectural Metal Work Manufacturing', category: 'Manufacturing' },
  
  // Transportation
  { code: '484110', name: 'General Freight Trucking, Local', category: 'Transportation' },
  { code: '484121', name: 'General Freight Trucking, Long-Distance, Truckload', category: 'Transportation' },
  { code: '485320', name: 'Urban Transit Systems', category: 'Transportation' },
  
  // Environmental
  { code: '562111', name: 'Solid Waste Collection', category: 'Environmental' },
  { code: '562211', name: 'Hazardous Waste Treatment and Disposal', category: 'Environmental' },
  { code: '541620', name: 'Environmental Consulting Services', category: 'Environmental' }
]

// Budget range options
export const BUDGET_RANGES: BudgetRange[] = [
  { min: 0, max: 50000, label: 'Under $50,000' },
  { min: 50000, max: 100000, label: '$50,000 - $100,000' },
  { min: 100000, max: 250000, label: '$100,000 - $250,000' },
  { min: 250000, max: 500000, label: '$250,000 - $500,000' },
  { min: 500000, max: 1000000, label: '$500,000 - $1,000,000' },
  { min: 1000000, max: 5000000, label: '$1,000,000 - $5,000,000' },
  { min: 5000000, max: 10000000, label: '$5,000,000 - $10,000,000' },
  { min: 10000000, max: null, label: 'Over $10,000,000' }
]

// Helper functions
export const getRequestTypesByCategory = (category: string): RequestType[] => {
  return REQUEST_TYPES.filter(type => type.category === category)
}

export const getIndustryCodesByCategory = (category: string): IndustryCode[] => {
  return INDUSTRY_CODES.filter(code => code.category === category)
}

export const getBudgetRangeByValue = (min: number, max: number): BudgetRange | undefined => {
  return BUDGET_RANGES.find(range => 
    range.min === min && range.max === max
  )
}
