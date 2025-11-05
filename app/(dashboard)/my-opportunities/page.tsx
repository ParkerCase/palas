'use client'

import { useAuth } from '../../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Target, ExternalLink, Calendar, 
  Building, Star, FileText, Sparkles, Loader2, CheckCircle2, XCircle
} from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  description: string
  agency: string
  source_url: string
  match_score: number
  admin_notes?: string
  submission_deadline?: string
  created_at: string
  application_id?: string
  application_status?: string
  acceptance_status?: 'pending' | 'accepted' | 'rejected' // New field for company acceptance
}

export default function MyOpportunitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [acceptingOpportunity, setAcceptingOpportunity] = useState<string | null>(null)
  const [rejectingOpportunity, setRejectingOpportunity] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!loading && user) {
      loadOpportunities()
    }
  }, [user, loading])

  const loadOpportunities = async () => {
    setLoadingData(true)
    try {
      // Get user's company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single()

      if (profileError || !profile) {
        console.error('Failed to load profile:', profileError)
        return
      }

      // Get opportunities recommended for this company
      const { data: opportunitiesData, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          applications!applications_opportunity_id_fkey(
            id,
            status,
            acceptance_status
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (oppError) {
        console.error('Failed to load opportunities:', oppError)
        toast({
          title: 'Error',
          description: 'Failed to load opportunities',
          variant: 'destructive'
        })
        return
      }

      // Transform data
      const transformedOpportunities: Opportunity[] = (opportunitiesData || []).map((opp: any) => {
        const application = Array.isArray(opp.applications) && opp.applications.length > 0 
          ? opp.applications[0] 
          : null

        return {
          id: opp.id,
          title: opp.title,
          description: opp.description || '',
          agency: opp.agency || 'Government Agency',
          source_url: opp.source_url || '',
          match_score: opp.match_score || 85,
          admin_notes: opp.admin_notes,
          submission_deadline: opp.submission_deadline,
          created_at: opp.created_at,
          application_id: application?.id,
          application_status: application?.status,
          acceptance_status: application?.acceptance_status || 'pending' // Default to pending
        }
      })

      setOpportunities(transformedOpportunities)

    } catch (error) {
      console.error('Error loading opportunities:', error)
      toast({
        title: 'Error',
        description: 'Failed to load opportunities',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleViewDetails = (opportunity: Opportunity) => {
    // Navigate to opportunity details or application
    if (opportunity.application_id) {
      router.push(`/applications/${opportunity.application_id}`)
    } else if (opportunity.source_url) {
      window.open(opportunity.source_url, '_blank')
    }
  }

  const handleAcceptOpportunity = async (opportunity: Opportunity) => {
    if (!opportunity.application_id) {
      toast({
        title: 'Error',
        description: 'Application not found for this opportunity',
        variant: 'destructive'
      })
      return
    }

    setAcceptingOpportunity(opportunity.id)

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          acceptance_status: 'accepted',
          accepted_at: new Date().toISOString(),
          status: 'accepted' // Update status to accepted
        })
        .eq('id', opportunity.application_id)

      if (error) throw error

      toast({
        title: 'Opportunity Accepted!',
        description: 'Our team will build out your contract for this opportunity.'
      })

      // Reload opportunities
      await loadOpportunities()
    } catch (error) {
      console.error('Error accepting opportunity:', error)
      toast({
        title: 'Error',
        description: 'Failed to accept opportunity',
        variant: 'destructive'
      })
    } finally {
      setAcceptingOpportunity(null)
    }
  }

  const handleRejectOpportunity = async (opportunity: Opportunity) => {
    if (!opportunity.application_id) {
      toast({
        title: 'Error',
        description: 'Application not found for this opportunity',
        variant: 'destructive'
      })
      return
    }

    setRejectingOpportunity(opportunity.id)

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          acceptance_status: 'rejected',
          status: 'rejected'
        })
        .eq('id', opportunity.application_id)

      if (error) throw error

      toast({
        title: 'Opportunity Rejected',
        description: 'This opportunity has been removed from your list.'
      })

      // Reload opportunities
      await loadOpportunities()
    } catch (error) {
      console.error('Error rejecting opportunity:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject opportunity',
        variant: 'destructive'
      })
    } finally {
      setRejectingOpportunity(null)
    }
  }

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      awarded: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your opportunities...</p>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">My Opportunities</h1>
              <Badge className="bg-blue-100 text-blue-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Hand-Selected
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/applications')}>
                My Applications
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">Review & Accept Opportunities</h2>
              <p className="text-blue-100">
                These opportunities have been hand-selected by our team based on your company profile. 
                Review each opportunity and accept the ones you'd like us to build contracts for. 
                Once accepted, our team will prepare your contract application.
              </p>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Opportunities Yet</h3>
              <p className="text-gray-600 mb-6">
                We haven't found any opportunities for you yet. Click the button below to request our team to search for opportunities.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                <Target className="h-4 w-4 mr-2" />
                Request Opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {opportunities.length} {opportunities.length === 1 ? 'Opportunity' : 'Opportunities'} Found
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {opportunities.map((opportunity) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{opportunity.title}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {opportunity.agency}
                          </div>
                          {opportunity.submission_deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {new Date(opportunity.submission_deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${getMatchColor(opportunity.match_score)} bg-opacity-10`}>
                          <Star className="h-3 w-3 mr-1" />
                          {opportunity.match_score}% Match
                        </Badge>
                        {opportunity.application_status && (
                          <Badge className={getStatusColor(opportunity.application_status)}>
                            {opportunity.application_status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {opportunity.description}
                    </p>

                    {opportunity.admin_notes && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Note from our team:</strong> {opportunity.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {opportunity.acceptance_status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleAcceptOpportunity(opportunity)}
                            disabled={acceptingOpportunity === opportunity.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {acceptingOpportunity === opportunity.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accept & Pay
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={() => handleRejectOpportunity(opportunity)}
                            disabled={rejectingOpportunity === opportunity.id}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {rejectingOpportunity === opportunity.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Not Interested
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      {opportunity.acceptance_status === 'accepted' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Accepted - Contract Building
                        </Badge>
                      )}
                      
                      {opportunity.acceptance_status === 'rejected' && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                      
                      <Button 
                        variant="outline"
                        onClick={() => handleViewDetails(opportunity)}
                      >
                        View Details
                      </Button>
                      {opportunity.source_url && (
                        <Button 
                          variant="ghost"
                          onClick={() => window.open(opportunity.source_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Source
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Added {new Date(opportunity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

