'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Calendar, 
  Target, Mail, CheckCircle, AlertCircle, Info} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
}

export default function RequestOpportunitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [requestType, setRequestType] = useState('')
  const [description, setDescription] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [locationPreference, setLocationPreference] = useState('')
  const [industryFocus, setIndustryFocus] = useState('')
  const [recentRequests, setRecentRequests] = useState<OpportunityRequest[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const loadCompanyProfile = async () => {
    try {
      setLoadingData(true)
      
      if (!user) {
        console.log('No user found, skipping profile load')
        return
      }

      // Get user's profile to find company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profile?.company_id) {
        // Get company data
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (companyData) {
          setCompanyProfile(companyData)
          
          // Load recent opportunity requests
          const { data: requests } = await supabase
            .from('opportunity_requests')
            .select('*')
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false })
            .limit(5)

          if (requests) {
            setRecentRequests(requests)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load company profile:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!user || !companyProfile) {
      toast({
        title: 'Error',
        description: 'Please complete your company profile first',
        variant: 'destructive'})
      return
    }

    if (!requestType || !description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'})
      return
    }

    try {
      setSubmitting(true)

      // Create opportunity request in database
      const { data: request, error } = await supabase
        .from('opportunity_requests')
        .insert({
          user_id: user.id,
          company_id: companyProfile.id,
          request_type: requestType,
          description: description,
          budget_range: budgetRange,
          location_preference: locationPreference,
          industry_focus: industryFocus,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send notification email to admin
      await fetch('/api/opportunities/request-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({
          requestId: request.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
          companyName: companyProfile.name,
          requestType: requestType,
          description: description,
          budgetRange: budgetRange,
          locationPreference: locationPreference,
          industryFocus: industryFocus,
          companyProfile: {
            industry: companyProfile.industry,
            businessType: companyProfile.business_type,
            companySize: companyProfile.company_size,
            headquarters: companyProfile.headquarters_address,
            naicsCodes: companyProfile.naics_codes,
            annualRevenue: companyProfile.annual_revenue,
            yearsInBusiness: companyProfile.years_in_business,
            employeeCount: companyProfile.employee_count
          }
        })
      })

      toast({
        title: 'Request Submitted',
        description: 'Your opportunity request has been submitted. We\'ll notify you when matching opportunities are found.'})

      // Reset form
      setRequestType('')
      setDescription('')
      setBudgetRange('')
      setLocationPreference('')
      setIndustryFocus('')

      // Reload recent requests
      await loadCompanyProfile()

    } catch (error) {
      console.error('Failed to submit request:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive'})
    } finally {
      setSubmitting(false)
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
              <h1 className="text-2xl font-bold text-gray-900">Request Opportunities</h1>
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
      </header> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Section */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">How It Works</h2>
                <p className="text-blue-800 mb-3">
                  Submit a request for specific types of opportunities, and our team will source it directly too you where you can pre-fill the applications for easy submission.
                </p>
                {/* <div className="flex items-center text-blue-700 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>We'll manually submit your applications to MatchAwards.com</span>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Request New Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="requestType">Type of Opportunity *</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select opportunity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government_contracts">Government Contracts</SelectItem>
                    <SelectItem value="grants">Federal Grants</SelectItem>
                    <SelectItem value="sbir_sttr">SBIR/STTR Programs</SelectItem>
                    <SelectItem value="cooperative_agreements">Cooperative Agreements</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description of Needs *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the specific opportunities you're looking for, your capabilities, and any requirements..."
                  className="mt-1 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="budgetRange">Budget Range</Label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_100k">Under $100,000</SelectItem>
                    <SelectItem value="100k_500k">$100,000 - $500,000</SelectItem>
                    <SelectItem value="500k_1m">$500,000 - $1,000,000</SelectItem>
                    <SelectItem value="1m_5m">$1,000,000 - $5,000,000</SelectItem>
                    <SelectItem value="over_5m">Over $5,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="locationPreference">Location Preference</Label>
                <Select value={locationPreference} onValueChange={setLocationPreference}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="california">California</SelectItem>
                    <SelectItem value="california_counties">California Counties</SelectItem>
                    <SelectItem value="nationwide">Nationwide</SelectItem>
                    <SelectItem value="specific_states">Specific States(Specify State in Description Above)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industryFocus">Industry Focus</Label>
                <Select value={industryFocus} onValueChange={setIndustryFocus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select industry focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="professional_services">Professional Services</SelectItem>
                    <SelectItem value="research_development">Research & Development</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSubmitRequest} 
                disabled={submitting || !requestType || !description}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Company Profile & Recent Requests */}
          <div className="space-y-6">
            {/* Company Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Your Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companyProfile ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                      <p className="text-sm">{companyProfile.name}</p>
                    </div>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/company')}
                      className="mt-3"
                    >
                      Update Profile
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Please complete your company profile first</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/company')}
                      className="mt-2"
                    >
                      Set Up Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{request.request_type.replace('_', ' ')}</h4>
                          <p className="text-xs text-gray-600 mt-1">{request.description.substring(0, 60)}...</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No requests yet</p>
                    <p className="text-xs text-gray-500">Submit your first opportunity request above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
