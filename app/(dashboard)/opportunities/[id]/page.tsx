export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building2, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface OpportunityDetails {
  id: string
  title: string
  description: string
  organization: string
  department: string
  postedDate: string
  deadline: string
  awardAmount?: string
  location?: string
  naicsCodes?: string[]
  setAside?: string
  contact?: {
    fullName: string
    email: string
    phone: string
  }
  links?: Array<{
    rel: string
    href: string
  }>
  source: string
  type: string
  realDataSource?: string
  note?: string
  estimatedAwards?: number
  applicationDeadline?: string
}

async function getOpportunityDetails(opportunityId: string): Promise<OpportunityDetails | null> {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/api/opportunities/${opportunityId}`, {
      cache: 'no-store',
      headers
    })

    if (!response.ok) {
      console.error('Failed to fetch opportunity details:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.success) {
      return data.opportunity
    } else {
      console.error('API returned error:', data.error)
      return null
    }
  } catch (error) {
    console.error('Error fetching opportunity details:', error)
    return null
  }
}

function formatDate(dateString: string) {
  if (!dateString || dateString === 'TBD' || dateString === 'See contract details') {
    return dateString
  }
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

function getUrgencyLevel(deadline: string) {
  if (!deadline || deadline === 'TBD' || deadline === 'See contract details') {
    return 'unknown'
  }
  
  try {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (daysUntil < 0) return 'expired'
    if (daysUntil <= 7) return 'urgent'
    if (daysUntil <= 30) return 'soon'
    return 'normal'
  } catch {
    return 'unknown'
  }
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'expired': return 'bg-red-100 text-red-800'
    case 'urgent': return 'bg-orange-100 text-orange-800'
    case 'soon': return 'bg-yellow-100 text-yellow-800'
    case 'normal': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getSourceIcon(source: string) {
  switch (source.toLowerCase()) {
    case 'usaspending.gov':
      return <Building2 className="h-4 w-4" />
    case 'grants.gov':
      return <FileText className="h-4 w-4" />
    default:
      return <Building2 className="h-4 w-4" />
  }
}

export default async function OpportunityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const resolvedParams = await params
  const opportunity = await getOpportunityDetails(resolvedParams.id)

  if (!opportunity) {
    notFound()
  }

  const urgency = getUrgencyLevel(opportunity.deadline)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/opportunities">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {getSourceIcon(opportunity.source)}
          <Badge variant="outline">{opportunity.source}</Badge>
          {opportunity.realDataSource && (
            <Badge variant="secondary">Live Data</Badge>
          )}
        </div>
      </div>

      {/* Title and Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{opportunity.title}</CardTitle>
              <CardDescription className="text-base">
                {opportunity.organization} - {opportunity.department}
              </CardDescription>
            </div>
            <Badge className={getUrgencyColor(urgency)}>
              {urgency === 'expired' && 'Expired'}
              {urgency === 'urgent' && 'Due Soon'}
              {urgency === 'soon' && 'Due This Month'}
              {urgency === 'normal' && 'Open'}
              {urgency === 'unknown' && 'Check Details'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{opportunity.description}</p>
          
          {opportunity.note && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">{opportunity.note}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Posted Date</span>
            </div>
            <p className="text-lg">{formatDate(opportunity.postedDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Deadline</span>
            </div>
            <p className="text-lg">{formatDate(opportunity.deadline)}</p>
          </CardContent>
        </Card>

        {opportunity.awardAmount && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Award Amount</span>
              </div>
              <p className="text-lg">{opportunity.awardAmount}</p>
            </CardContent>
          </Card>
        )}

        {opportunity.location && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-lg">{opportunity.location}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NAICS Codes */}
        {opportunity.naicsCodes && opportunity.naicsCodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NAICS Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {opportunity.naicsCodes.map((code, index) => (
                  <Badge key={index} variant="outline">
                    {code}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Set-Aside Information */}
        {opportunity.setAside && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Set-Aside Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{opportunity.setAside}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {opportunity.contact && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>{opportunity.contact.fullName}</span>
              </div>
              {opportunity.contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{opportunity.contact.email}</span>
                </div>
              )}
              {opportunity.contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{opportunity.contact.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Links */}
        {opportunity.links && opportunity.links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {opportunity.links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="capitalize">{link.rel} Details</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href={`/applications/new?opportunity=${opportunity.id}`}>
          <Button size="lg" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Start Application
          </Button>
        </Link>
        <Button variant="outline" size="lg">
          Save for Later
        </Button>
        {opportunity.links?.[0] && (
          <Button
            variant="outline"
            size="lg"
            asChild
            className="flex items-center gap-2"
          >
            <a href={opportunity.links[0].href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View Original
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}