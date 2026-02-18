/**
 * Azure PostgreSQL Configuration
 *
 * This module provides configuration for connecting to Azure PostgreSQL Flexible Server.
 * It uses the standard PostgreSQL client (node-postgres) for direct database connections.
 *
 * Environment Variables Required:
 * - AZURE_POSTGRES_HOST: PostgreSQL server FQDN
 * - AZURE_POSTGRES_DATABASE: Database name
 * - AZURE_POSTGRES_USER: Admin username
 * - AZURE_POSTGRES_PASSWORD: Admin password
 * - AZURE_POSTGRES_PORT: Port (default: 5432)
 * - AZURE_POSTGRES_SSL: Enable SSL (default: true)
 */

export const azureConfig = {
  // Connection parameters
  host: process.env.AZURE_POSTGRES_HOST,
  port: parseInt(process.env.AZURE_POSTGRES_PORT || '5432'),
  database: process.env.AZURE_POSTGRES_DATABASE,
  user: process.env.AZURE_POSTGRES_USER,
  password: process.env.AZURE_POSTGRES_PASSWORD,

  // SSL configuration (required for Azure PostgreSQL)
  ssl: process.env.AZURE_POSTGRES_SSL === 'true' ? {
    rejectUnauthorized: true,  // Verify server certificate
  } : false,

  // Connection pool settings
  max: 20,                    // Maximum pool size
  min: 2,                     // Minimum pool connections
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Wait 10 seconds before timeout

  // Application name (helps with monitoring in Azure)
  application_name: 'sms-next-app',

  // Statement timeout (prevent long-running queries)
  statement_timeout: 30000,  // 30 seconds

  // Query timeout
  query_timeout: 30000,
}

/**
 * Validate Azure configuration
 * Throws error if required environment variables are missing
 */
export function validateAzureConfig() {
  const required = [
    'AZURE_POSTGRES_HOST',
    'AZURE_POSTGRES_DATABASE',
    'AZURE_POSTGRES_USER',
    'AZURE_POSTGRES_PASSWORD',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required Azure PostgreSQL environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file'
    )
  }

  return true
}

/**
 * Get connection string for Azure PostgreSQL
 * Useful for direct psql connections or migrations
 */
export function getAzureConnectionString(): string {
  validateAzureConfig()

  const { host, port, database, user, password } = azureConfig
  const sslMode = azureConfig.ssl ? 'require' : 'disable'

  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=${sslMode}`
}

/**
 * Check if Azure mode is enabled
 */
export function isAzureEnabled(): boolean {
  return process.env.DATABASE_PROVIDER === 'azure' && !!process.env.AZURE_POSTGRES_HOST
}
