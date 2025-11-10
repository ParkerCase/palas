'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, Filter, Building, 
  Target, Eye,
  Plus, Settings, Crown, Loader2, CheckCircle2, ExternalLink, Lock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OpportunityRequest {
  id: string
  user_id: string
  company_id: string
  request_type: string
  description: string
  budget_range: string
  location_preference: string
  industry_focus: string
  status: string
  created_at: string
  user_email?: string
  company_name?: string
  user_name?: string
}

interface CompanyProfile {
  id: string
  name: string
  industry: string
  business_type: string
  company_size: string
  headquarters_address: string
  naics_codes?: string[]
  annual_revenue?: string
  years_in_business?: string
  employee_count?: string
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

const ADMIN_PASSWORD = 'UnoBrothers4Life'

export default function AdminOpportunityRequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [requests, setRequests] = useState<OpportunityRequest[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<OpportunityRequest | null>(null)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [showAddOpportunity, setShowAddOpportunity] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<number>>(new Set())
  const [searchingOpportunities, setSearchingOpportunities] = useState(false)
  const [approvingOpportunities, setApprovingOpportunities] = useState(false)
  const [braveSearchQuery, setBraveSearchQuery] = useState('')
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    agency: '',
    amount: '',
    deadline: '',
    source: 'matchawards'
  })
  const supabase = createClientComponentClient()

  const loadRequests = async () => {
    try {
      setLoadingData(true)
      
      // Use API endpoint to bypass RLS restrictions
      const response = await fetch('/api/admin/opportunity-requests')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to load requests`)
      }
      
      const data = await response.json()
      console.log('Loaded requests:', data.requests?.length || 0)

      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to load requests:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load opportunity requests',
        variant: 'destructive'})
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem('admin_opportunity_requests_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      // Load requests after component mounts
      setTimeout(() => {
        loadRequests()
      }, 100)
    } else {
      // Ensure modal shows if not authenticated
      setIsAuthenticated(false)
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_opportunity_requests_authenticated', 'true')
      setPasswordError(false)
      loadRequests()
    } else {
      setPasswordError(true)
      setPassword('')
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

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_requests')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Status Updated',
        description: `Request status updated to ${status}`})

      // Reload requests
      await loadRequests()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update request status',
        variant: 'destructive'})
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
        setBraveSearchQuery(data.query || '')
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

  const handleApproveOpportunities = async () => {
    if (!selectedRequest || selectedOpportunities.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one opportunity',
        variant: 'destructive'
      })
      return
    }

    setApprovingOpportunities(true)

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
          description: `Approved ${data.opportunities_created} opportunities and notified the company`
        })
        
        // Reset state
        setSearchResults([])
        setSelectedOpportunities(new Set())
        setSelectedRequest(null)
        
        // Reload requests
        await loadRequests()
      } else {
        throw new Error(data.error || 'Failed to approve opportunities')
      }
    } catch (error) {
      console.error('Error approving opportunities:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve opportunities',
        variant: 'destructive'
      })
    } finally {
      setApprovingOpportunities(false)
    }
  }

  const addOpportunityForUser = async () => {
    if (!selectedRequest || !newOpportunity.title || !newOpportunity.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'})
      return
    }

    try {
      // Create new opportunity in database
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          title: newOpportunity.title,
          description: newOpportunity.description,
          agency: newOpportunity.agency,
          amount: parseFloat(newOpportunity.amount) || 0,
          deadline: newOpportunity.deadline,
          source: newOpportunity.source,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create application for the user
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          company_id: selectedRequest.company_id,
          opportunity_id: opportunity.id,
          status: 'draft',
          created_at: new Date().toISOString()
        })

      if (appError) throw appError

      toast({
        title: 'Opportunity Added',
        description: 'Opportunity has been added and application created for the user'})

      setShowAddOpportunity(false)
      setNewOpportunity({
        title: '',
        description: '',
        agency: '',
        amount: '',
        deadline: '',
        source: 'matchawards'
      })
      setSelectedRequest(null)

    } catch (error) {
      console.error('Failed to add opportunity:', error)
      toast({
        title: 'Error',
        description: 'Failed to add opportunity',
        variant: 'destructive'})
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request_type?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Dialog open={true}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Admin Access Required
              </DialogTitle>
              <DialogDescription>
                Please enter the password to access the opportunity requests panel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError(false)
                    }}
                    placeholder="Enter password"
                    className={passwordError ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500">Incorrect password. Please try again.</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  Access Panel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (loadingData) {
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
              <h1 className="text-2xl font-bold text-gray-900">Opportunity Requests</h1>
              <Badge className="bg-purple-100 text-purple-800">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/admin/review-opportunities')}>
                Review & Approve
              </Button>
              <Button variant="ghost" onClick={() => router.push('/admin')}>
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search requests by description, user, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Opportunity Requests ({filteredRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                      <p className="text-gray-600">No opportunity requests match your current filters</p>
                    </div>
                  ) : (
                    filteredRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedRequest?.id === request.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedRequest(request)
                          loadCompanyProfile(request.company_id)
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{request.user_name || request.user_email}</p>
                            <p className="text-xs text-gray-500">{request.company_name}</p>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {request.request_type.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {request.description.substring(0, 100)}...
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {request.budget_range && (
                            <span>Budget: {request.budget_range}</span>
                          )}
                          {request.location_preference && (
                            <span>Location: {request.location_preference}</span>
                          )}
                          {request.industry_focus && (
                            <span>Industry: {request.industry_focus}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Details & Actions */}
          <div className="space-y-6">
            {selectedRequest ? (
              <>
                {/* Request Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Request Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">User</Label>
                      <p className="text-sm">{selectedRequest.user_name || selectedRequest.user_email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Company</Label>
                      <p className="text-sm">{selectedRequest.company_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Request Type</Label>
                      <p className="text-sm">{selectedRequest.request_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm">{selectedRequest.description}</p>
                    </div>
                    {selectedRequest.budget_range && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Budget Range</Label>
                        <p className="text-sm">{selectedRequest.budget_range}</p>
                      </div>
                    )}
                    {selectedRequest.location_preference && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Location Preference</Label>
                        <p className="text-sm">{selectedRequest.location_preference}</p>
                      </div>
                    )}
                    {selectedRequest.industry_focus && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Industry Focus</Label>
                        <p className="text-sm">{selectedRequest.industry_focus}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Company Profile */}
                {companyProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Company Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Industry</Label>
                        <p className="text-sm">{companyProfile.industry}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Business Type</Label>
                        <p className="text-sm">{companyProfile.business_type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Company Size</Label>
                        <p className="text-sm">{companyProfile.company_size}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Headquarters</Label>
                        <p className="text-sm">{companyProfile.headquarters_address}</p>
                      </div>
                      {companyProfile.naics_codes && companyProfile.naics_codes.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">NAICS Codes</Label>
                          <p className="text-sm">{companyProfile.naics_codes.join(', ')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Update Status</Label>
                      <Select 
                        value={selectedRequest.status} 
                        onValueChange={(value) => updateRequestStatus(selectedRequest.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleSearchOpportunities}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={searchingOpportunities}
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

                    {searchResults.length > 0 && (
                      <Button 
                        onClick={handleApproveOpportunities}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={approvingOpportunities || selectedOpportunities.size === 0}
                      >
                        {approvingOpportunities ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve & Send ({selectedOpportunities.size})
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => setShowAddOpportunity(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manual Opportunity
                    </Button>
                  </CardContent>
                </Card>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Search Results ({searchResults.length})
                      </CardTitle>
                      {braveSearchQuery && (
                        <p className="text-xs text-gray-500 mt-1">Query: {braveSearchQuery}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <div 
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedOpportunities.has(index)
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleOpportunitySelection(index)}
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox 
                                checked={selectedOpportunities.has(index)}
                                onCheckedChange={() => toggleOpportunitySelection(index)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900 mb-1">
                                  {result.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {result.description || result.snippet}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {result.domain}
                                  </Badge>
                                  {result.score && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      Score: {result.score}
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
                                    View
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Request</h3>
                  <p className="text-gray-600">Click on a request to view details and take actions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add Opportunity Modal */}
        {showAddOpportunity && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Opportunity for User</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Opportunity Title *</Label>
                  <Input
                    id="title"
                    value={newOpportunity.title}
                    onChange={(e) => setNewOpportunity({...newOpportunity, title: e.target.value})}
                    placeholder="Enter opportunity title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newOpportunity.description}
                    onChange={(e) => setNewOpportunity({...newOpportunity, description: e.target.value})}
                    placeholder="Enter opportunity description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="agency">Agency</Label>
                  <Input
                    id="agency"
                    value={newOpportunity.agency}
                    onChange={(e) => setNewOpportunity({...newOpportunity, agency: e.target.value})}
                    placeholder="Enter agency name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newOpportunity.amount}
                    onChange={(e) => setNewOpportunity({...newOpportunity, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newOpportunity.deadline}
                    onChange={(e) => setNewOpportunity({...newOpportunity, deadline: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button 
                  onClick={addOpportunityForUser}
                  disabled={!newOpportunity.title || !newOpportunity.description}
                >
                  Add Opportunity
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddOpportunity(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
