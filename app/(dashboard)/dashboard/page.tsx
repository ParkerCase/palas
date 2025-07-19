'use client'

import { useAuth } from '@/app/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Metric, Title, Text, Grid } from '@/components/ui/card'
import { LineChart, BarChart, DonutChart } from '@/components/ui/charts'
import { 
  Search, Plus, Bell, Settings, TrendingUp, 
  FileText, Clock, CheckCircle, AlertCircle, 
  Building, Building2, DollarSign, Users, Activity,
  BookOpen, Award, Target, Zap, Brain
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface DashboardMetrics {
  activeApplications: number
  totalOpportunities: number
  winRate: number
  totalAwarded: number
  monthlyTrends: Array<{
    month: string
    applications: number
    awards: number
    revenue: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    title: string
    timestamp: string
    status: string
  }>
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    logger.info('DashboardPage', 'component_mount', 'Dashboard page mounted', {
      hasUser: !!user,
      userId: user?.id,
      loading
    })

    // REAL AUTH MODE: Check authentication
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadDashboardData()
    }

    /*
    // TESTING MODE: Skip auth redirect
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadDashboardData()
    }
    loadDashboardData()
    */
  }, [user, loading, router])

  const loadDashboardData = async () => {
    try {
      logger.info('DashboardPage', 'load_data', 'Loading dashboard data', {
        hasUser: !!user,
        userId: user?.id
      })

      // REAL DATA MODE: Fetch actual dashboard data
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
        logger.info('DashboardPage', 'data_loaded', 'Dashboard data loaded successfully', {
          dataSource: 'REAL',
          recordCount: 1,
          hasMetrics: !!data
        })
      } else {
        throw new Error(`Failed to load dashboard data: ${response.status}`)
      }

      /*
      // Mock comprehensive dashboard data
      const mockMetrics = {
        activeApplications: 12,
        totalOpportunities: 4847,
        winRate: 23.4,
        totalAwarded: 8750000,
        monthlyTrends: [
          { month: 'Jan', applications: 8, awards: 2, revenue: 1200000 },
          { month: 'Feb', applications: 12, awards: 3, revenue: 2100000 },
          { month: 'Mar', applications: 15, awards: 4, revenue: 3200000 },
          { month: 'Apr', applications: 18, awards: 4, revenue: 2800000 },
          { month: 'May', applications: 22, awards: 6, revenue: 4100000 },
          { month: 'Jun', applications: 25, awards: 7, revenue: 5200000 }
        ],
        recentActivity: [
          {
            id: 'activity-001',
            type: 'application_submitted',
            title: 'AI Cybersecurity Solutions application submitted',
            timestamp: '2024-01-15T10:00:00Z',
            status: 'submitted'
          },
          {
            id: 'activity-002',
            type: 'opportunity_matched',
            title: 'New opportunity matched: Healthcare IT Modernization',
            timestamp: '2024-01-14T15:30:00Z',
            status: 'new'
          },
          {
            id: 'activity-003',
            type: 'award_received',
            title: 'Grant Writing Mastery course completed',
            timestamp: '2024-01-13T09:15:00Z',
            status: 'completed'
          }
        ]
      }
      
      setMetrics(mockMetrics)
      logger.info('DashboardPage', 'data_loaded', 'Dashboard data loaded successfully', {
        dataSource: 'MOCK',
        recordCount: 1,
        hasMetrics: !!mockMetrics
      })
      */
    } catch (error) {
      logger.error('DashboardPage', 'load_data', 'Failed to load dashboard data', error as Error, {
        hasUser: !!user,
        userId: user?.id
      })
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application_submitted': return <FileText className="h-5 w-5 text-blue-600" />
      case 'opportunity_matched': return <Target className="h-5 w-5 text-green-600" />
      case 'award_received': return <Award className="h-5 w-5 text-yellow-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
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
              <h1 className="text-2xl font-bold text-gray-900">GovContractAI</h1>
              <nav className="hidden md:flex space-x-8">
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => router.push('/opportunities')}>
                  Opportunities
                </Button>
                <Button variant="ghost" onClick={() => router.push('/applications')}>
                  Applications
                </Button>
                <Button variant="ghost" onClick={() => router.push('/grants')}>
                  Grants
                </Button>
                <Button variant="ghost" onClick={() => router.push('/ai-analysis')}>
                  AI Analysis
                </Button>
                <Button variant="ghost" onClick={() => router.push('/company-setup')}>
                  Company
                </Button>
                <Button variant="ghost" onClick={() => router.push('/courses')}>
                  Courses
                </Button>
                <Button variant="ghost" onClick={() => router.push('/analytics')}>
                  Analytics
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="h-6 w-6" />
              </button>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                TC
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome back, Test User!</h2>
            <p className="text-blue-100 mb-4">Here's your government contracting dashboard overview</p>
            <div className="flex space-x-4">
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => router.push('/opportunities')}
              >
                <Search className="h-4 w-4 mr-2" />
                Find Opportunities
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => router.push('/applications')}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Active Applications</Text>
                  <Metric>{metrics?.activeApplications || 0}</Metric>
                  <Text className="text-green-600">+2 this month</Text>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Total Opportunities</Text>
                  <Metric>{metrics?.totalOpportunities?.toLocaleString() || 0}</Metric>
                  <Text className="text-blue-600">Updated daily</Text>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Win Rate</Text>
                  <Metric>{metrics?.winRate || 0}%</Metric>
                  <Text className="text-yellow-600">Above average</Text>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Total Awarded</Text>
                  <Metric>${((metrics?.totalAwarded || 0) / 1000000).toFixed(1)}M</Metric>
                  <Text className="text-green-600">Lifetime value</Text>
                </div>
                <Award className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={metrics?.monthlyTrends || []}
                index="month"
                categories={['applications', 'awards', 'revenue']}
                colors={['blue', 'emerald', 'purple']}
                yAxisWidth={60}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={[
                  { status: 'Submitted', count: 8 },
                  { status: 'Under Review', count: 4 },
                  { status: 'Approved', count: 3 },
                  { status: 'Rejected', count: 2 }
                ]}
                index="status"
                category="count"
                colors={['blue', 'yellow', 'green', 'red']}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => router.push('/opportunities')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Opportunities
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/grants')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Grants
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/ai-analysis')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/company-setup')}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Company Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/courses')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/analytics')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
