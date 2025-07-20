import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Stripe integration coming soon!',
      message: 'Subscription management will be available in a future update.',
      subscription: null
    },
    { status: 501 }
  )
} 