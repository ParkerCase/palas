// Stripe integration coming soon - placeholder implementation
export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  monthlyPrice: number
  annualPrice: number
  features: string[]
  maxUsers: number
  allowedJurisdictions: string[]
  stripePriceIdMonthly: string
  stripePriceIdAnnual: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      'Federal opportunities only',
      '1 user',
      'Basic AI analysis',
      'Email support',
      '10 applications per month'
    ],
    maxUsers: 1,
    allowedJurisdictions: ['federal'],
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdAnnual: 'price_starter_annual'
  },
  {
    id: 'professional',
    name: 'Professional',
    tier: 'professional',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      'Federal + State opportunities',
      '5 users',
      'Advanced AI analysis',
      'Priority support',
      'Unlimited applications',
      'Win probability scoring',
      'Competitor research'
    ],
    maxUsers: 5,
    allowedJurisdictions: ['federal', 'state'],
    stripePriceIdMonthly: 'price_professional_monthly',
    stripePriceIdAnnual: 'price_professional_annual'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    monthlyPrice: 999,
    annualPrice: 9990,
    features: [
      'All jurisdictions (Federal, State, Local)',
      '25 users',
      'Premium AI analysis',
      'Dedicated support',
      'Custom integrations',
      'Advanced analytics',
      'Team collaboration tools',
      'API access'
    ],
    maxUsers: 25,
    allowedJurisdictions: ['federal', 'state', 'local'],
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdAnnual: 'price_enterprise_annual'
  }
]

export class PaymentService {
  async createCustomer(
    email: string,
    companyName: string,
    companyId: string
  ): Promise<string> {
    throw new Error('Stripe integration coming soon! Payment processing will be available in a future update.')
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    companyId: string,
    tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  ): Promise<{ clientSecret: string; subscriptionId: string }> {
    throw new Error('Stripe integration coming soon! Subscription management will be available in a future update.')
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    throw new Error('Stripe integration coming soon! Subscription cancellation will be available in a future update.')
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  ): Promise<void> {
    throw new Error('Stripe integration coming soon! Subscription updates will be available in a future update.')
  }

  async createCommissionPayment(
    companyId: string,
    applicationId: string,
    contractValue: number,
    commissionRate: number
  ): Promise<{ paymentIntentId: string; clientSecret: string }> {
    throw new Error('Stripe integration coming soon! Commission payments will be available in a future update.')
  }

  async processWebhook(
    body: string,
    signature: string
  ): Promise<void> {
    throw new Error('Stripe integration coming soon! Webhook processing will be available in a future update.')
  }

  async getSubscriptionUsage(companyId: string): Promise<{
    currentUsers: number
    maxUsers: number
    opportunitiesViewed: number
    applicationsSubmitted: number
    aiCreditsUsed: number
  }> {
    // Return placeholder data for now
    return {
      currentUsers: 1,
      maxUsers: 5,
      opportunitiesViewed: 0,
      applicationsSubmitted: 0,
      aiCreditsUsed: 0
    }
  }
}

// Export a singleton instance
export const paymentService = new PaymentService()
