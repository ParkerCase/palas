'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Factory, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Search, 
  MapPin, 
  Award,
  BarChart3,
  Target,
  RefreshCw,
  Phone,
  Mail,
  Cog,
  Shield,
  Zap,
  Car,
  Cpu,
  FlaskConical,
  Utensils,
  Scissors
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface ManufacturingCompany {
  id: string
  name: string
  type: string
  location: {
    address: string
    city: string
    state: string
    zip: string
  }
  contact: {
    phone: string
    email?: string
  }
  specialties: string[]
  procurement_potential: number
  likely_opportunities: string[]
  revenue_range: string
  employee_count: string
  naics_codes: string[]
  capabilities: string[]
}

interface SpendingAnalysis {
  total_awards: number
  total_funding: number
  top_recipients: Array<{
    name: string
    total: number
    count: number
  }>
  funding_by_agency: Array<{
    name: string
    total: number
    count: number
  }>
  spending_by_category: Array<{
    category: string
    amount: number
    percentage: number
  }>
  awards: Array<{
    id: string
    recipient: string
    agency: string
    amount: number
    start_date: string
    description: string
    naics_description: string
    location: {
      city: string
      state: string
    }
  }>
}

interface ManufacturingOverview {
  sector_summary: {
    market_size: string
    annual_growth: string
    total_companies: string
    total_facilities: string
    government_spending: string
  }
  key_segments: Array<{
    name: string
    size: string
    entities: string
    opportunity_score: number
  }>
}

