# Azure PostgreSQL Connection Setup Guide

This guide explains how to configure and use the Azure PostgreSQL connection layer in your Next.js application.

## Overview

The School Management System now supports **two database providers**:

1. **Supabase** - Managed PostgreSQL with built-in auth, storage, and realtime
2. **Azure PostgreSQL** - Direct PostgreSQL connection for cost optimization

You can switch between providers by changing a single environment variable.

## Quick Start

### 1. Install Dependencies

```bash
# Install node-postgres (pg) for Azure PostgreSQL support
npm install pg
npm install --save-dev @types/pg

# Or use yarn
yarn add pg
yarn add -D @types/pg
```

### 2. Configure Environment Variables

Copy the Azure environment template:

```bash
cp .env.azure.example .env.local
```

Or add these variables to your existing `.env.local`:

```env
# Switch to Azure provider
DATABASE_PROVIDER=azure

# Azure PostgreSQL connection
AZURE_POSTGRES_HOST=psql-sms-dev-sci1tp18.postgres.database.azure.com
AZURE_POSTGRES_DATABASE=school_management
AZURE_POSTGRES_USER=smsadmin
AZURE_POSTGRES_PASSWORD=MySchool@Azure2026
AZURE_POSTGRES_PORT=5432
AZURE_POSTGRES_SSL=true
AZURE_POSTGRES_SSL_MODE=require
```

**Get these values from Terraform:**

```bash
cd infrastructure/terraform/environments/dev
terraform output -json
```

### 3. Verify Connection

Create a test API route to verify the connection:

```typescript
// app/api/test-db/route.ts
import { db } from '@/lib/db/factory'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get database info
    const info = db.getInfo()

    // Check health
    const healthy = await db.healthCheck()

    return NextResponse.json({
      provider: db.provider,
      healthy,
      info,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Database connection failed', details: error },
      { status: 500 }
    )
  }
}
```

Visit `http://localhost:3000/api/test-db` to test the connection.

## Usage Examples

### Basic Query (Azure SQL)

```typescript
import { sql } from '@/lib/db/factory'

// Simple query
const schools = await sql<School>('SELECT * FROM schools')

// Parameterized query
const school = await sql<School>(
  'SELECT * FROM schools WHERE id = $1',
  [schoolId]
)
```

### Using Supabase-Style Queries

```typescript
import { getSupabaseClient } from '@/lib/db/factory'

// This only works when DATABASE_PROVIDER=supabase
const supabase = await getSupabaseClient()

const { data, error } = await supabase
  .from('schools')
  .select('*')
  .eq('id', schoolId)
```

### Transactions

```typescript
import { dbTransaction } from '@/lib/db/factory'

const result = await dbTransaction(async (client) => {
  // Insert school
  await client.query(
    'INSERT INTO schools (name, email) VALUES ($1, $2)',
    ['New School', 'contact@newschool.com']
  )

  // Insert students
  await client.query(
    'INSERT INTO students (name, school_id) VALUES ($1, $2)',
    ['John Doe', schoolId]
  )

  return { success: true }
})
```

### Provider-Specific Code

```typescript
import { db, isAzureProvider } from '@/lib/db/factory'

if (isAzureProvider()) {
  // Use raw SQL
  const result = await db.sql('SELECT * FROM schools')
} else {
  // Use Supabase client
  const supabase = await getSupabaseClient()
  const { data } = await supabase.from('schools').select('*')
}
```

## Migrating Services

To migrate existing services from Supabase to Azure:

### Before (Supabase Only)

```typescript
// services/school.service.ts
import { supabase } from '@/lib/supabase/config'

export async function getSchools() {
  const { data, error } = await supabase
    .from('schools')
    .select('*')

  if (error) throw error
  return data
}
```

### After (Multi-Cloud Support)

```typescript
// services/school.service.ts
import { db, isAzureProvider, getSupabaseClient } from '@/lib/db/factory'

export async function getSchools() {
  if (isAzureProvider()) {
    // Use Azure PostgreSQL
    return await db.sql<School>('SELECT * FROM schools')
  } else {
    // Use Supabase
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase.from('schools').select('*')
    if (error) throw error
    return data
  }
}
```

### Best Practice: Abstraction

