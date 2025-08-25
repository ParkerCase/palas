export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Plus,
  Award,
  Calendar,
  Building2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash
} from 'lucide-react'
import Link from 'next/link'

interface Certification {
  id: string
  certification_name: string
  issuing_authority: string
  certification_number?: string
  issue_date?: string
  expiration_date?: string
  status: 'active' | 'expired' | 'pending'
  created_at: string
}

async function getCertifications(companyId: string) {
  const supabase = await createServerClient()

  try {
    const { data: certifications } = await supabase
      .from('certifications')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    return certifications || []
  } catch (error) {
    console.error('Error fetching certifications:', error)
    return []
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'expired':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4" />
    case 'expired':
      return <AlertTriangle className="h-4 w-4" />
    case 'pending':
      return <Calendar className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const commonCertifications = [
  { name: 'Service Disabled Veteran Own Company', authority: 'Service Disabled Veteran Own Company' },
  { name: 'Women Owned - Issued by the SBA', authority: 'Women Owned - Issued by the SBA' },
  { name: 'Micro - Business Enterprise', authority: 'Micro- Business Enterprise' },
  { name: 'Female Veteran Company', authority: 'Female Veteran Company' },
  { name: 'Veterans Owned Company', authority: 'Veterans Owned Company' },
  { name: 'Low Income Designation Business', authority: 'Low Income Designation Business' },
  { name: 'Solopreneur Designation', authority: 'Solopreneur Designation' }
 
]

export default async function CertificationsPage() {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const certifications = await getCertifications(company.id)
  const canManage = user.role === 'company_owner' || user.role === 'admin'

  // Separate certifications by status
  const activeCerts = certifications.filter(cert => cert.status === 'active')
  const expiredCerts = certifications.filter(cert => cert.status === 'expired')
  const pendingCerts = certifications.filter(cert => cert.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/company">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Company
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Company Certifications</h1>
          <p className="text-gray-600">
            Manage your company's certifications to improve competitive advantage and opportunity matching.
          </p>
        </div>
        {canManage && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{certifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{expiredCerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications List */}
      {certifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certifications yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your company certifications to improve your competitive advantage and opportunity matching.
            </p>
            
            <div className="max-w-2xl mx-auto">
              <h4 className="font-medium mb-4">Common Government Contracting Certifications:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                {commonCertifications.slice(0, 8).map((cert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded text-sm">
                    <Award className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-xs text-muted-foreground">{cert.authority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {canManage && (
              <Button className="mt-6">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Certification
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Certifications */}
          {activeCerts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Active Certifications ({activeCerts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCerts.map((cert) => (
                  <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            {cert.certification_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {cert.issuing_authority}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(cert.status)}>
                          {getStatusIcon(cert.status)}
                          {cert.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        {cert.certification_number && (
                          <div>
                            <span className="font-medium">Number:</span>
                            <span className="ml-2 font-mono">{cert.certification_number}</span>
                          </div>
                        )}
                        
                        {cert.issue_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Issued: {formatDate(cert.issue_date)}</span>
                          </div>
                        )}
                        
                        {cert.expiration_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Expires: {formatDate(cert.expiration_date)}</span>
                          </div>
                        )}
                      </div>
                      
                      {canManage && (
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Certifications */}
          {pendingCerts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                Pending Certifications ({pendingCerts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCerts.map((cert) => (
                  <Card key={cert.id} className="border-yellow-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{cert.certification_name}</CardTitle>
                          <CardDescription>{cert.issuing_authority}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(cert.status)}>
                          {getStatusIcon(cert.status)}
                          {cert.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">
                        Application in progress. Update status when certification is received.
                      </p>
                      
                      {canManage && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Update Status
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Expired Certifications */}
          {expiredCerts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Expired Certifications ({expiredCerts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiredCerts.map((cert) => (
                  <Card key={cert.id} className="border-red-200 opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{cert.certification_name}</CardTitle>
                          <CardDescription>{cert.issuing_authority}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(cert.status)}>
                          {getStatusIcon(cert.status)}
                          {cert.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {cert.expiration_date && (
                        <p className="text-sm text-red-600 mb-4">
                          Expired on {formatDate(cert.expiration_date)}
                        </p>
                      )}
                      
                      {canManage && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Renew
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
