'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, Users, TrendingUp, DollarSign, Building,
  Loader2, AlertTriangle, Search, MapPin, Stethoscope
} from 'lucide-react'

interface Provider {
  npi: string
  name: string
  type: string
  city: string
  state: string
  specialties: string[]
}

interface MarketData {
  sector_summary: {
    market_size: string
    growth_rate: string
    federal_spending: string
    top_agencies: string[]
  }
  opportunities: {
    active_contracts: number
    total_value: string
    avg_contract_size: string
    top_categories: string[]
  }
  key_trends: string[]
}

export default function HealthcarePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [searchState, setSearchState] = useState('CA')
  const [loadingData, setLoadingData] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
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
      const response = await fetch('/api/healthcare?action=overview')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setMarketData(data.healthcare_overview)
    } catch (error: any) {
      setError(error.message)
      console.error('Market data error:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadProviders = async () => {
    setLoadingProviders(true)
    setError('')

    try {
      const response = await fetch(`/api/healthcare?action=providers&state=${searchState}&limit=10`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error: any) {
      setError(error.message)
      console.error('Providers data error:', error)
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleSearchProviders = (e: React.FormEvent) => {
    e.preventDefault()
    loadProviders()
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
              <h1 className="text-2xl font-bold text-gray-900">Healthcare Intelligence</h1>
              <Badge className="bg-red-100 text-red-800">
                <Heart className="h-3 w-3 mr-1" />
                Live Data
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Healthcare Market Intelligence</h2>
          <p className="text-gray-600">
            Real-time data from NPPES Healthcare Provider Registry and government spending databases
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData.sector_summary.market_size}</div>
                <p className="text-xs text-muted-foreground">
                  {marketData.sector_summary.growth_rate} annual growth
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
                  Annual government healthcare spending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData.opportunities.active_contracts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {marketData.opportunities.total_value} total value
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
                <CardTitle>Key Market Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketData.key_trends.map((trend, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{trend}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Provider Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Healthcare Provider Directory</CardTitle>
            <p className="text-sm text-gray-600">
              Search the NPPES Healthcare Provider Registry
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchProviders} className="space-y-4">
              <div className="flex space-x-4">
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
                </select>
                
                <Button type="submit" disabled={loadingProviders}>
                  {loadingProviders ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search Providers
                </Button>
              </div>
            </form>

            {/* Provider Results */}
            {loadingProviders && (
              <div className="mt-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Searching NPPES database...</p>
              </div>
            )}

            {providers.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Found {providers.length} providers in {searchState}
                </h4>
                {providers.map((provider) => (
                  <div key={provider.npi} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{provider.name}</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{provider.type}</Badge>
                          <span className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {provider.city}, {provider.state}
                          </span>
                        </div>
                        {provider.specialties.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Specialties:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.specialties.slice(0, 3).map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">NPI</p>
                        <p className="text-sm font-mono">{provider.npi}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Stethoscope className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Find Healthcare Opportunities?
              </h3>
              <p className="text-gray-600 mb-4">
                Search thousands of healthcare contracts and grants
              </p>
              <Button 
                onClick={() => router.push('/opportunities?type=healthcare')}
                className="mr-4"
              >
                Browse Healthcare Opportunities
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