import { NextRequest, NextResponse } from 'next/server'
import { processAIQueue } from '@/lib/ai-queue-processor'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🤖 Starting AI queue processing...')
    
    await processAIQueue()
    
    console.log('✅ AI queue processing completed')
    
    return NextResponse.json({ 
      success: true, 
      message: 'AI queue processed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI queue processing failed:', error)
    
    return NextResponse.json({
      error: 'AI queue processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const manual = searchParams.get('manual')
    
    if (manual !== 'true') {
      return NextResponse.json({ error: 'Manual trigger required' }, { status: 400 })
    }

    console.log('🤖 Manual AI queue processing triggered...')
    
    await processAIQueue()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Manual AI queue processing completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Manual AI queue processing failed:', error)
    
    return NextResponse.json({
      error: 'Manual AI queue processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
