/**
 * Azure PostgreSQL Module
 *
 * This module provides direct PostgreSQL connectivity to Azure PostgreSQL Flexible Server.
 * It's an alternative to Supabase for cases where direct database access is needed.
 *
 * @module lib/db/azure
 */

// Export client functions
export {
  query,
  getClient,
  getPool,
  transaction,
  closePool,
  healthCheck,
  getPoolStats,
} from './client'

// Export configuration
export {
  azureConfig,
  validateAzureConfig,
  getAzureConnectionString,
  isAzureEnabled,
} from './config'

// Re-export types from pg for convenience
export type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
