'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Target, FileText, Building2, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface AnalysisResult {
  score?: number;
  assessment?: string;
  reasons?: string[];
  recommendations?: string[];
  executiveSummary?: string;
  technicalApproach?: string;
  projectTimeline?: string;
  budgetBreakdown?: string;
  companyQualifications?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  totalScore?: number;
}

export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState('opportunity');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Opportunity Analysis Form
  const [opportunityData, setOpportunityData] = useState({
    title: '',
    description: '',
    agency: '',
    amount: '',
    deadline: '',
    industry: '',
    location: '',
    requirements: ''
  });

  // Proposal Generation Form
  const [proposalData, setProposalData] = useState({
    opportunityTitle: '',
    opportunityDescription: '',
    companyName: '',
    companyStrengths: '',
    approach: '',
    timeline: {
      planning: '2 weeks',
      development: '8 weeks',
      testing: '2 weeks',
      deployment: '1 week',
      support: 'Ongoing'
    },
    budget: {
      personnel: 'TBD',
      materials: 'TBD',
      travel: 'TBD',
      contingency: 'TBD',
      total: 'TBD'
    }
  });

  // Company Analysis Form
  const [companyData, setCompanyData] = useState({
    name: '',
    industry: '',
    size: '',
    location: '',
    description: '',
    yearsInBusiness: '',
    certifications: '',
    pastProjects: ''
  });

  const handleAnalysis = async (type: string, data: any) => {
    setLoading(true);
    setMessage(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
      });

      if (response.ok) {
        const { analysis } = await response.json();
        setResult(analysis);
        setMessage({
          type: 'success',
          text: 'Analysis completed successfully!'
        });
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to perform analysis'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred during analysis'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOpportunityAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Opportunity Title *</Label>
          <Input
            id="title"
            value={opportunityData.title}
            onChange={(e) => setOpportunityData({ ...opportunityData, title: e.target.value })}
            placeholder="e.g., Federal IT Services Contract"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency">Agency</Label>
          <Input
            id="agency"
            value={opportunityData.agency}
            onChange={(e) => setOpportunityData({ ...opportunityData, agency: e.target.value })}
            placeholder="e.g., Department of Defense"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={opportunityData.description}
          onChange={(e) => setOpportunityData({ ...opportunityData, description: e.target.value })}
          placeholder="Describe the opportunity..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Contract Amount</Label>
          <Input
            id="amount"
            value={opportunityData.amount}
            onChange={(e) => setOpportunityData({ ...opportunityData, amount: e.target.value })}
            placeholder="e.g., $500,000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={opportunityData.deadline}
            onChange={(e) => setOpportunityData({ ...opportunityData, deadline: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={opportunityData.industry} onValueChange={(value) => setOpportunityData({ ...opportunityData, industry: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Defense">Defense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea
          id="requirements"
          value={opportunityData.requirements}
          onChange={(e) => setOpportunityData({ ...opportunityData, requirements: e.target.value })}
          placeholder="List key requirements, certifications, or capabilities needed..."
          rows={3}
        />
      </div>

      <Button 
        onClick={() => handleAnalysis('opportunity', opportunityData)}
        disabled={loading || !opportunityData.title}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            Analyze Opportunity Fit
          </>
        )}
      </Button>
    </div>
  );

  const renderProposalGeneration = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="oppTitle">Opportunity Title *</Label>
          <Input
            id="oppTitle"
            value={proposalData.opportunityTitle}
            onChange={(e) => setProposalData({ ...proposalData, opportunityTitle: e.target.value })}
            placeholder="e.g., Federal IT Services Contract"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={proposalData.companyName}
            onChange={(e) => setProposalData({ ...proposalData, companyName: e.target.value })}
            placeholder="Your company name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyStrengths">Company Strengths</Label>
        <Textarea
          id="companyStrengths"
          value={proposalData.companyStrengths}
          onChange={(e) => setProposalData({ ...proposalData, companyStrengths: e.target.value })}
          placeholder="List your company's key strengths, capabilities, and experience..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="approach">Technical Approach</Label>
        <Textarea
          id="approach"
          value={proposalData.approach}
          onChange={(e) => setProposalData({ ...proposalData, approach: e.target.value })}
          placeholder="Describe your technical approach to the project..."
          rows={3}
        />
      </div>

      <Button 
        onClick={() => handleAnalysis('proposal', proposalData)}
        disabled={loading || !proposalData.opportunityTitle || !proposalData.companyName}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate Proposal
          </>
        )}
      </Button>
    </div>
  );

  const renderCompanyAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="compName">Company Name *</Label>
          <Input
            id="compName"
            value={companyData.name}
            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
            placeholder="Your company name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compIndustry">Industry</Label>
          <Select value={companyData.industry} onValueChange={(value) => setCompanyData({ ...companyData, industry: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Defense">Defense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="compSize">Company Size</Label>
          <Select value={companyData.size} onValueChange={(value) => setCompanyData({ ...companyData, size: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Small">Small (1-50)</SelectItem>
              <SelectItem value="Medium">Medium (51-500)</SelectItem>
              <SelectItem value="Large">Large (500+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="compLocation">Location</Label>
          <Input
            id="compLocation"
            value={companyData.location}
            onChange={(e) => setCompanyData({ ...companyData, location: e.target.value })}
            placeholder="e.g., Washington, DC"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compYears">Years in Business</Label>
          <Input
            id="compYears"
            value={companyData.yearsInBusiness}
            onChange={(e) => setCompanyData({ ...companyData, yearsInBusiness: e.target.value })}
            placeholder="e.g., 5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="compDescription">Company Description</Label>
        <Textarea
          id="compDescription"
          value={companyData.description}
          onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
          placeholder="Describe your company's capabilities, specialties, and experience..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="compCertifications">Certifications</Label>
          <Textarea
            id="compCertifications"
            value={companyData.certifications}
            onChange={(e) => setCompanyData({ ...companyData, certifications: e.target.value })}
            placeholder="List relevant certifications (comma-separated)"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compProjects">Past Projects</Label>
          <Textarea
            id="compProjects"
            value={companyData.pastProjects}
            onChange={(e) => setCompanyData({ ...companyData, pastProjects: e.target.value })}
            placeholder="Describe past relevant projects"
            rows={2}
          />
        </div>
      </div>

      <Button 
        onClick={() => handleAnalysis('company', companyData)}
        disabled={loading || !companyData.name}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-4 w-4" />
            Analyze Company
          </>
        )}
      </Button>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    if (activeTab === 'opportunity' && result.score !== undefined) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Opportunity Analysis Results</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={result.score >= 80 ? 'default' : result.score >= 60 ? 'secondary' : 'destructive'}>
                  Score: {result.score}/100
                </Badge>
                <Badge variant="outline">{result.assessment}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.reasons && result.reasons.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Why This Opportunity Fits:</h4>
                <ul className="space-y-1">
                  {result.reasons.map((reason, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeTab === 'proposal') {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Proposal Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.executiveSummary && (
              <div>
                <h4 className="font-semibold mb-2">Executive Summary</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{result.executiveSummary}</p>
              </div>
            )}
            {result.technicalApproach && (
              <div>
                <h4 className="font-semibold mb-2">Technical Approach</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{result.technicalApproach}</p>
              </div>
            )}
            {result.projectTimeline && (
              <div>
                <h4 className="font-semibold mb-2">Project Timeline</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{result.projectTimeline}</p>
              </div>
            )}
            {result.budgetBreakdown && (
              <div>
                <h4 className="font-semibold mb-2">Budget Breakdown</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{result.budgetBreakdown}</p>
              </div>
            )}
            {result.companyQualifications && (
              <div>
                <h4 className="font-semibold mb-2">Company Qualifications</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{result.companyQualifications}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeTab === 'company' && result.totalScore !== undefined) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Company Analysis Results</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={result.totalScore >= 50 ? 'default' : result.totalScore >= 30 ? 'secondary' : 'destructive'}>
                  Score: {result.totalScore}
                </Badge>
                <Badge variant="outline">{result.assessment}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.strengths && result.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">Strengths</h4>
                  <ul className="space-y-1">
                    {result.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.weaknesses && result.weaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">Weaknesses</h4>
                  <ul className="space-y-1">
                    {result.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.opportunities && result.opportunities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">Opportunities</h4>
                  <ul className="space-y-1">
                    {result.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.threats && result.threats.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">Threats</h4>
                  <ul className="space-y-1">
                    {result.threats.map((threat, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{threat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Brain className="h-6 w-6" />
          <h1 className="text-3xl font-bold">AI Analysis</h1>
        </div>
        <p className="text-gray-600">
          Get intelligent insights about opportunities, generate proposals, and analyze your company's competitive position.
        </p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="opportunity">Opportunity Analysis</TabsTrigger>
          <TabsTrigger value="proposal">Proposal Generation</TabsTrigger>
          <TabsTrigger value="company">Company Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunity">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Opportunity Fit</CardTitle>
              <CardDescription>
                Get AI-powered analysis of how well an opportunity matches your company's profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderOpportunityAnalysis()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposal">
          <Card>
            <CardHeader>
              <CardTitle>Generate Proposal Content</CardTitle>
              <CardDescription>
                Create professional proposal sections with AI assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProposalGeneration()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Company Profile</CardTitle>
              <CardDescription>
                Get a comprehensive SWOT analysis of your company's competitive position.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderCompanyAnalysis()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderResults()}
    </div>
  );
} 