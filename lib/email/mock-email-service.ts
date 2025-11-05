import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Mock Email Service - No external dependencies needed!
 * Logs emails to console and saves them to files for verification
 */

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export class MockEmailService {
  private defaultFrom = 'GovContractAI <noreply@govcontractai.com>'
  private emailLogDir = join(process.cwd(), 'test-logs')

  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const timestamp = new Date().toISOString()
      
      // Log to console
      console.log('\n' + '='.repeat(80))
      console.log('📧 MOCK EMAIL SENT')
      console.log('='.repeat(80))
      console.log(`From: ${template.from || this.defaultFrom}`)
      console.log(`To: ${Array.isArray(template.to) ? template.to.join(', ') : template.to}`)
      console.log(`Subject: ${template.subject}`)
      console.log(`Message ID: ${messageId}`)
      console.log(`Timestamp: ${timestamp}`)
      console.log('='.repeat(80))
      console.log('\n📝 EMAIL CONTENT (Text):')
      console.log('-'.repeat(80))
      console.log(template.text || 'No text version')
      console.log('-'.repeat(80))
      console.log('\n')

      // Save to file for verification
      const filename = `email_${messageId}.json`
      const filepath = join(this.emailLogDir, filename)
      
      const emailData = {
        messageId,
        timestamp,
        from: template.from || this.defaultFrom,
        to: template.to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        status: 'SENT (MOCK)'
      }

      writeFileSync(filepath, JSON.stringify(emailData, null, 2))
      
      // Also save HTML version for viewing in browser
      const htmlFilename = `email_${messageId}.html`
      const htmlFilepath = join(this.emailLogDir, htmlFilename)
      writeFileSync(htmlFilepath, template.html)

      console.log(`✅ Email logged to: ${filepath}`)
      console.log(`🌐 HTML version: ${htmlFilepath}`)
      console.log(`📬 Recipient: ${Array.isArray(template.to) ? template.to.join(', ') : template.to}`)
      console.log('\n')

      return { success: true, messageId }
    } catch (error) {
      console.error('❌ Mock Email Error:', error)
      return { success: false, error: 'Failed to send mock email' }
    }
  }

  async sendAdminOpportunityRequestNotification(
    requestId: string,
    companyName: string,
    industry: string,
    location: string,
    businessType: string,
    naicsCodes: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: 'parker@stroomai.com', // HARDCODED - Always sends here
      subject: `🎯 New Opportunity Request from ${companyName}`,
      html: this.getAdminNotificationHtml(requestId, companyName, industry, location, businessType, naicsCodes),
      text: this.getAdminNotificationText(requestId, companyName, industry, location, businessType, naicsCodes)
    }

    console.log('\n' + '🎯'.repeat(40))
    console.log('ADMIN NOTIFICATION EMAIL')
    console.log('🎯'.repeat(40))
    console.log(`Company: ${companyName}`)
    console.log(`Industry: ${industry}`)
    console.log(`Location: ${location}`)
    console.log(`Request ID: ${requestId}`)
    console.log('🎯'.repeat(40) + '\n')

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendOpportunitiesReadyEmail(
    email: string,
    firstName: string,
    companyName: string,
    opportunities: Array<{
      title: string
      agency: string
      matchScore: number
      deadline?: string
    }>
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: `🎉 We Found ${opportunities.length} Perfect Opportunities for ${companyName}!`,
      html: this.getOpportunitiesReadyHtml(firstName, companyName, opportunities),
      text: this.getOpportunitiesReadyText(firstName, companyName, opportunities)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  // HTML Templates
  private getAdminNotificationHtml(
    requestId: string,
    companyName: string,
    industry: string,
    location: string,
    businessType: string,
    naicsCodes: string[]
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Opportunity Request</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .company-details { background: #f9fafb; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px; }
    .value { color: #111827; }
    .button { background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #6d28d9; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .emoji { font-size: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎯</div>
      <h1>New Opportunity Request</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">A company is requesting contract opportunities</p>
    </div>
    
    <div class="content">
      <h2 style="color: #7c3aed; margin-top: 0;">Company Details</h2>
      
      <div class="company-details">
        <div class="detail-row">
          <span class="label">Company Name:</span>
          <span class="value"><strong>${companyName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="label">Industry:</span>
          <span class="value">${industry}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location:</span>
          <span class="value">${location}</span>
        </div>
        <div class="detail-row">
          <span class="label">Business Type:</span>
          <span class="value">${businessType}</span>
        </div>
        <div class="detail-row">
          <span class="label">NAICS Codes:</span>
          <span class="value">${naicsCodes.join(', ')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Request ID:</span>
          <span class="value"><code>${requestId}</code></span>
        </div>
      </div>
      
      <h3 style="color: #111827;">Next Steps</h3>
      <ol style="line-height: 1.8;">
        <li>Review the company profile in the admin panel</li>
        <li>Use Brave Search to find relevant opportunities</li>
        <li>Select the top 3-5 opportunities</li>
        <li>Approve and send to the company</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/opportunity-requests" class="button">
          View Request in Admin Panel
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>GovContractAI Admin Panel</strong></p>
      <p style="margin: 5px 0;">This email was sent to parker@stroomai.com</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getAdminNotificationText(
    requestId: string,
    companyName: string,
    industry: string,
    location: string,
    businessType: string,
    naicsCodes: string[]
  ): string {
    return `
🎯 NEW OPPORTUNITY REQUEST

Company Details:
================
Company Name: ${companyName}
Industry: ${industry}
Location: ${location}
Business Type: ${businessType}
NAICS Codes: ${naicsCodes.join(', ')}
Request ID: ${requestId}

Next Steps:
-----------
1. Review the company profile in the admin panel
2. Use Brave Search to find relevant opportunities
3. Select the top 3-5 opportunities
4. Approve and send to the company

View Request: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/opportunity-requests

---
This email was sent to parker@stroomai.com
GovContractAI Admin Panel
    `
  }

  private getOpportunitiesReadyHtml(
    firstName: string,
    companyName: string,
    opportunities: Array<{ title: string; agency: string; matchScore: number; deadline?: string }>
  ): string {
    const opportunityList = opportunities.map((opp, idx) => `
      <div style="border: 1px solid #e5e7eb; padding: 20px; margin: 15px 0; border-radius: 8px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #7c3aed; font-size: 18px;">${idx + 1}. ${opp.title}</h3>
          <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
            ${opp.matchScore}% Match
          </span>
        </div>
        <p style="margin: 8px 0; color: #6b7280;"><strong>Agency:</strong> ${opp.agency}</p>
        ${opp.deadline ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Deadline:</strong> ${opp.deadline}</p>` : ''}
      </div>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Opportunities Are Ready</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎉 Your Opportunities Are Ready!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">We found ${opportunities.length} perfect opportunities for ${companyName}</p>
    </div>
    
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>Great news! Our team has hand-selected the best government contract opportunities specifically for ${companyName}.</p>
      
      <h3 style="color: #059669; margin-top: 30px;">Your Top Opportunities</h3>
      ${opportunityList}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/my-opportunities" class="button">
          View All Opportunities
        </a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        These opportunities were selected based on your company profile, industry, and location.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>GovContractAI</strong></p>
      <p>Your AI-Powered Government Contracting Platform</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getOpportunitiesReadyText(
    firstName: string,
    companyName: string,
    opportunities: Array<{ title: string; agency: string; matchScore: number; deadline?: string }>
  ): string {
    const opportunityList = opportunities.map((opp, idx) => 
      `${idx + 1}. ${opp.title}\n   Agency: ${opp.agency}\n   Match: ${opp.matchScore}%${opp.deadline ? `\n   Deadline: ${opp.deadline}` : ''}`
    ).join('\n\n')

    return `
🎉 YOUR OPPORTUNITIES ARE READY!

Hi ${firstName},

Great news! Our team has hand-selected the best government contract opportunities specifically for ${companyName}.

YOUR TOP OPPORTUNITIES:
======================

${opportunityList}

View all opportunities: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/my-opportunities

These opportunities were selected based on your company profile, industry, and location.

---
GovContractAI - Your AI-Powered Government Contracting Platform
    `
  }
}

export const mockEmailService = new MockEmailService()