```typescript
// lib/db/queries/schools.ts
import { db, isAzureProvider } from '@/lib/db/factory'

export async function getAllSchools(): Promise<School[]> {
  if (isAzureProvider()) {
    return await db.sql<School>('SELECT * FROM schools WHERE is_active = true')
  }

  const supabase = await db.getClient()
  const { data, error } = await supabase.supabase
    .from('schools')
    .select('*')
    .eq('is_active', true)

  if (error) throw error
  return data
}

export async function getSchoolById(id: string): Promise<School | null> {
  if (isAzureProvider()) {
    const result = await db.sql<School>(
      'SELECT * FROM schools WHERE id = $1',
      [id]
    )
    return result[0] || null
  }

  const supabase = await db.getClient()
  const { data, error } = await supabase.supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
```

## Connection Pooling

Azure PostgreSQL uses connection pooling for optimal performance:

- **Max connections**: 20 (configurable in `src/lib/db/azure/config.ts`)
- **Min connections**: 2
- **Idle timeout**: 30 seconds
- **Connection timeout**: 10 seconds

### Monitor Pool Stats

```typescript
import { getPoolStats } from '@/lib/db/azure'

const stats = getPoolStats()
console.log({
  total: stats.totalCount,      // Total clients in pool
  idle: stats.idleCount,         // Available connections
  waiting: stats.waitingCount,   // Waiting for connection
})
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_PROVIDER` | Yes | `supabase` | Database provider (`azure` or `supabase`) |
| `AZURE_POSTGRES_HOST` | Yes* | - | PostgreSQL server hostname |
| `AZURE_POSTGRES_DATABASE` | Yes* | - | Database name |
| `AZURE_POSTGRES_USER` | Yes* | - | Database user |
| `AZURE_POSTGRES_PASSWORD` | Yes* | - | Database password |
| `AZURE_POSTGRES_PORT` | No | `5432` | PostgreSQL port |
| `AZURE_POSTGRES_SSL` | No | `true` | Enable SSL |
| `AZURE_POSTGRES_SSL_MODE` | No | `require` | SSL mode |

*Required when `DATABASE_PROVIDER=azure`

## Troubleshooting

### Connection Timeout

**Problem**: Connection takes too long or times out

**Solution**:
1. Check firewall rules in Azure Portal
2. Verify your IP is whitelisted
3. Check server status

```bash
az postgres flexible-server show \
  --resource-group rg-sms-dev \
  --name psql-sms-dev-sci1tp18
```

### SSL Certificate Error

**Problem**: SSL certificate verification fails

**Solution**: Set `AZURE_POSTGRES_SSL_MODE=require` instead of `verify-full`

### Pool Exhaustion

**Problem**: "Pool is full" error

**Solution**: Increase pool size in `src/lib/db/azure/config.ts`:

```typescript
export const azureConfig = {
  max: 50,  // Increase from 20
  // ...
}
```

### Performance Issues

**Problem**: Queries are slow

**Solutions**:
1. Check query performance with `EXPLAIN ANALYZE`
2. Add indexes to frequently queried columns
3. Monitor slow queries in application logs
4. Use Azure PostgreSQL query performance insights

## Cost Optimization

**Current Azure PostgreSQL Cost**: ~$15.57/month

- Compute (B1ms): $12.00/month
- Storage (32GB): $3.20/month
- Backups (7 days): $0.37/month

**Tips to reduce costs**:
1. Use connection pooling (already implemented)
2. Optimize queries with proper indexes
3. Schedule non-production databases to stop during off-hours
4. Use burstable tier (B1ms) for dev/test

**Monitor costs**:

```bash
# View Azure consumption
az consumption usage list \
  --subscription "4430eb12-9548-4af6-b363-c8280245aa35"

# View resource costs
az cost-management query \
  --scope "/subscriptions/4430eb12-9548-4af6-b363-c8280245aa35" \
  --type ActualCost
```

## Next Steps

1. ✅ Install dependencies (`pg` package)
2. ✅ Configure environment variables
3. ✅ Test database connection
4. ⬜ Migrate existing services to use `db.factory`
5. ⬜ Implement application-level authentication
6. ⬜ Enable Row Level Security (RLS) policies
7. ⬜ Set up monitoring and alerting

## Resources

- [Azure PostgreSQL Documentation](https://learn.microsoft.com/en-us/azure/postgresql/)
- [node-postgres Documentation](https://node-postgres.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- Project: `docs/AZURE_MIGRATION_GUIDE.md`
