export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  User, 
  Shield,
  Award,
  Building2,
  ArrowLeft,
  Settings,
  Edit,
  Trash,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

interface TeamMember {
  id: string
  full_name: string
  email: string
  phone?: string
  role: string
  department?: string
  title?: string
  security_clearance?: string
  certifications?: string[]
  skills?: string[]
  experience_years?: number
  last_sign_in_at?: string
  created_at: string
  status: 'active' | 'inactive' | 'pending'
  contract_access_level?: 'basic' | 'full' | 'admin'
}

async function getTeamData(companyId: string) {
  const supabase = await createServerClient()

  try {
    // Get team members
    const { data: teamMembers } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        department,
        title,
        security_clearance,
        certifications,
        skills,
        experience_years,
        last_sign_in_at,
        created_at,
        status,
        contract_access_level
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    return {
      teamMembers: teamMembers || []
    }
  } catch (error) {
    console.error('Error fetching team data:', error)
    return {
      teamMembers: []
    }
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getRoleColor(role: string) {
  switch (role) {
    case 'company_owner':
      return 'bg-purple-100 text-purple-800'
    case 'admin':
      return 'bg-blue-100 text-blue-800'
    case 'team_member':
      return 'bg-green-100 text-green-800'
    case 'project_manager':
      return 'bg-orange-100 text-orange-800'
    case 'technical_lead':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getClearanceColor(clearance: string) {
  switch (clearance) {
    case 'Top Secret':
      return 'bg-red-100 text-red-800'
    case 'Secret':
      return 'bg-orange-100 text-orange-800'
    case 'Confidential':
      return 'bg-yellow-100 text-yellow-800'
    case 'Public Trust':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function TeamPage() {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const data = await getTeamData(company.id)
  const canManage = user.role === 'company_owner' || user.role === 'admin'

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
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">
            Manage your team members, roles, and access levels for government contracting.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{data.teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">With Clearance</p>
                <p className="text-2xl font-bold">
                  {data.teamMembers.filter(m => m.security_clearance).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Certified</p>
                <p className="text-2xl font-bold">
                  {data.teamMembers.filter(m => m.certifications && m.certifications.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {data.teamMembers.filter(m => m.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="clearance">Security Clearance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{member.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{member.title || 'Team Member'}</p>
                        {member.department && (
                          <p className="text-xs text-muted-foreground">{member.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Security Clearance */}
                    {member.security_clearance && (
                      <div>
                        <div className="text-sm font-medium mb-1">Security Clearance:</div>
                        <Badge className={getClearanceColor(member.security_clearance)}>
                          {member.security_clearance}
                        </Badge>
                      </div>
                    )}

                    {/* Experience */}
                    {member.experience_years && (
                      <div className="text-sm">
                        <span className="font-medium">Experience:</span> {member.experience_years} years
                      </div>
                    )}

                    {/* Skills */}
                    {member.skills && member.skills.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.skills.slice(0, 3).map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {member.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {member.certifications && member.certifications.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Certifications:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.certifications.slice(0, 2).map((cert: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                          {member.certifications.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{member.certifications.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Access Level */}
                    {member.contract_access_level && (
                      <div className="text-sm">
                        <span className="font-medium">Contract Access:</span> {member.contract_access_level.toUpperCase()}
                      </div>
                    )}

                    {/* Last Activity */}
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Last active: {member.last_sign_in_at ? formatDate(member.last_sign_in_at) : 'Never'}
                      {' • '}
                      Joined: {formatDate(member.created_at)}
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Permissions
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.teamMembers
              .filter(member => member.status === 'active')
              .map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{member.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{member.title || member.role}</p>
                      </div>
                      <Badge className={getRoleColor(member.role)}>
                        {member.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.teamMembers
              .filter(member => member.status === 'pending')
              .map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <Button size="sm">Approve</Button>
                          <Button size="sm" variant="outline">Decline</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {data.teamMembers.filter(member => member.status === 'pending').length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
                <p className="text-muted-foreground">All team members have been processed.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clearance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.teamMembers
              .filter(member => member.security_clearance)
              .map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{member.title || member.role}</p>
                        </div>
                      </div>
                      <Badge className={getClearanceColor(member.security_clearance!)}>
                        {member.security_clearance}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {data.teamMembers.filter(member => member.security_clearance).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No security clearances on file</h3>
                <p className="text-muted-foreground">Add security clearance information to team member profiles.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {data.teamMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-4">
              Invite team members to collaborate on government contracts and proposals.
            </p>
            {canManage && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite First Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
