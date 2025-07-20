import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Stripe integration coming soon!',
      message: 'Payment processing will be available in a future update.'
    },
    { status: 501 }
  )
} 