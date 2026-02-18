# Azure PostgreSQL Migration Guide

This directory contains migration scripts for transitioning from Supabase to Azure PostgreSQL.

## Quick Start

### 1. Test Database Connection

```bash
# Using connection string from Terraform outputs
psql "postgresql://smsadmin:MySchool@Azure2026@psql-sms-dev-sci1tp18.postgres.database.azure.com:5432/school_management?sslmode=require"

# Or using individual parameters
psql -h psql-sms-dev-sci1tp18.postgres.database.azure.com \
     -U smsadmin \
     -d school_management \
     -p 5432
```

### 2. Run Migration Script

```bash
cd infrastructure/migrations

# Run the migration
psql "postgresql://smsadmin:MySchool@Azure2026@psql-sms-dev-sci1tp18.postgres.database.azure.com:5432/school_management?sslmode=require" -f migrate-to-azure.sql
```

Expected output:
```
============================================
Starting Azure PostgreSQL Migration...
============================================

--- Enabling PostgreSQL Extensions ---
✓ pgcrypto extension enabled (UUID generation)
✓ pg_stat_statements already enabled

--- Creating Core Tables ---
✓ Schools table created
✓ Students table created
✓ Users table created
...
✅ Azure PostgreSQL Migration Complete!
```

### 3. Verify Migration

```sql
-- List all tables
\dt

-- Check table structure
\d schools
\d students
\d users

-- Verify seed data
SELECT * FROM schools;
SELECT * FROM students;
SELECT * FROM users;

-- Check extensions
SELECT * FROM pg_extension;

-- Query performance monitoring
SELECT * FROM pg_stat_statements LIMIT 5;
```

## Migration Script Details

### Tables Created

| Table | Description |
|-------|-------------|
| `schools` | School information and metadata |
| `students` | Student records with parent contact info |
| `users` | System users (admin, teacher, accountant, parent) |
| `user_invitations` | Pending user invitations |
| `parent_accounts` | Parent portal accounts |
| `parent_student_links` | Parent-student relationships |
| `parent_sessions` | Parent authentication sessions |
| `otp_codes` | SMS OTP codes for authentication |
| `attendance` | Student attendance records |

### Views Created

| View | Description |
|------|-------------|
| `attendance_summary` | Aggregated attendance statistics by student |

### Functions Created

- `update_*_updated_at()` - Automatic timestamp updates for all tables
- `cleanup_expired_otps()` - Remove expired OTP codes

### Indexes

All tables have performance-optimized indexes on:
- Primary keys (UUID)
- Foreign keys (school_id, student_id, parent_id, etc.)
- Frequently queried columns (phone, email, date, status)

## Important Notes

### Supabase to Azure Differences

1. **Authentication**
   - ❌ Supabase `auth.uid()` NOT available in Azure
   - ❌ Supabase `auth.users` table NOT available
   - ✅ Application-level authentication required
   - ✅ RLS policies disabled for now

2. **Row Level Security (RLS)**
   - RLS is supported in PostgreSQL but policies are commented out
   - Need to implement application-level row filtering
   - Or create custom RLS policies based on session user

3. **Extensions**
   - ✅ `pgcrypto` - UUID generation
   - ✅ `pg_stat_statements` - Query performance monitoring
   - All standard PostgreSQL extensions are available

### Missing Tables

The following tables are referenced in original migrations but not yet created:
- `fees` - Fee management (referenced in parent_dashboard view)
- `exams` - Exam/assessment records (referenced in policies)

These will be added in Phase 1 of the migration.

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to database
```
psql: error: connection to server at "psql-sms-dev-*.postgres.database.azure.com" failed
```

**Solution**:
1. Check firewall rules: `az postgres flexible-server firewall-rule list`
2. Verify your IP is whitelisted (currently: 102.206.114.114)
3. Ensure SSL mode is `require`

### Permission Issues

**Problem**: Permission denied errors
```
ERROR: permission denied for table schools
```

**Solution**:
```sql
-- Grant permissions to current user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smsadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smsadmin;
```

### Extension Issues

**Problem**: Extension not found
```
ERROR: could not open extension control file
```

**Solution**:
- Some extensions require Azure support
- Use `SELECT * FROM pg_available_extensions;` to check available extensions
- Contact Azure support for additional extensions

## Next Steps

After successful migration:

1. **Update Application Configuration**
   ```bash
   # Update .env.local with Azure connection details
   DATABASE_PROVIDER=azure
   AZURE_POSTGRES_HOST=psql-sms-dev-sci1tp18.postgres.database.azure.com
   AZURE_POSTGRES_DATABASE=school_management
   AZURE_POSTGRES_USER=smsadmin
   AZURE_POSTGRES_PASSWORD=MySchool@Azure2026
   ```

2. **Create Connection Layer**
   - Implement `lib/db/azure-connection.ts`
   - Create connection factory for multi-cloud support
   - Update existing database queries

3. **Implement Authentication**
   - Set up Next-Auth or custom auth
   - Create session management
   - Implement RLS policies

4. **Add Missing Tables**
   - Create `fees` table
   - Create `exams` table
   - Update views to include new tables

5. **Performance Optimization**
   - Monitor with `pg_stat_statements`
   - Add additional indexes as needed
   - Set up query performance alerts

## Cost Management

**Current Configuration**: B_Standard_B1ms (Burstable)
- Compute: $12.00/month
- Storage: $3.20/month (32GB)
- Backups: $0.37/month (7 days)
- **Total: ~$15.57/month**

**Monitoring Costs**:
```bash
# Check Azure costs
az consumption usage list --subscription "4430eb12-9548-4af6-b363-c8280245aa35"

# View resource costs
az cost-management query --scope "/subscriptions/4430eb12-9548-4af6-b363-c8280245aa35" --type ActualCost
```

## Useful Commands

### Database Management

```bash
# Backup database
pg_dump "postgresql://smsadmin:PASSWORD@HOST/school_management?sslmode=require" > backup.sql

# Restore database
psql "postgresql://smsadmin:PASSWORD@HOST/school_management?sslmode=require" < backup.sql

# Connect to database
psql "postgresql://smsadmin:PASSWORD@HOST/school_management?sslmode=require"
```

### Terraform Management

```bash
cd infrastructure/terraform/environments/dev

# View current state
terraform show

# View outputs (including connection string)
terraform output -json

# Refresh state
terraform refresh

# Destroy infrastructure (CAREFUL!)
terraform destroy
```

## Support

For issues or questions:
1. Check Azure PostgreSQL docs: https://learn.microsoft.com/en-us/azure/postgresql/
2. PostgreSQL documentation: https://www.postgresql.org/docs/15/
3. Project documentation: `docs/AZURE_MIGRATION_GUIDE.md`
