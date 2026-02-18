import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()

  try {
    const databaseProvider = process.env.DATABASE_PROVIDER || 'supabase'

    // For Azure PostgreSQL
    if (databaseProvider === 'azure') {
      const { Pool } = await import('pg')

      const pool = new Pool({
        host: process.env.AZURE_POSTGRES_HOST,
        database: process.env.AZURE_POSTGRES_DATABASE,
        user: process.env.AZURE_POSTGRES_USER,
        password: process.env.AZURE_POSTGRES_PASSWORD,
        port: parseInt(process.env.AZURE_POSTGRES_PORT || '5432'),
        ssl: process.env.AZURE_POSTGRES_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false,
        max: 1, // Only 1 connection for health check
        connectionTimeoutMillis: 5000,
      })

      try {
        // Test connection with simple query
        const result = await pool.query('SELECT 1 as health_check')
        await pool.end()

        const endTime = Date.now()
        const responseTime = endTime - startTime

        return NextResponse.json({
          status: 'healthy',
          message: 'All systems operational',
          database: 'connected',
          provider: 'azure-postgresql',
          responseTime,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        await pool.end()
        throw error
      }
    }

    // For Supabase
    else {
      const { createServerSupabaseClient } = await import('@/lib/supabase/config')
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
          provider: 'supabase',
          responseTime
        }, { status: 500 })
      }

      return NextResponse.json({
        status: 'healthy',
        message: 'All systems operational',
        database: 'connected',
        provider: 'supabase',
        responseTime,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