export default function ManufacturingIntelligenceDashboard() {
  const [companies, setCompanies] = useState<ManufacturingCompany[]>([])
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null)
  const [overview, setOverview] = useState<ManufacturingOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('all')
  const [activeTab, setActiveTab] = useState('search')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const router = useRouter()
  const { toast } = useToast()

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

  const searchCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        action: 'search-companies',
        query: searchQuery,
        state: selectedState === 'all' ? '' : selectedState,
        limit: (itemsPerPage * currentPage).toString()
      })

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/manufacturing?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`}})
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
        toast({
          title: "Success",
          description: `Found ${data.companies.length} manufacturing companies`})
      } else {
        throw new Error(data.error || 'Failed to fetch companies')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: "Error",
        description: "Failed to search companies. Please try again.",
        variant: "destructive"})
    } finally {
      setLoading(false)
    }
  }

  const loadOverview = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/manufacturing?action=overview', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`}})
      
      if (!response.ok) {
        throw new Error('Failed to fetch overview')
      }
      
      const data = await response.json()
      if (data.success) {
        setOverview(data.manufacturing_overview)
      }
    } catch (error) {
      console.error('Overview error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSpendingAnalysis = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        action: 'spending-analysis',
        query: searchQuery,
        state: selectedState === 'all' ? '' : selectedState,
        limit: '100'
      })

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/manufacturing?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`}})
      
      if (!response.ok) {
        throw new Error('Failed to fetch spending analysis')
      }
      
      const data = await response.json()
      if (data.success) {
        setSpendingAnalysis(data.spending_analysis)
        setActiveTab('spending')
        toast({
          title: "Success",
          description: "Manufacturing spending analysis loaded"})
      }
    } catch (error) {
      console.error('Spending analysis error:', error)
      toast({
        title: "Error",
        description: "Failed to load spending analysis. Please try again.",
        variant: "destructive"})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
    searchCompanies()
  }, [])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount.toLocaleString()}`
  }

  const getPotentialColor = (potential: number) => {
    if (potential >= 80) return 'bg-green-100 text-green-800'
    if (potential >= 60) return 'bg-blue-100 text-blue-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getCompanyTypeIcon = (type: string | undefined) => {
    if (!type) return <Factory className="h-4 w-4" />
    
    switch (type.toLowerCase()) {
      case 'automotive': return <Car className="h-4 w-4" />
      case 'electronics': return <Cpu className="h-4 w-4" />
      case 'chemicals': return <FlaskConical className="h-4 w-4" />
      case 'food & beverage': return <Utensils className="h-4 w-4" />
      case 'textiles': return <Scissors className="h-4 w-4" />
      default: return <Factory className="h-4 w-4" />
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(companies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCompanies = companies.slice(startIndex, endIndex)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Factory className="h-8 w-8 text-blue-600" />
            Manufacturing Intelligence
          </h1>
          <p className="text-muted-foreground">
            Analyze manufacturing companies, supply chains, and procurement opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/opportunities')}
          >
            <Target className="h-4 w-4 mr-1" />
            All Opportunities
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Market Size</p>
                  <p className="text-2xl font-bold">{overview.sector_summary.market_size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Companies</p>
                  <p className="text-2xl font-bold">{overview.sector_summary.total_companies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Annual Growth</p>
                  <p className="text-2xl font-bold">{overview.sector_summary.annual_growth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Gov Spending</p>
                  <p className="text-2xl font-bold">{overview.sector_summary.government_spending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">High Potential</p>
                  <p className="text-2xl font-bold">
                    {companies.filter(c => c.procurement_potential >= 80).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="search" className="flex items-center gap-2 p-3">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Company Search</span>
            <span className="sm:hidden">Search</span>
          </TabsTrigger>
          <TabsTrigger value="spending" className="flex items-center gap-2 p-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Spending Analysis</span>
            <span className="sm:hidden">Spending</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2 p-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Opportunities</span>
            <span className="sm:hidden">Opps</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Manufacturing Companies</CardTitle>
              <CardDescription>
                Find manufacturing companies with detailed business data from Census Bureau & BLS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={searchCompanies} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {companies.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, companies.length)} of {companies.length} companies
                </p>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentCompanies.map((company) => (
                  <Card key={company.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2 mb-2">
                            {company.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {company.location?.city && company.location?.state 
                                ? `${company.location.city}, ${company.location.state}`
                                : company.location?.address || 'Location not specified'
                              }
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {getCompanyTypeIcon(company.type)}
                              {company.type}
                            </Badge>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{company.revenue_range}</span>
                            <span>•</span>
                            <span>{company.employee_count} employees</span>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getPotentialColor(company.procurement_potential)}`}>
                          {company.procurement_potential}% Potential
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {company.contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{company.contact.phone}</span>
                            </div>
                          )}
                          {company.contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{company.contact.email}</span>
                            </div>
                          )}
                        </div>

                        {company.specialties && company.specialties.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Specialties:</div>
                            <div className="flex flex-wrap gap-1">
                              {company.specialties.slice(0, 3).map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {company.specialties.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{company.specialties.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {company.capabilities && company.capabilities.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Capabilities:</div>
                            <div className="flex flex-wrap gap-1">
                              {company.capabilities.slice(0, 2).map((capability, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {capability}
                                </Badge>
                              ))}
                              {company.capabilities.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{company.capabilities.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Likely Opportunities:</div>
                          <div className="flex flex-wrap gap-1">
                            {company.likely_opportunities.slice(0, 3).map((opportunity) => (
                              <Badge key={opportunity} variant="outline" className="text-xs">
                                {opportunity}
                              </Badge>
                            ))}
                            {company.likely_opportunities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{company.likely_opportunities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Spending Analysis Tab */}
        <TabsContent value="spending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturing Sector Spending Analysis</CardTitle>
              <CardDescription>
                Analyze federal spending patterns in manufacturing and supply chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                  placeholder="Company or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={loadSpendingAnalysis} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  Analyze Spending
                </Button>
              </div>
            </CardContent>
          </Card>

          {spendingAnalysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Awards</p>
                        <p className="text-2xl font-bold">{spendingAnalysis.total_awards.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Funding</p>
                        <p className="text-2xl font-bold">{formatCurrency(spendingAnalysis.total_funding)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Factory className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Award Size</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(spendingAnalysis.total_funding / spendingAnalysis.total_awards)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Top Agencies</p>
                        <p className="text-2xl font-bold">{spendingAnalysis.funding_by_agency.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Recipients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {spendingAnalysis.top_recipients.slice(0, 5).map((recipient, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{recipient.name}</p>
                            <p className="text-xs text-muted-foreground">{recipient.count} awards</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(recipient.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {spendingAnalysis.spending_by_category.slice(0, 5).map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{category.category}</p>
                            <p className="text-xs text-muted-foreground">{category.percentage}% of total</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(category.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturing Sector Opportunities</CardTitle>
              <CardDescription>
                Current and upcoming procurement opportunities in manufacturing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Defense Manufacturing</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Defense systems, military equipment, aerospace components
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$1M - $500M</Badge>
                      <span className="text-xs text-muted-foreground">189 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cog className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold">Industrial Equipment</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Machinery, tools, industrial automation systems
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$100K - $50M</Badge>
                      <span className="text-xs text-muted-foreground">267 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold">Technology Components</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Electronics, semiconductors, advanced materials
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$250K - $25M</Badge>
                      <span className="text-xs text-muted-foreground">312 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 text-center">
                <Button onClick={() => router.push('/opportunities')}>
                  View All Manufacturing Opportunities
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
