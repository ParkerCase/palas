import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/ai/analyze - Main AI analysis endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 });
    }

    let analysis;

    switch (type) {
      case 'opportunity':
        analysis = await analyzeOpportunity(data);
        break;
      case 'proposal':
        analysis = await generateProposal(data);
        break;
      case 'company':
        analysis = await analyzeCompany(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Store analysis in database
    const { error: dbError } = await supabase
      .from('ai_analyses')
      .insert({
        user_id: user.id,
        analysis_type: type,
        input_data: data,
        analysis_result: analysis,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway as analysis was successful
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('AI Analysis API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Analyze opportunity fit
async function analyzeOpportunity(opportunityData: any) {
  const {
    title,
    description,
    agency,
    amount,
    deadline,
    industry,
    location,
    requirements
  } = opportunityData;

  // Get user's company profile
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      company_id,
      companies (
        name,
        industry,
        size,
        location,
        description
      )
    `)
    .eq('user_id', user?.id)
    .single();

  const company = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies;

  // Simple scoring algorithm
  let score = 0;
  const reasons = [];
  const recommendations = [];

  // Industry match
  if (company?.industry && industry) {
    if (company.industry.toLowerCase() === industry.toLowerCase()) {
      score += 30;
      reasons.push('Perfect industry match');
    } else if (company.industry.toLowerCase().includes(industry.toLowerCase()) || 
               industry.toLowerCase().includes(company.industry.toLowerCase())) {
      score += 20;
      reasons.push('Good industry alignment');
    } else {
      score += 5;
      reasons.push('Industry mismatch - consider diversifying');
      recommendations.push('Consider expanding into this industry');
    }
  }

  // Location match
  if (company?.location && location) {
    if (company.location.toLowerCase().includes(location.toLowerCase()) || 
        location.toLowerCase().includes(company.location.toLowerCase())) {
      score += 25;
      reasons.push('Geographic advantage');
    } else {
      score += 10;
      reasons.push('Remote work opportunity');
      recommendations.push('Consider remote work capabilities');
    }
  }

  // Company size vs contract amount
  if (company?.size && amount) {
    const contractValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (contractValue < 100000 && company.size === 'Small') {
      score += 20;
      reasons.push('Appropriate contract size for company');
    } else if (contractValue < 1000000 && company.size === 'Medium') {
      score += 20;
      reasons.push('Good contract size match');
    } else if (contractValue >= 1000000 && company.size === 'Large') {
      score += 20;
      reasons.push('Large contract suitable for company size');
    } else {
      score += 10;
      reasons.push('Contract size may be challenging');
      recommendations.push('Consider teaming arrangements for large contracts');
    }
  }

  // Deadline analysis
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline > 30) {
      score += 15;
      reasons.push('Adequate time for proposal preparation');
    } else if (daysUntilDeadline > 14) {
      score += 10;
      reasons.push('Moderate timeline for proposal');
      recommendations.push('Start proposal preparation immediately');
    } else {
      score += 5;
      reasons.push('Tight deadline');
      recommendations.push('Consider if timeline is feasible');
    }
  }

  // Requirements analysis
  if (requirements && company?.description) {
    const requirementKeywords = requirements.toLowerCase().split(' ');
    const companyKeywords = company.description.toLowerCase().split(' ');
    const matches = requirementKeywords.filter((keyword: string) => 
      companyKeywords.some((companyKeyword: string) => 
        companyKeyword.includes(keyword) || keyword.includes(companyKeyword)
      )
    );
    
    if (matches.length > 0) {
      score += 10;
      reasons.push(`Matches ${matches.length} key requirements`);
    } else {
      recommendations.push('Review requirements and update company capabilities');
    }
  }

  // Overall assessment
  let assessment = '';
  if (score >= 80) {
    assessment = 'Excellent Match';
  } else if (score >= 60) {
    assessment = 'Good Match';
  } else if (score >= 40) {
    assessment = 'Moderate Match';
  } else {
    assessment = 'Poor Match';
  }

  return {
    score,
    assessment,
    reasons,
    recommendations,
    opportunity: {
      title,
      agency,
      amount,
      deadline,
      industry,
      location
    },
    company: {
      name: company?.name,
      industry: company?.industry,
      size: company?.size,
      location: company?.location
    }
  };
}

// Generate proposal content
async function generateProposal(proposalData: any) {
  const {
    opportunityTitle,
    opportunityDescription,
    companyName,
    companyStrengths,
    approach,
    timeline,
    budget
  } =proposalData;

  // Generate proposal sections
  const executiveSummary = `We are pleased to submit this proposal for ${opportunityTitle}. ${companyName} brings extensive experience and a proven track record in delivering high-quality solutions. Our approach focuses on ${approach} to ensure successful project completion within the specified timeline and budget.`;

  const technicalApproach = `Our technical approach includes:
• Comprehensive project planning and risk assessment
• Regular stakeholder communication and progress updates
• Quality assurance processes and deliverables review
• Scalable and maintainable solution architecture
• Integration with existing systems and workflows`;

  const projectTimeline = `Project Timeline:
• Phase 1: Planning and Requirements (${timeline?.planning || '2 weeks'})
• Phase 2: Development and Implementation (${timeline?.development || '8 weeks'})
• Phase 3: Testing and Quality Assurance (${timeline?.testing || '2 weeks'})
• Phase 4: Deployment and Training (${timeline?.deployment || '1 week'})
• Phase 5: Support and Maintenance (${timeline?.support || 'Ongoing'})`;

  const budgetBreakdown = `Budget Breakdown:
• Personnel Costs: $${budget?.personnel || 'TBD'}
• Materials and Equipment: $${budget?.materials || 'TBD'}
• Travel and Expenses: $${budget?.travel || 'TBD'}
• Contingency (10%): $${budget?.contingency || 'TBD'}
• Total Project Cost: $${budget?.total || 'TBD'}`;

  const companyQualifications = `Company Qualifications:
${companyStrengths?.map((strength: string) => `• ${strength}`).join('\n') || '• Experienced team with proven track record\n• Quality-focused approach\n• Strong client relationships\n• Innovative solutions'}`;

  return {
    executiveSummary,
    technicalApproach,
    projectTimeline,
    budgetBreakdown,
    companyQualifications,
    recommendations: [
      'Customize technical approach based on specific requirements',
      'Include relevant case studies and references',
      'Add detailed risk mitigation strategies',
      'Provide clear communication and reporting protocols'
    ]
  };
}

// Analyze company profile
async function analyzeCompany(companyData: any) {
  const {
    name,
    industry,
    size,
    location,
    description,
    yearsInBusiness,
    certifications,
    pastProjects
  } = companyData;

  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const threats = [];
  const recommendations = [];

  // Analyze company size
  if (size === 'Small') {
    strengths.push('Agile decision-making and flexibility');
    weaknesses.push('Limited resources and capacity');
    opportunities.push('Focus on niche markets and specialized services');
    threats.push('Competition from larger companies');
  } else if (size === 'Medium') {
    strengths.push('Balanced resources and experience');
    strengths.push('Established processes and procedures');
    opportunities.push('Expand into new markets and services');
  } else if (size === 'Large') {
    strengths.push('Extensive resources and capabilities');
    strengths.push('Established brand and reputation');
    threats.push('Bureaucracy and slower decision-making');
  }

  // Analyze industry
  if (industry) {
    if (['Technology', 'Healthcare', 'Construction', 'Manufacturing'].includes(industry)) {
      strengths.push(`Strong position in ${industry} sector`);
      opportunities.push('Government contracts in high-demand sectors');
    }
  }

  // Analyze location
  if (location) {
    if (location.includes('DC') || location.includes('Washington')) {
      strengths.push('Proximity to government agencies');
      opportunities.push('Direct access to federal contracting opportunities');
    } else {
      recommendations.push('Consider establishing presence in government hub areas');
    }
  }

  // Analyze certifications
  if (certifications && certifications.length > 0) {
    strengths.push(`Certified in ${certifications.join(', ')}`);
    opportunities.push('Leverage certifications for competitive advantage');
  } else {
    weaknesses.push('Limited certifications');
    recommendations.push('Pursue relevant industry certifications');
  }

  // Analyze past projects
  if (pastProjects && pastProjects.length > 0) {
    strengths.push(`Completed ${pastProjects.length} successful projects`);
    opportunities.push('Use past performance for future opportunities');
  } else {
    weaknesses.push('Limited project history');
    recommendations.push('Document and showcase completed projects');
  }

  // Overall assessment
  const totalScore = strengths.length * 10 - weaknesses.length * 5 + opportunities.length * 8 - threats.length * 3;
  
  let assessment = '';
  if (totalScore >= 50) {
    assessment = 'Strong Competitive Position';
  } else if (totalScore >= 30) {
    assessment = 'Good Competitive Position';
  } else if (totalScore >= 10) {
    assessment = 'Moderate Competitive Position';
  } else {
    assessment = 'Needs Improvement';
  }

  return {
    assessment,
    totalScore,
    strengths,
    weaknesses,
    opportunities,
    threats,
    recommendations,
    company: {
      name,
      industry,
      size,
      location,
      yearsInBusiness,
      certifications
    }
  };
} 