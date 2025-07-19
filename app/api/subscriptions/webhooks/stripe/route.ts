import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

// TODO: Add your Stripe secret key to .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    const supabase = await createServerClient()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePayment(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }
}

async function handleSubscriptionUpdate(
  subscription: unknown,
  supabase: any
): Promise<void> {
  const subscriptionData = subscription as {
    metadata?: {
      company_id?: string;
      plan_id?: string;
    };
    id?: string;
    status?: string;
    current_period_start?: number;
    current_period_end?: number;
    trial_end?: number;
    cancel_at_period_end?: boolean;
  }
  const companyId = subscriptionData.metadata?.company_id
  const planId = subscriptionData.metadata?.plan_id

  // Map plan IDs to display names
  const planNameMap: Record<string, string> = {
    'price_starter_TODO': 'Starter',
    'price_pro_TODO': 'Professional',
    'price_enterprise_TODO': 'Enterprise',
  }

  const planName = planId ? planNameMap[planId] || 'Unknown' : 'Unknown'

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .upsert({
      company_id: companyId,
      stripe_subscription_id: subscriptionData.id,
      plan: planName,
      status: subscriptionData.status,
      current_period_start: subscriptionData.current_period_start ? new Date(subscriptionData.current_period_start * 1000).toISOString() : new Date().toISOString(),
      current_period_end: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_end: subscriptionData.trial_end ? new Date(subscriptionData.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscriptionData.cancel_at_period_end || false,
    })

  // Update company subscription status
  await supabase
    .from('companies')
    .update({
      subscription_plan: planName,
      subscription_status: subscriptionData.status,
    })
    .eq('id', companyId)
}

async function handleSubscriptionCancellation(
  subscription: unknown,
  supabase: any
): Promise<void> {
  const subscriptionData = subscription as {
    metadata?: {
      company_id?: string;
    };
    id?: string;
  }
  const companyId = subscriptionData.metadata?.company_id

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionData.id)

  // Update company subscription status
  await supabase
    .from('companies')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', companyId)
}

async function handleInvoicePayment(
  invoice: unknown,
  supabase: any
): Promise<void> {
  // Handle subscription invoice payments
  const invoiceData = invoice as {
    subscription?: string;
  }
  if (invoiceData.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription)
    await handleSubscriptionUpdate(subscription, supabase)
  }
}

async function handleInvoicePaymentFailed(
  invoice: unknown,
  supabase: any
): Promise<void> {
  // Handle failed payments
  const invoiceData = invoice as {
    subscription?: string;
  }
  if (invoiceData.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription)
    
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscription.id)

    await supabase
      .from('companies')
      .update({ subscription_status: 'past_due' })
      .eq('id', subscription.metadata.company_id)
  }
} 