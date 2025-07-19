export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany, User, Company } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  Target,
  Save,
  Send,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Opportunity {
  id: string
  title: string
  description: string
  agency: string
  due_date?: string
  estimated_value_min?: number
  estimated_value_max?: number
  solicitation_number?: string
  naics_codes?: string[]
  requirements?: string[]
  type: 'contract' | 'grant'
  status: 'active' | 'closed'
}

async function getOpportunity(opportunityId: string): Promise<Opportunity | null> {
  if (!opportunityId) return null
  
  const supabase = await createServerClient()
  
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single()

  if (error) {
    console.error('Error fetching opportunity:', error)
    return null
  }

  return opportunity as Opportunity
}

async function getRecentOpportunities(): Promise<Opportunity[]> {
  const supabase = await createServerClient()
  
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching opportunities:', error)
    return []
  }

  return opportunities as Opportunity[]
}

function formatCurrency(min?: number, max?: number) {
  if (!min && !max) return 'Not specified'
  if (min && max && min === max) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(min)
  }
  if (min && max) {
    return `${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(min)} - ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(max)}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(min || max || 0)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

interface ApplicationFormProps {
  opportunity: Opportunity | null
  user: User
  company: Company
}

function ApplicationForm({ opportunity, user, company }: ApplicationFormProps) {
  const formProgress = 25 // This would be calculated based on filled fields

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Application Progress</CardTitle>
              <CardDescription>Complete all sections to submit your application</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {formProgress}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={formProgress} className="h-2" />
          <div className="grid grid-cols-4 text-xs text-muted-foreground mt-2">
            <span className="font-medium text-blue-600">Basic Info</span>
            <span>Requirements</span>
            <span>Documents</span>
            <span>Review</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Requirements</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Review</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>
                Provide basic information about your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Application Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a descriptive title for your application"
                    defaultValue={opportunity ? `Application for ${opportunity.title}` : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Application Type</Label>
                  <Select defaultValue={opportunity?.type || 'contract'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select application type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="grant">Grant</SelectItem>
                      <SelectItem value="cooperative_agreement">Cooperative Agreement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="executive_summary">Executive Summary</Label>
                <Textarea
                  id="executive_summary"
                  placeholder="Provide a brief overview of your proposed solution..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_manager">Project Manager</Label>
                  <Input
                    id="project_manager"
                    placeholder="Name of the lead project manager"
                    defaultValue={`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_timeline">Estimated Timeline (months)</Label>
                  <Input
                    id="estimated_timeline"
                    type="number"
                    placeholder="12"
                    min="1"
                    max="120"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="approach">Technical Approach</Label>
                <Textarea
                  id="approach"
                  placeholder="Describe your technical approach and methodology..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Verify and update your company details for this application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    defaultValue={company.name}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="duns_number">DUNS Number</Label>
                  <Input
                    id="duns_number"
                    placeholder="Enter your DUNS number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cage_code">CAGE Code</Label>
                  <Input
                    id="cage_code"
                    placeholder="Enter your CAGE code"
                  />
                </div>
                <div>
                  <Label htmlFor="naics_primary">Primary NAICS Code</Label>
                  <Input
                    id="naics_primary"
                    placeholder="e.g., 541511"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_capabilities">Key Capabilities</Label>
                <Textarea
                  id="company_capabilities"
                  placeholder="Describe your company's key capabilities relevant to this opportunity..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Requirements</CardTitle>
              <CardDescription>
                Address all requirements specified in the opportunity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunity?.requirements && opportunity.requirements.length > 0 ? (
                <div className="space-y-4">
                  {opportunity.requirements.map((requirement, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">{requirement}</p>
                          <Textarea
                            placeholder="Describe how you will meet this requirement..."
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No specific requirements listed for this opportunity.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Review the opportunity description for general requirements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Upload all necessary documents for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button variant="outline">
                    Choose Files
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Commonly Required Documents:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Technical Proposal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Cost Proposal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Past Performance References</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Capability Statement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Certifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Financial Statements</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Review</CardTitle>
              <CardDescription>
                Review your application before submitting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Quality Score</h3>
                      <p className="text-2xl font-bold text-yellow-600">--%</p>
                      <p className="text-xs text-yellow-700">Complete sections to calculate</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Completeness</h3>
                      <p className="text-2xl font-bold text-blue-600">{formProgress}%</p>
                      <p className="text-xs text-blue-700">Sections completed</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-red-200 bg-red-50">
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Missing Items</h3>
                      <p className="text-2xl font-bold text-red-600">3</p>
                      <p className="text-xs text-red-700">Required items missing</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Pre-Submission Checklist:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Complete all required sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Upload all required documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Review for accuracy and completeness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Verify submission deadline</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button className="flex-1" disabled={formProgress < 100}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface OpportunitySelectionProps {
  opportunities: Opportunity[]
}

function OpportunitySelection({ opportunities }: OpportunitySelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select an Opportunity</CardTitle>
        <CardDescription>
          Choose an opportunity to create an application for, or browse all opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input placeholder="Search opportunities..." />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {opportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/applications/new?opportunity=${opportunity.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2 mb-2">
                          {opportunity.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{opportunity.agency}</span>
                          </div>
                          {opportunity.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(opportunity.due_date)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {opportunity.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={opportunity.type === 'grant' ? 'default' : 'secondary'}>
                          {opportunity.type.toUpperCase()}
                        </Badge>
                        <p className="text-sm font-medium mt-2">
                          {formatCurrency(opportunity.estimated_value_min, opportunity.estimated_value_max)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link href="/opportunities">
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Browse All Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function NewApplicationPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ opportunity?: string }> 
}) {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    redirect('/auth/login')
  }

  const resolvedSearchParams = await searchParams
  const opportunityId = resolvedSearchParams.opportunity
  const opportunity = opportunityId ? await getOpportunity(opportunityId) : null
  const recentOpportunities = await getRecentOpportunities()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/applications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {opportunity ? 'New Application' : 'Create Application'}
          </h1>
          <p className="text-gray-600">
            {opportunity 
              ? `Create an application for "${opportunity.title}"`
              : 'Select an opportunity to create an application for'
            }
          </p>
        </div>
      </div>

      {/* Selected Opportunity Info */}
      {opportunity && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                <CardDescription className="mt-1">
                  {opportunity.agency} • {opportunity.solicitation_number}
                </CardDescription>
              </div>
              <Badge variant={opportunity.type === 'grant' ? 'default' : 'secondary'}>
                {opportunity.type.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(opportunity.estimated_value_min, opportunity.estimated_value_max)}</span>
              </div>
              {opportunity.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {formatDate(opportunity.due_date)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{opportunity.requirements?.length || 0} requirements</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {opportunity ? (
        <ApplicationForm 
          opportunity={opportunity} 
          user={user} 
          company={company} 
        />
      ) : (
        <OpportunitySelection opportunities={recentOpportunities} />
      )}
    </div>
  )
}