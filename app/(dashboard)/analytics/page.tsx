'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Metric, Text, Grid } from '@/components/ui/card'
import { LineChart, BarChart, DonutChart } from '@/components/ui/charts'
import { 
  TrendingUp, TrendingDown, Download, RefreshCw, DollarSign, Target, Award, Clock,
  Building, FileText} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalApplications: number
    successRate: number
    averageAwardAmount: number
    timeToAward: number
    trendsData: Array<{
      month: string
      applications: number
      awards: number
      revenue: number
    }>
  }
  performanceByAgency: Array<{
    agency: string
    applications: number
    awards: number
    successRate: number
    revenue: number
  }>
  opportunityTypes: Array<{
    type: string
    count: number
    value: number
  }>
  competitionAnalysis: {
    averageCompetitors: number
    smallBusiness: number
    largeContract: number
    grantSuccess: number
  }
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('6months')
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // TESTING MODE: Skip auth redirect
    /*
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadAnalytics()
    }
    */
    loadAnalytics()
  }, [user, loading, router, timeRange])

  const loadAnalytics = async () => {
    try {
      // Comprehensive analytics data
      const mockAnalytics = {
        overview: {
          totalApplications: 47,
          successRate: 23.4,
          averageAwardAmount: 1850000,
          timeToAward: 127,
          trendsData: [
            { month: 'Jan', applications: 8, awards: 2, revenue: 1200000 },
            { month: 'Feb', applications: 12, awards: 3, revenue: 2100000 },
            { month: 'Mar', applications: 15, awards: 4, revenue: 3200000 },
            { month: 'Apr', applications: 18, awards: 4, revenue: 2800000 },
            { month: 'May', applications: 22, awards: 6, revenue: 4100000 },
            { month: 'Jun', applications: 25, awards: 7, revenue: 5200000 }
          ]
        },
        performanceByAgency: [
          { agency: 'Department of Defense', applications: 12, awards: 3, successRate: 25, revenue: 4200000 },
          { agency: 'Department of Homeland Security', applications: 8, awards: 2, successRate: 25, revenue: 2800000 },
          { agency: 'Department of Energy', applications: 7, awards: 2, successRate: 28.6, revenue: 3100000 },
          { agency: 'NASA', applications: 5, awards: 2, successRate: 40, revenue: 2500000 },
          { agency: 'Department of Veterans Affairs', applications: 6, awards: 1, successRate: 16.7, revenue: 1800000 }
        ],
        opportunityTypes: [
          { type: 'Contracts', count: 28, value: 15200000 },
          { type: 'Grants', count: 12, value: 4800000 },
          { type: 'SBIR', count: 5, value: 2100000 },
          { type: 'STTR', count: 2, value: 800000 }
        ],
        competitionAnalysis: {
          averageCompetitors: 8.7,
          smallBusiness: 34.2,
          largeContract: 12.8,
          grantSuccess: 41.3
        }
      }
      
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0}).format(amount)
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="3months">Last 3 months</option>
                <option value="6months">Last 6 months</option>
                <option value="1year">Last 12 months</option>
                <option value="all">All time</option>
              </select>
              <Button variant="outline" onClick={() => loadAnalytics()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Performance Analytics</h2>
          <p className="text-gray-600">
            Comprehensive insights into your government contracting performance
          </p>
        </div>

        {/* Overview Metrics */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Total Applications</Text>
                  <Metric>{analytics?.overview.totalApplications || 0}</Metric>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <Text className="text-green-600">+18% vs last period</Text>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Success Rate</Text>
                  <Metric>{analytics?.overview.successRate || 0}%</Metric>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <Text className="text-green-600">+2.3% vs average</Text>
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Avg. Award Amount</Text>
                  <Metric>{formatCurrency(analytics?.overview.averageAwardAmount || 0)}</Metric>
                  <div className="flex items-center text-yellow-600">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <Text className="text-yellow-600">-5% vs last period</Text>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Avg. Time to Award</Text>
                  <Metric>{analytics?.overview.timeToAward || 0} days</Metric>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <Text className="text-green-600">12 days faster</Text>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={analytics?.overview.trendsData || []}
                index="month"
                categories={['applications', 'awards', 'revenue']}
                colors={['blue', 'emerald', 'purple']}
                yAxisWidth={60}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunity Types</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={analytics?.opportunityTypes || []}
                index="type"
                category="count"
                colors={['blue', 'emerald', 'purple', 'orange']}
              />
            </CardContent>
          </Card>
        </div>

        {/* Performance by Agency */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance by Agency</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={analytics?.performanceByAgency || []}
              index="agency"
              categories={['applications', 'awards']}
              colors={['blue', 'emerald']}
              yAxisWidth={120}
            />
          </CardContent>
        </Card>

        {/* Agency Performance Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detailed Agency Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Awards
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics?.performanceByAgency?.map((agency, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {agency.agency}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agency.applications}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agency.awards}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={agency.successRate > 25 ? 'default' : 'secondary'}
                          className={
                            agency.successRate > 25 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {agency.successRate}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(agency.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Competition Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Competition Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {analytics?.competitionAnalysis.averageCompetitors || 0}
                </div>
                <Text>Average Competitors</Text>
                <Text className="text-green-600">Per opportunity</Text>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  {analytics?.competitionAnalysis.smallBusiness || 0}%
                </div>
                <Text>Small Business Set-aside</Text>
                <Text className="text-green-600">Success rate</Text>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {analytics?.competitionAnalysis.largeContract || 0}%
                </div>
                <Text>Large Contract</Text>
                <Text className="text-yellow-600">Success rate</Text>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {analytics?.competitionAnalysis.grantSuccess || 0}%
                </div>
                <Text>Grant Success</Text>
                <Text className="text-green-600">Above average</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
