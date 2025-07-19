'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, Users, TrendingUp, DollarSign, Building,
  Loader2, AlertTriangle, Search, MapPin, BookOpen
} from 'lucide-react'

interface Institution {
  unitid: string
  name: string
  city: string
  state: string
  type: string
  website: string
  enrollment: number
}

interface MarketData {
  sector_summary: {
    market_size: string
    federal_spending: string
    institutions: string
    students: string
  }
  opportunities: {
    active_contracts: number
    total_value: string
    top_categories: string[]
  }
  key_agencies: string[]
}

export default function EducationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [searchState, setSearchState] = useState('CA')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [loadingInstitutions, setLoadingInstitutions] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadMarketData()
    }
  }, [user, loading, router])

  const loadMarketData = async () => {
    setLoadingData(true)
    setError('')

    try {
      const response = await fetch('/api/education?action=overview')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setMarketData(data.education_overview)
    } catch (error: any) {
      setError(error.message)
      console.error('Market data error:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadInstitutions = async () => {
    setLoadingInstitutions(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.append('action', 'search')
      params.append('state', searchState)
      if (searchQuery) params.append('query', searchQuery)
      params.append('limit', '15')

      const response = await fetch(`/api/education?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setInstitutions(data.institutions || [])
    } catch (error: any) {
      setError(error.message)
      console.error('Institutions data error:', error)
    } finally {
      setLoadingInstitutions(false)
    }
  }

  const handleSearchInstitutions = (e: React.FormEvent) => {
    e.preventDefault()
    loadInstitutions()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Education Intelligence</h1>
              <Badge className="bg-blue-100 text-blue-800">
                <GraduationCap className="h-3 w-3 mr-1" />
                IPEDS Data
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/opportunities')}>
                Opportunities
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Education Market Intelligence</h2>
          <p className="text-gray-600">
            Real-time data from IPEDS (Integrated Postsecondary Education Data System) and federal spending databases
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Overview */}
        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : marketData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData.sector_summary.market_size}</div>
                <p className="text-xs text-muted-foreground">
                  Total education market
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Federal Spending</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData.sector_summary.federal_spending}</div>
                <p className="text-xs text-muted-foreground">
                  Annual government education spending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Institutions</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData.sector_summary.institutions}</div>
                <p className="text-xs text-muted-foreground">
                  Colleges and universities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData.sector_summary.students}</div>
                <p className="text-xs text-muted-foreground">
                  Total enrollment
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Market Intelligence */}
        {marketData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Top Opportunity Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketData.opportunities.top_categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant="secondary">{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Federal Agencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketData.key_agencies.map((agency, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{agency}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Institution Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Institution Directory</CardTitle>
            <p className="text-sm text-gray-600">
              Search the IPEDS database of colleges and universities
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchInstitutions} className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search by institution name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                
                <select
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="IL">Illinois</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="OH">Ohio</option>
                </select>
                
                <Button type="submit" disabled={loadingInstitutions}>
                  {loadingInstitutions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>
            </form>

            {/* Institution Results */}
            {loadingInstitutions && (
              <div className="mt-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Searching IPEDS database...</p>
              </div>
            )}

            {institutions.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Found {institutions.length} institutions in {searchState}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutions.map((institution) => (
                    <div key={institution.unitid} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{institution.name}</h5>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{institution.type}</Badge>
                            <span className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {institution.city}, {institution.state}
                            </span>
                          </div>
                          {institution.enrollment && (
                            <p className="text-sm text-gray-600">
                              <Users className="h-3 w-3 inline mr-1" />
                              {institution.enrollment.toLocaleString()} students
                            </p>
                          )}
                          {institution.website && (
                            <a 
                              href={institution.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 block"
                            >
                              Visit Website
                            </a>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Unit ID</p>
                          <p className="text-sm font-mono">{institution.unitid}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Find Education Opportunities?
              </h3>
              <p className="text-gray-600 mb-4">
                Search thousands of education contracts, grants, and research funding
              </p>
              <Button 
                onClick={() => router.push('/opportunities?type=education')}
                className="mr-4"
              >
                Browse Education Opportunities
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/ai-command')}
              >
                Ask AI for Market Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}