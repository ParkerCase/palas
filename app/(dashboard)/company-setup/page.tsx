'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function CompanySetupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    location: '',
    description: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkExistingCompany();
  }, []);

  const checkExistingCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/companies');
      if (response.ok) {
        const { company } = await response.json();
        setCompany(company);
        setFormData({
          name: company.name || '',
          industry: company.industry || '',
          size: company.size || '',
          location: company.location || '',
          description: company.description || ''
        });
      }
    } catch (error) {
      console.error('Error checking company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const method = company ? 'PUT' : 'POST';
      const response = await fetch('/api/companies', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { company: updatedCompany } = await response.json();
        setCompany(updatedCompany);
        setMessage({
          type: 'success',
          text: company ? 'Company updated successfully!' : 'Company created successfully!'
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to save company information'
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

  const handleDelete = async () => {
    if (!company || !confirm('Are you sure you want to delete your company? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCompany(null);
        setFormData({
          name: '',
          industry: '',
          size: '',
          location: '',
          description: ''
        });
        setMessage({
          type: 'success',
          text: 'Company deleted successfully'
        });
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to delete company'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while deleting'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading company information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6" />
            <div>
              <CardTitle>
                {company ? 'Update Company Profile' : 'Setup Your Company'}
              </CardTitle>
              <CardDescription>
                {company 
                  ? 'Update your company information to improve opportunity matching'
                  : 'Tell us about your company to get personalized government contract opportunities'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Defense">Defense</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small (1-50 employees)</SelectItem>
                  <SelectItem value="Medium">Medium (51-500 employees)</SelectItem>
                  <SelectItem value="Large">Large (500+ employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Washington, DC or United States"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your company's capabilities, specialties, and experience..."
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {company ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  company ? 'Update Company' : 'Create Company'
                )}
              </Button>
              
              {company && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete Company
                </Button>
              )}
            </div>
          </form>

          {company && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Current Company Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {company.name}
                </div>
                <div>
                  <span className="font-medium">Industry:</span> {company.industry || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {company.size || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {company.location || 'Not specified'}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span> {company.description || 'No description provided'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 