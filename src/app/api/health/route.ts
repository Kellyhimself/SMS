import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/config'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test Supabase connection
    const supabase = createServerSupabaseClient()
    
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('schools')
      .select('count', { count: 'exact', head: true })
      .limit(1)

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        responseTime
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'All systems operational',
      database: 'connected',
      responseTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    }, { status: 500 })
  }
} 