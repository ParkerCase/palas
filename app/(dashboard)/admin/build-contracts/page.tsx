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
  FileText, Building, Calendar, CheckCircle2, 
  Crown, Loader2, ExternalLink, Briefcase, Star,
  Mail, Phone, MapPin, Award, Hash, Globe, DollarSign
} from 'lucide-react'
import { ADMIN_EMAILS } from '@/lib/config/admin'

interface CompanyProfile {
  id: string
  name: string
  industry: string | null
  business_type: string | null
  company_size: string | null
  website: string | null
  headquarters_address: any | null
  naics_codes: string[] | null
  certifications: string[] | null
  capabilities: string[] | null
  duns_number: string | null
  cage_code: string | null
  tax_id: string | null
  description: string | null
  founded_year: number | null
  annual_revenue: string | null
}

interface UserProfile {
  email: string
  full_name: string | null
  phone: string | null
  title: string | null
}

interface AcceptedOpportunity {
  id: string
  title: string
  description: string
  agency: string
  source_url: string
  match_score: number
  company: CompanyProfile
  accepted_at: string
  application_id: string
  user: UserProfile
}

export default function AdminBuildContractsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [acceptedOpportunities, setAcceptedOpportunities] = useState<AcceptedOpportunity[]>([])
  const [loadingData, setLoadingData] = useState(true)
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

    loadAcceptedOpportunities()
  }

  const loadAcceptedOpportunities = async () => {
    setLoadingData(true)
    try {
      // Get all applications with accepted status - fetch FULL company profile
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          acceptance_status,
          accepted_at,
          opportunities!applications_opportunity_id_fkey(
            id,
            title,
            description,
            agency,
            source_url,
            match_score
          ),
          companies!applications_company_id_fkey(
            id,
            name,
            industry,
            business_type,
            company_size,
            website,
            headquarters_address,
            naics_codes,
            certifications,
            capabilities,
            duns_number,
            cage_code,
            tax_id,
            description,
            founded_year,
            annual_revenue
          ),
          profiles!applications_created_by_fkey(
            email,
            full_name,
            phone,
            title
          )
        `)
        .eq('acceptance_status', 'accepted')
        .order('accepted_at', { ascending: false })

      if (error) throw error

      // Transform data with full company profile
      const transformed: AcceptedOpportunity[] = (applications || [])
        .filter((app: any) => app.opportunities && app.companies)
        .map((app: any) => ({
          id: app.opportunities.id,
          title: app.opportunities.title,
          description: app.opportunities.description || '',
          agency: app.opportunities.agency || 'Government Agency',
          source_url: app.opportunities.source_url || '',
          match_score: app.opportunities.match_score || 85,
          company: app.companies as CompanyProfile,
          accepted_at: app.accepted_at,
          application_id: app.id,
          user: {
            email: app.profiles?.email || '',
            full_name: app.profiles?.full_name || null,
            phone: app.profiles?.phone || null,
            title: app.profiles?.title || null
          } as UserProfile
        }))

      setAcceptedOpportunities(transformed)
    } catch (error) {
      console.error('Failed to load accepted opportunities:', error)
      toast({
        title: 'Error',
        description: 'Failed to load accepted opportunities',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleStartContractBuilding = (opportunity: AcceptedOpportunity) => {
    // Navigate to application details/edit page
    router.push(`/applications/${opportunity.application_id}/edit`)
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
              <h1 className="text-2xl font-bold text-gray-900">Build Contracts</h1>
              <Badge className="bg-green-100 text-green-800">
                <Briefcase className="h-3 w-3 mr-1" />
                Accepted Opportunities
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/admin/review-opportunities')}>
                Review Opportunities
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <Briefcase className="h-6 w-6 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">Accepted Opportunities - Ready for Contract Building</h2>
              <p className="text-green-100">
                These opportunities have been accepted by companies. Your team can now build out the contracts 
                and prepare applications for submission.
              </p>
            </div>
          </div>
        </div>

        {/* Accepted Opportunities List */}
        {acceptedOpportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Accepted Opportunities Yet</h3>
              <p className="text-gray-600 mb-6">
                Companies will accept opportunities they want to pursue, and they'll appear here for your team to build contracts.
              </p>
              <Button onClick={() => router.push('/admin/review-opportunities')}>
                Review Pending Requests
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {acceptedOpportunities.length} Accepted {acceptedOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {acceptedOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{opportunity.title}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {opportunity.agency}
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p><strong>Company:</strong> {opportunity.company.name}</p>
                          <p><strong>Contact:</strong> {opportunity.user.full_name || opportunity.user.email}</p>
                          {opportunity.user.phone && (
                            <p><strong>Phone:</strong> {opportunity.user.phone}</p>
                          )}
                          <p><strong>Accepted:</strong> {new Date(opportunity.accepted_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${opportunity.match_score >= 80 ? 'text-green-600' : 'text-blue-600'} bg-opacity-10`}>
                          <Star className="h-3 w-3 mr-1" />
                          {opportunity.match_score}% Match
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-6 line-clamp-3">
                      {opportunity.description}
                    </p>

                    {/* Company Profile Section - Full Details for Contract Building */}
                    <div className="border-t pt-4 mt-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company Profile Data (For Contract Building)
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* Basic Info */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-500">Industry</p>
                              <p className="font-medium">{opportunity.company.industry || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          {opportunity.company.business_type && (
                            <div className="flex items-start gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500">Business Type</p>
                                <p className="font-medium">{opportunity.company.business_type}</p>
                              </div>
                            </div>
                          )}
                          
                          {opportunity.company.company_size && (
                            <div className="flex items-start gap-2">
                              <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500">Company Size</p>
                                <p className="font-medium">{opportunity.company.company_size}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contact & Location */}
                        <div className="space-y-2">
                          {opportunity.company.website && (
                            <div className="flex items-start gap-2">
                              <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500">Website</p>
                                <a href={opportunity.company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                                  {opportunity.company.website}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {opportunity.company.headquarters_address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">
                                  {typeof opportunity.company.headquarters_address === 'object' 
                                    ? `${opportunity.company.headquarters_address.city || ''}${opportunity.company.headquarters_address.city && opportunity.company.headquarters_address.state ? ', ' : ''}${opportunity.company.headquarters_address.state || ''}`
                                    : opportunity.company.headquarters_address
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {opportunity.company.annual_revenue && (
                            <div className="flex items-start gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500">Annual Revenue</p>
                                <p className="font-medium">{opportunity.company.annual_revenue}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Government IDs */}
                        {(opportunity.company.duns_number || opportunity.company.cage_code || opportunity.company.tax_id) && (
                          <div className="space-y-2">
                            <p className="text-gray-500 font-semibold mb-2">Government IDs</p>
                            {opportunity.company.duns_number && (
                              <div>
                                <p className="text-gray-500">DUNS Number</p>
                                <p className="font-medium">{opportunity.company.duns_number}</p>
                              </div>
                            )}
                            {opportunity.company.cage_code && (
                              <div>
                                <p className="text-gray-500">CAGE Code</p>
                                <p className="font-medium">{opportunity.company.cage_code}</p>
                              </div>
                            )}
                            {opportunity.company.tax_id && (
                              <div>
                                <p className="text-gray-500">Tax ID</p>
                                <p className="font-medium">{opportunity.company.tax_id}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* NAICS Codes */}
                        {opportunity.company.naics_codes && opportunity.company.naics_codes.length > 0 && (
                          <div>
                            <p className="text-gray-500 font-semibold mb-2">NAICS Codes</p>
                            <div className="flex flex-wrap gap-2">
                              {opportunity.company.naics_codes.map((code) => (
                                <Badge key={code} variant="outline" className="font-mono">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Certifications */}
                        {opportunity.company.certifications && opportunity.company.certifications.length > 0 && (
                          <div>
                            <p className="text-gray-500 font-semibold mb-2 flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Certifications
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {opportunity.company.certifications.map((cert) => (
                                <Badge key={cert} className="bg-blue-100 text-blue-800">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Capabilities */}
                        {opportunity.company.capabilities && opportunity.company.capabilities.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-gray-500 font-semibold mb-2">Capabilities</p>
                            <div className="flex flex-wrap gap-2">
                              {opportunity.company.capabilities.map((cap) => (
                                <Badge key={cap} variant="secondary">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-gray-500 font-semibold mb-2">Primary Contact</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{opportunity.user.email}</span>
                          </div>
                          {opportunity.user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{opportunity.user.phone}</span>
                            </div>
                          )}
                          {opportunity.user.title && (
                            <div className="text-gray-600">
                              {opportunity.user.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleStartContractBuilding(opportunity)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Build Contract
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/applications/${opportunity.application_id}`)}
                      >
                        View Application
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

