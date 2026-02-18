/**
 * Multi-Cloud Database Factory
 *
 * This module provides a unified database interface that works with both:
 * - Supabase (managed PostgreSQL with auth, storage, realtime)
 * - Azure PostgreSQL Flexible Server (direct PostgreSQL)
 *
 * The factory automatically selects the correct provider based on the
 * DATABASE_PROVIDER environment variable.
 *
 * Features:
 * - Seamless switching between providers
 * - Unified query interface
 * - Provider-specific optimizations
 * - Automatic connection management
 *
 * Usage:
 *   import { db } from '@/lib/db/factory'
 *
 *   // Query (works with both providers)
 *   const schools = await db.query('schools').select('*')
 *
 *   // Direct SQL (Azure only)
 *   if (db.provider === 'azure') {
 *     const result = await db.sql('SELECT * FROM schools WHERE id = $1', [schoolId])
 *   }
 */

import { isAzureEnabled } from './azure/config'

/**
 * Database provider type
 */
export type DatabaseProvider = 'supabase' | 'azure'

/**
 * Get active database provider
 */
export function getDatabaseProvider(): DatabaseProvider {
  return isAzureEnabled() ? 'azure' : 'supabase'
}

/**
 * Check if Supabase is the active provider
 */
export function isSupabaseProvider(): boolean {
  return getDatabaseProvider() === 'supabase'
}

/**
 * Check if Azure is the active provider
 */
export function isAzureProvider(): boolean {
  return getDatabaseProvider() === 'azure'
}

/**
 * Database connection info for debugging
 */
export function getDatabaseInfo() {
  const provider = getDatabaseProvider()

  if (provider === 'azure') {
    return {
      provider: 'azure',
      host: process.env.AZURE_POSTGRES_HOST,
      database: process.env.AZURE_POSTGRES_DATABASE,
      user: process.env.AZURE_POSTGRES_USER,
      ssl: process.env.AZURE_POSTGRES_SSL === 'true',
    }
  }

  return {
    provider: 'supabase',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

/**
 * Unified database client interface
 */
export interface DatabaseClient {
  provider: DatabaseProvider

  // Raw SQL query (Azure only)
  sql?: <T = any>(query: string, params?: any[]) => Promise<T[]>

  // Supabase client (Supabase only)
  supabase?: any

  // Transaction support
  transaction?: <T>(callback: (client: any) => Promise<T>) => Promise<T>

  // Health check
  healthCheck: () => Promise<boolean>
}

/**
 * Get database client based on active provider
 */
export async function getDatabaseClient(): Promise<DatabaseClient> {
  const provider = getDatabaseProvider()

  if (provider === 'azure') {
    const { query, transaction, healthCheck } = await import('./azure')

    return {
      provider: 'azure',
      sql: async <T = any>(queryText: string, params?: any[]): Promise<T[]> => {
        const result = await query<T>(queryText, params)
        return result.rows
      },
      transaction,
      healthCheck,
    }
  }

  // Supabase provider
  const { supabase } = await import('../supabase/config')

  return {
    provider: 'supabase',
    supabase,
    healthCheck: async () => {
      try {
        const { error } = await supabase.from('schools').select('count', { count: 'exact', head: true })
        return !error
      } catch {
        return false
      }
    },
  }
}

/**
 * Simple wrapper for direct SQL queries
 * Automatically uses the correct provider
 *
 * @param query - SQL query string
 * @param params - Query parameters
 * @returns Query results
 *
 * @example
 * const schools = await sql<School>('SELECT * FROM schools WHERE id = $1', [schoolId])
 */
export async function sql<T = any>(query: string, params?: any[]): Promise<T[]> {
  const db = await getDatabaseClient()

  if (db.provider === 'azure' && db.sql) {
    return db.sql<T>(query, params)
  }

  throw new Error('Direct SQL queries are only supported with Azure PostgreSQL provider')
}

/**
 * Execute a database transaction
 *
 * @param callback - Transaction callback
 * @returns Result from callback
 *
 * @example
 * const result = await dbTransaction(async (client) => {
 *   // Your transaction logic here
 *   return result
 * })
 */
export async function dbTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const db = await getDatabaseClient()

  if (db.transaction) {
    return db.transaction(callback)
  }

  throw new Error(`Transactions not implemented for ${db.provider} provider`)
}

/**
 * Check database connection health
 *
 * @returns true if database is reachable, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = await getDatabaseClient()
    return await db.healthCheck()
  } catch (error) {
    console.error('[DB] Health check failed:', error)
    return false
  }
}

/**
 * Get Supabase client (for Supabase-specific features)
 * Throws error if not using Supabase provider
 */
export async function getSupabaseClient() {
  if (!isSupabaseProvider()) {
    throw new Error('Supabase client is not available when using Azure provider')
  }

  const { supabase } = await import('../supabase/config')
  return supabase
}

/**
 * Default database client export
 * Use this for most database operations
 */
export const db = {
  get provider() {
    return getDatabaseProvider()
  },
  getClient: getDatabaseClient,
  sql,
  transaction: dbTransaction,
  healthCheck: checkDatabaseHealth,
  getInfo: getDatabaseInfo,
}
