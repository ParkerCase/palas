import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Stripe integration coming soon!',
      message: 'Webhook processing will be available in a future update.',
      received: false
    },
    { status: 501 }
  )
} 