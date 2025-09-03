'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Users, 
  Settings, 
  CreditCard, 
  Award, 
  MapPin,
  Globe,
  Edit,
  Plus,
  Target,
  User,
  Save,
  X,
  ClipboardCheck
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BiddingChecklist from '@/components/company/BiddingChecklist'

interface Certification {
  id: string
  certification_name: string
  issuing_authority: string
  certification_number?: string
  issue_date?: string
  expiration_date?: string
  status: string
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  last_sign_in_at?: string
  created_at: string
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
    case 'trialing':
      return 'bg-blue-100 text-blue-800'
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800'
    case 'canceled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTierColor(tier: string) {
  switch (tier) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-800'
    case 'professional':
      return 'bg-blue-100 text-blue-800'
    case 'starter':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'company_owner':
      return 'bg-purple-100 text-purple-800'
    case 'admin':
      return 'bg-blue-100 text-blue-800'
    case 'team_member':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function CompanyPage() {
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [companyData, setCompanyData] = useState<any>({})
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      console.log('Loading company data...')
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('Current user:', currentUser)
      
      if (currentUser) {
        // Get company data - first try to get from user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, role')
          .eq('id', currentUser.id)
          .single()
        
        setUser({ ...currentUser, role: profile?.role })
        
        console.log('Profile data:', profile)
        
        if (profile?.company_id) {
          // Get company data using company_id from profile
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()
          
          console.log('Company data:', companyData)
          
          if (companyData) {
            setCompany(companyData)
            setCompanyData(companyData)
            
            // Load additional company data
            const companyId = companyData.id
            
            // Get team members
            const { data: teamMembers } = await supabase
              .from('profiles')
              .select('id, full_name, email, role, last_sign_in_at, created_at')
              .eq('company_id', companyId)
              .order('created_at', { ascending: false })

            // Get subscription
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('company_id', companyId)
              .single()

            // Get certifications
            const { data: certifications } = await supabase
              .from('certifications')
              .select('*')
              .eq('company_id', companyId)
              .order('created_at', { ascending: false })

            const finalData = {
              company: companyData,
              teamMembers: teamMembers || [],
              subscription: subscription || null,
              certifications: certifications || []
            }
            
            console.log('Final data:', finalData)
            setData(finalData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManage = user?.role === 'company_owner' || user?.role === 'admin'
  
  console.log('User role:', user?.role, 'Can manage:', canManage)

  const handleInputChange = (field: string, value: any) => {
    setCompanyData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const saveCompanyData = async () => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', company.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Company information updated successfully',
      })
      
      setEditing(false)
      await loadData() // Reload data
    } catch (error) {
      console.error('Error saving company data:', error)
      toast({
        title: 'Error',
        description: 'Failed to save company information',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  console.log('Render state:', { user, company, data, loading })

  if (!user || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Company Data</h2>
          <p className="text-gray-600">User: {user ? 'Loaded' : 'Not loaded'}</p>
          <p className="text-gray-600">Company: {company ? 'Loaded' : 'Not loaded'}</p>
          <p className="text-gray-600">Data: {data ? 'Loaded' : 'Not loaded'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600">
            Manage your company profile, team members, and subscription settings.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => setEditing(!editing)}>
              <Edit className="h-4 w-4 mr-2" />
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Company Settings</TabsTrigger>
          <TabsTrigger value="checklist">Bidding Checklist</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                    {canManage && (
                      <div className="flex gap-2">
                        {editing ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                              <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={saveCompanyData} disabled={saving}>
                              {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save</>}
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Company Name</Label>
                      {editing ? (
                        <Input
                          id="name"
                          value={companyData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter company name"
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{companyData.name || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      {editing ? (
                        <Select value={companyData.industry || ''} onValueChange={(value) => handleInputChange('industry', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Government">Government</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Construction">Construction</SelectItem>
                            <SelectItem value="Professional Services">Professional Services</SelectItem>
                            <SelectItem value="Consulting">Consulting</SelectItem>
                            <SelectItem value="Research & Development">Research & Development</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1">{companyData.industry || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      {editing ? (
                        <Select value={companyData.business_type || ''} onValueChange={(value) => handleInputChange('business_type', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Small Business">Small Business</SelectItem>
                            <SelectItem value="Large Business">Large Business</SelectItem>
                            <SelectItem value="Nonprofit">Nonprofit</SelectItem>
                            <SelectItem value="Educational Institution">Educational Institution</SelectItem>
                            <SelectItem value="Government Entity">Government Entity</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1">{companyData.business_type || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="companySize">Company Size</Label>
                      {editing ? (
                        <Select value={companyData.company_size || ''} onValueChange={(value) => handleInputChange('company_size', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                            <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                            <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                            <SelectItem value="201-500 employees">201-500 employees</SelectItem>
                            <SelectItem value="501-1000 employees">501-1000 employees</SelectItem>
                            <SelectItem value="1000+ employees">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1">{companyData.company_size || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    {editing ? (
                      <Textarea
                        id="description"
                        value={companyData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of your company..."
                        className="mt-1 min-h-24"
                      />
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed">{companyData.description || 'No description provided'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      {editing ? (
                        <Input
                          id="website"
                          value={companyData.website || ''}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://example.com"
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {companyData.website ? (
                            <a href={companyData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {companyData.website}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="headquarters">Headquarters</Label>
                      {editing ? (
                        <Input
                          id="headquarters"
                          value={companyData.headquarters_address || ''}
                          onChange={(e) => handleInputChange('headquarters_address', e.target.value)}
                          placeholder="City, State"
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{companyData.headquarters_address || 'Not specified'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members
                    </CardTitle>
                    {canManage && (
                      <Link href="/company/team">
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {data?.teamMembers?.map((member: TeamMember) => (
                      <div key={member.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRoleColor(member.role)}>
                            {member.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Last active: {member.last_sign_in_at ? formatDate(member.last_sign_in_at) : 'Never'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {formatDate(member.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Capabilities */}
              {(companyData.capabilities as string[])?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(companyData.capabilities as string[])?.map((capability: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Target Jurisdictions */}
              {(companyData.target_jurisdictions as string[])?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Target Jurisdictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(companyData.target_jurisdictions as string[])?.map((jurisdiction: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {jurisdiction}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Team Members</span>
                    <span className="font-medium">{data?.teamMembers?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Certifications</span>
                    <span className="font-medium">{data?.certifications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-medium">{companyData.created_at ? formatDate(companyData.created_at) : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Status */}
              {data?.subscription ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor(data.subscription.tier as string)}>
                        {(data.subscription.tier as string).toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(data.subscription.status as string)}>
                        {(data.subscription.status as string).toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Requests Used</span>
                        <span>{data.subscription.monthly_ai_requests_used as number} / {data.subscription.monthly_ai_requests_limit as number}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((data.subscription.monthly_ai_requests_used as number) / (data.subscription.monthly_ai_requests_limit as number)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {canManage && (
                      <Link href="/company/subscription">
                        <Button size="sm" className="w-full">
                          Manage Subscription
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">No active subscription found</p>
                      {canManage && (
                        <Link href="/company/subscription">
                          <Button size="sm">
                            Set Up Subscription
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canManage && (
                    <Link href="/company/team" className="w-full">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Team
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Bidding Checklist</h3>
              <p className="text-sm text-muted-foreground">Complete your compliance requirements for government contracting</p>
            </div>
          </div>
          
          <BiddingChecklist companyId={company.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Certifications</h3>
              <p className="text-sm text-muted-foreground">Manage your company certifications and compliance</p>
            </div>
            {canManage && (
              <Link href="/company/certifications">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </Link>
            )}
          </div>

          {data?.certifications?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certifications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your company certifications to improve your competitive advantage.
                </p>
                {canManage && (
                  <Link href="/company/certifications">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.certifications?.map((cert: Certification) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cert.certification_name}</CardTitle>
                        <CardDescription>{cert.issuing_authority}</CardDescription>
                      </div>
                      <Badge className={cert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {cert.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cert.certification_number && (
                        <div>
                          <label className="text-xs text-muted-foreground">Certificate Number</label>
                          <p className="text-sm font-mono">{cert.certification_number}</p>
                        </div>
                      )}
                      {cert.issue_date && (
                        <div>
                          <label className="text-xs text-muted-foreground">Issue Date</label>
                          <p className="text-sm">{formatDate(cert.issue_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Subscription Details</h3>
              <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
            </div>
            {canManage && (
              <Link href="/company/subscription">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </Link>
            )}
          </div>

          {data?.subscription ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getTierColor(data.subscription.tier as string)}>
                      {(data.subscription.tier as string).toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(data.subscription.status as string)}>
                      {(data.subscription.status as string).toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly AI Requests</span>
                      <span className="font-medium">{(data.subscription.monthly_ai_requests_limit as number).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Used This Month</span>
                      <span className="font-medium">{(data.subscription.monthly_ai_requests_used as number).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>AI Requests Used</span>
                        <span>{Math.round(((data.subscription.monthly_ai_requests_used as number) / (data.subscription.monthly_ai_requests_limit as number)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((data.subscription.monthly_ai_requests_used as number) / (data.subscription.monthly_ai_requests_limit as number)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subscription found</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your subscription to access premium features.
                </p>
                {canManage && (
                  <Link href="/company/subscription">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Up Subscription
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
