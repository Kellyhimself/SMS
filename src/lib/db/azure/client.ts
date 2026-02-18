/**
 * Azure PostgreSQL Client
 *
 * This module provides a connection pool to Azure PostgreSQL Flexible Server.
 * It uses node-postgres (pg) for direct PostgreSQL connections.
 *
 * Features:
 * - Connection pooling for performance
 * - Automatic reconnection on failure
 * - Query error handling
 * - Transaction support
 * - Prepared statements
 *
 * Usage:
 *   import { query, getClient } from '@/lib/db/azure/client'
 *
 *   // Simple query
 *   const result = await query('SELECT * FROM schools WHERE id = $1', [schoolId])
 *
 *   // Transaction
 *   const client = await getClient()
 *   try {
 *     await client.query('BEGIN')
 *     await client.query('INSERT INTO schools ...')
 *     await client.query('COMMIT')
 *   } catch (error) {
 *     await client.query('ROLLBACK')
 *     throw error
 *   } finally {
 *     client.release()
 *   }
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { azureConfig, validateAzureConfig } from './config'

// Singleton connection pool
let pool: Pool | null = null

/**
 * Get or create PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    // Validate configuration before creating pool
    validateAzureConfig()

    // Create new connection pool
    pool = new Pool(azureConfig)

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err)
      // Don't exit the process, just log the error
    })

    // Connection event handlers for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      pool.on('connect', (client) => {
        console.log('[Azure PG] New client connected to pool')
      })

      pool.on('acquire', () => {
        console.log('[Azure PG] Client acquired from pool')
      })

      pool.on('remove', () => {
        console.log('[Azure PG] Client removed from pool')
      })
    }

    console.log('[Azure PG] Connection pool created')
  }

  return pool
}

/**
 * Execute a parameterized query
 *
 * @param text - SQL query string (use $1, $2, etc. for parameters)
 * @param params - Query parameters
 * @returns Query result
 *
 * @example
 * const result = await query('SELECT * FROM schools WHERE id = $1', [schoolId])
 * const schools = result.rows
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  const pool = getPool()

  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`[Azure PG] Slow query (${duration}ms):`, text.substring(0, 100))
    }

    return result
  } catch (error) {
    console.error('[Azure PG] Query error:', error)
    console.error('[Azure PG] Query:', text)
    console.error('[Azure PG] Params:', params)
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 *
 * IMPORTANT: Must call client.release() when done!
 *
 * @returns PostgreSQL client
 *
 * @example
 * const client = await getClient()
 * try {
 *   await client.query('BEGIN')
 *   await client.query('INSERT INTO schools (name) VALUES ($1)', ['Test School'])
 *   await client.query('COMMIT')
 * } catch (error) {
 *   await client.query('ROLLBACK')
 *   throw error
 * } finally {
 *   client.release()  // MUST call this!
 * }
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

/**
 * Execute a transaction
 *
 * @param callback - Transaction callback function
 * @returns Result from callback
 *
 * @example
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO schools (name) VALUES ($1)', ['Test School'])
 *   const result = await client.query('SELECT * FROM schools WHERE name = $1', ['Test School'])
 *   return result.rows[0]
 * })
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close the connection pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[Azure PG] Connection pool closed')
  }
}

/**
 * Check database connection health
 *
 * @returns true if connected, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health')
    return result.rows[0]?.health === 1
  } catch (error) {
    console.error('[Azure PG] Health check failed:', error)
    return false
  }
}

/**
 * Get pool statistics (for monitoring)
 */
export function getPoolStats() {
  const pool = getPool()
  return {
    totalCount: pool.totalCount,     // Total clients in pool
    idleCount: pool.idleCount,       // Idle clients
    waitingCount: pool.waitingCount, // Clients waiting for connection
  }
}
