/**
 * Database Status API Endpoint
 *
 * This endpoint provides information about the database connection and tables.
 * Access at: http://localhost:3000/api/db/status
 */

import { NextResponse } from 'next/server'
import { db, getDatabaseInfo } from '@/lib/db/factory'

export async function GET() {
  try {
    // Get database provider info
    const dbInfo = getDatabaseInfo()

    // Check health
    const healthy = await db.healthCheck()

    if (!healthy) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          provider: dbInfo.provider,
          info: dbInfo
        },
        { status: 500 }
      )
    }

    // Get tables list (Azure only)
    let tables: any[] = []
    let tableDetails: any[] = []
    let rowCounts: any = {}

    if (db.provider === 'azure') {
      // List all tables in public schema
      tables = await db.sql(`
        SELECT
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)

      // Get row counts for each table
      const tableCounts = await Promise.all(
        tables.map(async (table) => {
          try {
            const result = await db.sql(
              `SELECT COUNT(*) as count FROM ${table.table_name}`
            )
            return {
              table: table.table_name,
              count: parseInt(result[0].count)
            }
          } catch (error) {
            return {
              table: table.table_name,
              count: 'Error'
            }
          }
        })
      )

      rowCounts = tableCounts.reduce((acc, item) => {
        acc[item.table] = item.count
        return acc
      }, {} as any)

      // Get detailed table info
      tableDetails = await db.sql(`
        SELECT
          t.table_name,
          COUNT(c.column_name) as column_count,
          pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as size
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c
          ON t.table_name = c.table_name
          AND t.table_schema = c.table_schema
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name
        ORDER BY t.table_name
      `)
    }

    return NextResponse.json({
      status: 'connected',
      provider: dbInfo.provider,
      healthy,
      connection: {
        host: dbInfo.provider === 'azure' ? dbInfo.host : dbInfo.url,
        database: dbInfo.provider === 'azure' ? dbInfo.database : 'N/A',
        user: dbInfo.provider === 'azure' ? dbInfo.user : 'N/A',
        ssl: dbInfo.provider === 'azure' ? dbInfo.ssl : 'N/A',
      },
      tables: {
        count: tables.length,
        list: tables.map((t: any) => t.table_name),
        details: tableDetails,
        rowCounts,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('[DB Status API] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get database status',
        message: error.message,
        provider: db.provider,
      },
      { status: 500 }
    )
  }
}
