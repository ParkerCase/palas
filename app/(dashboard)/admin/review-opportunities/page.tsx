'use client'

import { useAuth } from '../../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Target, ExternalLink, Calendar, 
  Building, Star, FileText, Sparkles, Loader2, CheckCircle2, Search, Crown
} from 'lucide-react'
import { ADMIN_EMAILS } from '@/lib/config/admin'

interface OpportunityRequest {
  id: string
  user_id: string
  company_id: string
  request_type: string
  description: string
  location_preference: string
  industry_focus: string
  status: string
  created_at: string
  search_query_used?: string
  search_results?: any
  user_email?: string
  company_name?: string
  user_name?: string
}

interface SearchResult {
  title: string
  url: string
  description: string
  snippet?: string
  domain?: string
  score?: number
  rank?: number
}

interface CompanyProfile {
  id: string
  name: string
  industry: string
  business_type: string
  headquarters_address: any
}

export default function AdminReviewOpportunitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [requests, setRequests] = useState<OpportunityRequest[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<OpportunityRequest | null>(null)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<number>>(new Set())
  const [searchingOpportunities, setSearchingOpportunities] = useState(false)
  const [sendingOpportunities, setSendingOpportunities] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!loading && user) {
      checkAdminAccess()
    }
  }, [user, loading])

  const checkAdminAccess = async () => {
    if (!user?.email) return

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase() as any)
    
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive'
      })
      router.push('/dashboard')
      return
    }

    loadRequests()
  }

  const loadRequests = async () => {
    try {
      setLoadingData(true)
      
      const { data: requestsData, error } = await supabase
        .from('opportunity_requests')
        .select(`
          *,
          profiles!opportunity_requests_user_id_fkey(email, full_name),
          companies!opportunity_requests_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedRequests = requestsData?.map((req: any) => ({
        ...req,
        user_email: req.profiles?.email,
        user_name: req.profiles?.full_name,
        company_name: req.companies?.name
      })) || []

      setRequests(transformedRequests)
    } catch (error) {
      console.error('Failed to load requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to load opportunity requests',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const loadCompanyProfile = async (companyId: string) => {
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (companyData) {
        setCompanyProfile(companyData)
      }
    } catch (error) {
      console.error('Failed to load company profile:', error)
    }
  }

  const handleSearchOpportunities = async () => {
    if (!selectedRequest) return

    setSearchingOpportunities(true)
    setSearchResults([])
    setSelectedOpportunities(new Set())

    try {
      const response = await fetch('/api/admin/search-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          companyId: selectedRequest.company_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.results || [])
        toast({
          title: 'Search Complete',
          description: `Found ${data.results?.length || 0} opportunities`
        })
      } else {
        throw new Error(data.error || 'Failed to search opportunities')
      }
    } catch (error) {
      console.error('Error searching opportunities:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to search opportunities',
        variant: 'destructive'
      })
    } finally {
      setSearchingOpportunities(false)
    }
  }

  const toggleOpportunitySelection = (index: number) => {
    const newSelection = new Set(selectedOpportunities)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      if (newSelection.size >= 5) {
        toast({
          title: 'Maximum Selection',
          description: 'You can select up to 5 opportunities',
          variant: 'destructive'
        })
        return
      }
      newSelection.add(index)
    }
    setSelectedOpportunities(newSelection)
  }

  const handleSendToCompany = async () => {
    if (!selectedRequest || selectedOpportunities.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one opportunity',
        variant: 'destructive'
      })
      return
    }

    setSendingOpportunities(true)

    try {
      const selectedResults = Array.from(selectedOpportunities).map(index => {
        const result = searchResults[index]
        return {
          title: result.title,
          url: result.url,
          description: result.description || result.snippet || '',
          agency: result.domain,
          source_data: result
        }
      })

      const response = await fetch('/api/admin/approve-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          companyId: selectedRequest.company_id,
          selectedOpportunities: selectedResults
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success!',
          description: `Sent ${data.opportunities_created} opportunities to company`
        })
        
        // Reset state
        setSearchResults([])
        setSelectedOpportunities(new Set())
        setSelectedRequest(null)
        
        // Reload requests
        await loadRequests()
      } else {
        throw new Error(data.error || 'Failed to send opportunities')
      }
    } catch (error) {
      console.error('Error sending opportunities:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send opportunities',
        variant: 'destructive'
      })
    } finally {
      setSendingOpportunities(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase() as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Review & Approve Opportunities</h1>
              <Badge className="bg-purple-100 text-purple-800">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/admin/build-contracts')}>
                Build Contracts
              </Button>
              <Button variant="ghost" onClick={() => router.push('/admin/opportunity-requests')}>
                All Requests
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requests.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No pending requests</p>
                  ) : (
                    requests
                      .filter(r => r.status === 'pending')
                      .map((request) => (
                        <div
                          key={request.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedRequest?.id === request.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedRequest(request)
                            loadCompanyProfile(request.company_id)
                            setSearchResults([])
                            setSelectedOpportunities(new Set())
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{request.company_name}</p>
                          <p className="text-xs text-gray-600">{request.location_preference}</p>
                          <p className="text-xs text-gray-500 mt-1">{request.industry_focus}</p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRequest ? (
              <>
                {/* Request Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {selectedRequest.company_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Industry</p>
                        <p className="font-medium">{selectedRequest.industry_focus}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium">{selectedRequest.location_preference}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Requested By</p>
                        <p className="font-medium">{selectedRequest.user_name || selectedRequest.user_email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <Badge className={getStatusColor(selectedRequest.status)}>
                          {selectedRequest.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Search & Results */}
                {searchResults.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Search</h3>
                      <p className="text-gray-600 mb-4">
                        Click the button below to search for opportunities matching this company's profile.
                      </p>
                      <Button
                        onClick={handleSearchOpportunities}
                        disabled={searchingOpportunities}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {searchingOpportunities ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Search Opportunities
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Search Results */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Search Results ({searchResults.length})
                          </CardTitle>
                          {selectedOpportunities.size > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              {selectedOpportunities.size} selected
                            </Badge>
                          )}
                        </div>
                        {selectedRequest.search_query_used && (
                          <p className="text-xs text-gray-500 mt-1">
                            Query: {selectedRequest.search_query_used}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedOpportunities.has(index)
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleOpportunitySelection(index)}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={selectedOpportunities.has(index)}
                                  onCheckedChange={() => toggleOpportunitySelection(index)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-sm text-gray-900">
                                      {result.title}
                                    </h4>
                                    {result.score && (
                                      <Badge
                                        className={`${
                                          result.score >= 80
                                            ? 'bg-green-100 text-green-800'
                                            : result.score >= 60
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                        } text-xs`}
                                      >
                                        Score: {result.score}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {result.description || result.snippet}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      {result.domain || 'Unknown'}
                                    </Badge>
                                    {(result.domain?.includes('.gov') || result.url.includes('.gov')) && (
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                                        .gov
                                      </Badge>
                                    )}
                                    <a
                                      href={result.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View Source
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Send Button */}
                    {selectedOpportunities.size > 0 && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {selectedOpportunities.size} opportunity{selectedOpportunities.size !== 1 ? 'ies' : ''} selected
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                These will be sent to {selectedRequest.company_name}
                              </p>
                            </div>
                            <Button
                              onClick={handleSendToCompany}
                              disabled={sendingOpportunities}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {sendingOpportunities ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Send to Company ({selectedOpportunities.size})
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Request</h3>
                  <p className="text-gray-600">
                    Choose a pending request from the list to review and approve opportunities
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

