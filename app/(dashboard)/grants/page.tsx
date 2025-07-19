'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Filter, Calendar, DollarSign, Building2, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';

interface Grant {
  id: string;
  title: string;
  description: string;
  agency: string;
  category: string;
  amount: string;
  deadline: string;
  eligibility: string;
  requirements: string;
  status: string;
  created_at: string;
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    agency: '',
    category: '',
    amount: '',
    deadline: '',
    eligibility: '',
    requirements: ''
  });

  useEffect(() => {
    loadGrants();
  }, []);

  const loadGrants = async () => {
    try {
      const response = await fetch('/api/grants');
      if (response.ok) {
        const { grants } = await response.json();
        setGrants(grants || []);
      }
    } catch (error) {
      console.error('Error loading grants:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load grants'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const method = editingGrant ? 'PUT' : 'POST';
      const data = editingGrant ? { id: editingGrant.id, ...formData } : formData;
      
      const response = await fetch('/api/grants', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { grant } = await response.json();
        if (editingGrant) {
          setGrants(grants.map(g => g.id === grant.id ? grant : g));
        } else {
          setGrants([grant, ...grants]);
        }
        setMessage({
          type: 'success',
          text: editingGrant ? 'Grant updated successfully!' : 'Grant created successfully!'
        });
        resetForm();
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to save grant'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while saving'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grantId: string) => {
    if (!confirm('Are you sure you want to delete this grant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/grants?id=${grantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGrants(grants.filter(g => g.id !== grantId));
        setMessage({
          type: 'success',
          text: 'Grant deleted successfully'
        });
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to delete grant'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while deleting'
      });
    }
  };

  const handleEdit = (grant: Grant) => {
    setEditingGrant(grant);
    setFormData({
      title: grant.title,
      description: grant.description,
      agency: grant.agency,
      category: grant.category,
      amount: grant.amount,
      deadline: grant.deadline,
      eligibility: grant.eligibility,
      requirements: grant.requirements
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      agency: '',
      category: '',
      amount: '',
      deadline: '',
      eligibility: '',
      requirements: ''
    });
    setEditingGrant(null);
    setShowCreateForm(false);
  };

  const filteredGrants = grants.filter(grant => {
    const matchesSearch = grant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grant.agency.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || grant.category === categoryFilter;
    const matchesAgency = !agencyFilter || grant.agency === agencyFilter;
    
    return matchesSearch && matchesCategory && matchesAgency;
  });

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading grants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Grants Management</h1>
            </div>
            <p className="text-gray-600">
              Browse, create, and manage grant opportunities for your business.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Grant</span>
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search grants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Small Business">Small Business</SelectItem>
                  <SelectItem value="Innovation">Innovation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All agencies</SelectItem>
                  <SelectItem value="National Science Foundation">National Science Foundation</SelectItem>
                  <SelectItem value="Department of Energy">Department of Energy</SelectItem>
                  <SelectItem value="Department of Health and Human Services">Department of Health and Human Services</SelectItem>
                  <SelectItem value="Small Business Administration">Small Business Administration</SelectItem>
                  <SelectItem value="Department of Defense">Department of Defense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingGrant ? 'Edit Grant' : 'Create New Grant'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Grant Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter grant title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency *</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    placeholder="e.g., National Science Foundation"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the grant opportunity..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Small Business">Small Business</SelectItem>
                      <SelectItem value="Innovation">Innovation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., $150,000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligibility">Eligibility</Label>
                  <Textarea
                    id="eligibility"
                    value={formData.eligibility}
                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                    placeholder="Who is eligible to apply..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Application requirements..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingGrant ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingGrant ? 'Update Grant' : 'Create Grant'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grants List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Available Grants ({filteredGrants.length})
          </h2>
        </div>

        {filteredGrants.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No grants found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGrants.map((grant) => {
              const daysUntilDeadline = getDaysUntilDeadline(grant.deadline);
              const isUrgent = daysUntilDeadline <= 7;
              const isExpired = daysUntilDeadline < 0;

              return (
                <Card key={grant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{grant.title}</CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{grant.category}</Badge>
                          <Badge variant={isExpired ? 'destructive' : isUrgent ? 'secondary' : 'default'}>
                            {isExpired ? 'Expired' : isUrgent ? 'Urgent' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(grant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(grant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {grant.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{grant.agency}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{grant.amount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : ''}>
                          {isExpired 
                            ? `${Math.abs(daysUntilDeadline)} days ago`
                            : `${daysUntilDeadline} days left`
                          }
                        </span>
                      </div>
                    </div>

                    {grant.eligibility && (
                      <div className="text-sm">
                        <span className="font-medium">Eligibility:</span> {grant.eligibility}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 