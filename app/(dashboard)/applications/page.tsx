'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react'

interface Application {
  id: string
  opportunity_id: string
  status: string
  estimated_value: number
  submitted_at: string
  created_at: string
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // TESTING MODE: Skip auth redirect
    /*
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadApplications()
    }
    */
    if (user) {
      loadApplications()
    }
  }, [user, loading, router])

  const loadApplications = async () => {
    if (!user) return
    
    try {
      // Mock application data for testing
      const mockApplications = [
        {
          id: 'app-001',
          opportunity_id: 'opp-001',
          status: 'submitted',
          estimated_value: 2500000,
          submitted_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: 'app-002',
          opportunity_id: 'opp-002',
          status: 'under_review',
          estimated_value: 1800000,
          submitted_at: '2024-01-20T10:00:00Z',
          created_at: '2024-01-18T10:00:00Z'
        },
        {
          id: 'app-003',
          opportunity_id: 'opp-003',
          status: 'approved',
          estimated_value: 5200000,
          submitted_at: '2024-01-25T10:00:00Z',
          created_at: '2024-01-22T10:00:00Z'
        }
      ]
      
      setApplications(mockApplications)
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
      {/* <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button onClick={() => router.push('/opportunities')}>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bidded Opportunities</h2>
          <p className="text-gray-600">
            Track your government contract and grant applications
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-6">
                Start by finding opportunities that match your business
              </p>
              <Button onClick={() => router.push('/opportunities')}>
                <Plus className="h-4 w-4 mr-2" />
                Request Opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Application #{application.id.slice(0, 8)}
                        </h3>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${(application.estimated_value / 1000000 || 0).toFixed(1)}M
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created: {new Date(application.created_at).toLocaleDateString()}
                        </div>
                        {application.submitted_at && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push(`/applications/${application.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
