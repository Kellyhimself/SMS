# Azure Migration Guide
## Migrating from Supabase to Azure PostgreSQL

**Migration Date**: February 1, 2026
**Actual Time**: 1 day (8 hours)
**Downtime**: Zero (new deployment)
**Cost**: $15.57/month (actual)
**Status**: ✅ COMPLETE

---

## 📋 PRE-MIGRATION CHECKLIST

### Information Gathered ✅

- [x] **Existing Database Schema**: Available in `/migrations/` folder
- [x] **Current Tech Stack**: Next.js 15, TypeScript, PostgreSQL
- [x] **Data Volume**: Test data only (<10MB)
- [x] **Environment Variables**: Documented in `.env.azure.example`
- [x] **External Dependencies**: Africa's Talking, SendGrid (not affected)
- [x] **Performance Metrics**: Dashboard created for monitoring

### Azure Prerequisites ✅

- [x] Azure account created
- [x] $200 free credits activated
- [x] Azure CLI installed: `az --version`
- [x] Terraform installed: `terraform --version`
- [x] PostgreSQL client installed: `psql --version` (PostgreSQL 17)

---

## 🚀 MIGRATION STEPS

### Step 1: Create Azure Subscription (15 minutes)

1. **Sign up for Azure Free Account**:
   ```bash
   # Visit: https://azure.microsoft.com/free
   # Sign up with Microsoft account
   # Verify email and phone number
   # Add payment method (won't be charged, needed for verification)
   ```

2. **Verify $200 Credits**:
   ```bash
   az login
   az account show
   az account list-locations -o table
   ```

3. **Choose Region** (cheapest):
   - **Primary**: East US (lowest cost)
   - **Backup**: West US 2

---

### Step 2: Set Up Terraform Backend (30 minutes)

**Why**: Store Terraform state securely in Azure

1. **Create Storage Account for Terraform State**:

   ```bash
   # Set variables
   RESOURCE_GROUP_NAME="rg-sms-terraform-state"
   STORAGE_ACCOUNT_NAME="smstfstate$(date +%s)"  # Must be globally unique
   CONTAINER_NAME="tfstate"
   LOCATION="eastus"

   # Create resource group
   az group create \
     --name $RESOURCE_GROUP_NAME \
     --location $LOCATION

   # Create storage account
   az storage account create \
     --name $STORAGE_ACCOUNT_NAME \
     --resource-group $RESOURCE_GROUP_NAME \
     --location $LOCATION \
     --sku Standard_LRS \
     --encryption-services blob

   # Create container
   az storage container create \
     --name $CONTAINER_NAME \
     --account-name $STORAGE_ACCOUNT_NAME

   # Get access key
   ACCOUNT_KEY=$(az storage account keys list \
     --resource-group $RESOURCE_GROUP_NAME \
     --account-name $STORAGE_ACCOUNT_NAME \
     --query '[0].value' -o tsv)

   echo "Storage Account: $STORAGE_ACCOUNT_NAME"
   echo "Access Key: $ACCOUNT_KEY"
   ```

2. **Configure Terraform Backend**:

   Create `infrastructure/terraform/backend.tf`:
   ```hcl
   terraform {
     backend "azurerm" {
       resource_group_name  = "rg-sms-terraform-state"
       storage_account_name = "smstfstate1738368000"  # Use your actual name
       container_name       = "tfstate"
       key                  = "sms-dev.tfstate"
     }
   }
   ```

---

### Step 3: Deploy Azure PostgreSQL (1 hour)

1. **Create Terraform Module** (`infrastructure/terraform/modules/azure-postgresql/main.tf`):

   ```hcl
   resource "azurerm_resource_group" "main" {
     name     = "rg-sms-${var.environment}"
     location = var.location

     tags = {
       Environment = var.environment
       Project     = "SchoolManagementSystem"
       ManagedBy   = "Terraform"
     }
   }

   resource "azurerm_postgresql_flexible_server" "main" {
     name                = "psql-sms-${var.environment}"
     resource_group_name = azurerm_resource_group.main.name
     location            = azurerm_resource_group.main.location

     # Free tier: B1ms (1 vCore, 2GB RAM)
     sku_name   = "B_Standard_B1ms"
     storage_mb = 32768  # 32GB

     version = "15"

     administrator_login    = var.admin_username
     administrator_password = var.admin_password

     backup_retention_days        = 7
     geo_redundant_backup_enabled = false

     tags = {
       Environment = var.environment
       CostCenter  = "Learning"
     }
   }

   # Allow access from Azure services
   resource "azurerm_postgresql_flexible_server_firewall_rule" "azure" {
     name             = "allow-azure-services"
     server_id        = azurerm_postgresql_flexible_server.main.id
     start_ip_address = "0.0.0.0"
     end_ip_address   = "0.0.0.0"
   }

   # Allow access from your local machine (temporary)
   resource "azurerm_postgresql_flexible_server_firewall_rule" "local" {
     name             = "allow-local-development"
     server_id        = azurerm_postgresql_flexible_server.main.id
     start_ip_address = var.local_ip_address
     end_ip_address   = var.local_ip_address
   }

   # Create database
   resource "azurerm_postgresql_flexible_server_database" "main" {
     name      = "school_management"
     server_id = azurerm_postgresql_flexible_server.main.id
     charset   = "UTF8"
     collation = "en_US.utf8"
   }
   ```

2. **Deploy with Terraform**:

   ```bash
   cd infrastructure/terraform/environments/dev

   # Initialize
   terraform init

   # Plan (review changes)
   terraform plan \
     -var="admin_username=smsadmin" \
     -var="admin_password=YourSecurePassword123!" \
     -var="local_ip_address=$(curl -s ifconfig.me)"

   # Apply
   terraform apply -auto-approve

   # Get connection string
   terraform output -raw connection_string
   ```

3. **Test Connection**:

   ```bash
   # Get server FQDN
   SERVER_FQDN=$(terraform output -raw postgres_host)

   # Connect with psql
   psql "host=$SERVER_FQDN port=5432 dbname=school_management user=smsadmin password=YourSecurePassword123! sslmode=require"

   # Should see: school_management=>
   ```

---

### Step 4: Migrate Database Schema (2 hours)

1. **Export Current Schema from Local Migrations**:

   Your existing schema is in `/supabase/migrations/`. We'll recreate it on Azure.

2. **Create Migration Script** (`migrations/migrate-to-azure.sql`):

   ```sql
   -- ============================================
   -- AZURE POSTGRESQL MIGRATION
   -- From: Supabase (deleted)
   -- To: Azure PostgreSQL Flexible Server
   -- Date: 2026-02-01
   -- ============================================

   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";

   -- Create schemas
   CREATE SCHEMA IF NOT EXISTS public;
   CREATE SCHEMA IF NOT EXISTS payroll;
   CREATE SCHEMA IF NOT EXISTS accounting;
   CREATE SCHEMA IF NOT EXISTS budgeting;

   -- ============================================
   -- CORE TABLES (from Supabase)
   -- ============================================

   CREATE TABLE public.schools (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255),
     phone VARCHAR(15),
     address TEXT,
     subscription_plan VARCHAR(50) DEFAULT 'free',
     verification_status VARCHAR(20) DEFAULT 'pending',
     bank_api_settings JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE public.users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255),
     role VARCHAR(20) CHECK (role IN ('admin', 'teacher', 'accountant', 'parent')),
     school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_users_school ON public.users(school_id);
   CREATE INDEX idx_users_email ON public.users(email);

   CREATE TABLE public.students (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
     admission_number VARCHAR(50) NOT NULL,
     name VARCHAR(255) NOT NULL,
     class VARCHAR(50),
     parent_phone VARCHAR(15),
     parent_email VARCHAR(255),
     date_of_birth DATE,
     gender VARCHAR(10),
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),

     CONSTRAINT unique_admission_per_school UNIQUE (school_id, admission_number)
   );

   CREATE INDEX idx_students_school ON public.students(school_id);
   CREATE INDEX idx_students_admission ON public.students(admission_number);

   -- [Continue with all your other tables from Supabase...]
   -- Copy from: supabase/migrations/*.sql

   -- Row-Level Security (RLS) Policies
   -- Note: Azure PostgreSQL supports RLS!
   ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

   -- Policy: Users can only access their school's data
   CREATE POLICY "School isolation" ON public.schools
     FOR ALL USING (id = current_setting('app.current_school_id')::uuid);

   CREATE POLICY "School isolation" ON public.users
     FOR ALL USING (school_id = current_setting('app.current_school_id')::uuid);

   CREATE POLICY "School isolation" ON public.students
     FOR ALL USING (school_id = current_setting('app.current_school_id')::uuid);
   ```

3. **Run Migration**:

   ```bash
   # Set connection string
   export DATABASE_URL="postgresql://smsadmin:YourSecurePassword123!@psql-sms-dev.postgres.database.azure.com:5432/school_management?sslmode=require"

   # Run migration
   psql $DATABASE_URL < migrations/migrate-to-azure.sql

   # Verify tables created
   psql $DATABASE_URL -c "\dt public.*"
   psql $DATABASE_URL -c "\dt payroll.*"
   psql $DATABASE_URL -c "\dt accounting.*"
   ```

---

### Step 5: Update Next.js Application (3 hours)

1. **Install Azure PostgreSQL Client**:

   ```bash
   npm install pg @types/pg
   ```

2. **Create Database Connection Layer** (`src/lib/database/azure-postgresql.ts`):

   ```typescript
   import { Pool, PoolConfig } from 'pg';

   const poolConfig: PoolConfig = {
     host: process.env.AZURE_POSTGRES_HOST,
     port: 5432,
     database: process.env.AZURE_POSTGRES_DATABASE || 'school_management',
     user: process.env.AZURE_POSTGRES_USER,
     password: process.env.AZURE_POSTGRES_PASSWORD,
     ssl: {
       rejectUnauthorized: true,
       ca: process.env.AZURE_POSTGRES_CA_CERT, // Optional
     },
     max: 20, // Max connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   };

   export const azurePool = new Pool(poolConfig);

   // Test connection on startup
   azurePool.on('connect', () => {
     console.log('Connected to Azure PostgreSQL');
   });

   azurePool.on('error', (err) => {
     console.error('Unexpected error on idle client', err);
     process.exit(-1);
   });

   // Query helper with logging
   export async function query(text: string, params?: any[]) {
     const start = Date.now();
     try {
       const res = await azurePool.query(text, params);
       const duration = Date.now() - start;
       console.log('Query executed', {
         text: text.substring(0, 100),
         duration,
         rows: res.rowCount
       });
       return res;
     } catch (error) {
       console.error('Query error', { text, error });
       throw error;
     }
   }

   // Transaction helper
   export async function transaction<T>(
     callback: (client: any) => Promise<T>
   ): Promise<T> {
     const client = await azurePool.connect();
     try {
       await client.query('BEGIN');
       const result = await callback(client);
       await client.query('COMMIT');
       return result;
     } catch (error) {
       await client.query('ROLLBACK');
       throw error;
     } finally {
       client.release();
     }
   }
   ```

3. **Update Environment Variables** (`.env.local`):

   ```bash
   # Azure PostgreSQL
   DATABASE_PROVIDER=azure
   AZURE_POSTGRES_HOST=psql-sms-dev.postgres.database.azure.com
   AZURE_POSTGRES_DATABASE=school_management
   AZURE_POSTGRES_USER=smsadmin
   AZURE_POSTGRES_PASSWORD=YourSecurePassword123!

   # Keep existing external services
   AFRICASTALKING_USERNAME=sandbox
   AFRICASTALKING_API_KEY=your-key
   SENDGRID_API_KEY=your-key
   RESEND_API_KEY=your-key

   # App settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Update Services to Use Azure PostgreSQL**:

   Example for `src/services/student.service.ts`:

   ```typescript
   import { query } from '@/lib/database/azure-postgresql';

   export async function getStudents(schoolId: string) {
     const result = await query(
       'SELECT * FROM public.students WHERE school_id = $1 AND is_active = true',
       [schoolId]
     );
     return result.rows;
   }

   export async function createStudent(schoolId: string, studentData: any) {
     const result = await query(
       `INSERT INTO public.students (school_id, admission_number, name, class)
        VALUES ($1, $2, $3, $4) RETURNING *`,
       [schoolId, studentData.admission_number, studentData.name, studentData.class]
     );
     return result.rows[0];
   }
   ```

---

### Step 6: Testing (1 day)

1. **Unit Tests**:

   ```bash
   # Test database connection
   npm run test:db

   # Test CRUD operations
   npm run test:services
   ```

2. **Manual Testing Checklist**:

   - [ ] User login/authentication
   - [ ] School registration
   - [ ] Student CRUD operations
   - [ ] Fee management (create, pay, view)
   - [ ] Attendance marking
   - [ ] Exam score entry
   - [ ] Parent portal access
   - [ ] Report generation (PDF)
   - [ ] Bank webhook handling

3. **Performance Testing**:

   ```bash
   # Load test with Apache Bench
   ab -n 1000 -c 10 http://localhost:3000/api/students?school_id=xxx

   # Monitor query performance
   psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
   ```

---

### Step 7: Deploy to Azure App Service (1 day)

1. **Create App Service** (Free Tier):

   ```bash
   az webapp create \
     --resource-group rg-sms-dev \
     --plan sms-app-service-plan \
     --name sms-nextjs-app \
     --runtime "NODE:20-lts" \
     --deployment-local-git

   # Configure environment variables
   az webapp config appsettings set \
     --resource-group rg-sms-dev \
     --name sms-nextjs-app \
     --settings \
       DATABASE_PROVIDER=azure \
       AZURE_POSTGRES_HOST=psql-sms-dev.postgres.database.azure.com \
       AZURE_POSTGRES_DATABASE=school_management \
       AZURE_POSTGRES_USER=smsadmin \
       AZURE_POSTGRES_PASSWORD=YourSecurePassword123!
   ```

2. **Deploy Next.js App**:

   ```bash
   # Build for production
   npm run build

   # Deploy
   git remote add azure https://sms-nextjs-app.scm.azurewebsites.net:443/sms-nextjs-app.git
   git push azure main
   ```

---

## ✅ POST-MIGRATION VALIDATION

### Data Integrity Checks

```sql
-- Verify row counts match Supabase
SELECT 'schools' as table_name, COUNT(*) FROM public.schools
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'students', COUNT(*) FROM public.students
UNION ALL
SELECT 'fees', COUNT(*) FROM public.fees;

-- Check for NULL values in critical fields
SELECT COUNT(*) FROM public.students WHERE name IS NULL OR admission_number IS NULL;

-- Verify foreign key relationships
SELECT COUNT(*) FROM public.users WHERE school_id NOT IN (SELECT id FROM public.schools);
```

### Performance Baseline

```sql
-- Enable query stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🔄 ROLLBACK PLAN (If Needed)

If migration fails, you can:

1. **Keep using Local Development** (PostgreSQL via Docker)
2. **Recreate Supabase Project** (free tier)
3. **Use Azure PostgreSQL with longer timeline**

---

## 📊 SUCCESS CRITERIA

- [x] Azure PostgreSQL deployed and accessible ✅
- [x] All database schema migrated (9 tables + 1 view) ✅
- [x] Application connects successfully ✅
- [x] Visual dashboard operational (http://localhost:3000/db-status) ✅
- [x] Performance acceptable (<1s for complex queries) ✅
- [x] Cost within budget ($15.57/month < $16 target) ✅
- [x] Backup configured (7-day retention) ✅
- [x] Multi-cloud abstraction working ✅
- [x] Documentation complete ✅

---

## ✅ PHASE 0 COMPLETION SUMMARY

**Actual Implementation** (vs Planned):
- **Server Name**: psql-sms-dev-sci1tp18.postgres.database.azure.com
- **Region**: Central US (changed from East US due to restrictions)
- **State Management**: Local (changed from remote to save $4/month)
- **Migration Time**: 1 day (vs 7 days planned) - 85% faster!
- **Cost**: $15.57/month (3% under estimate)
- **Files Created**: 20+ files (vs 8 planned)

**Key Differences from Original Plan**:
1. Used local Terraform state instead of remote backend (cost savings)
2. Deployed to Central US instead of East US (subscription restrictions)
3. Created visual dashboard (not in original plan)
4. Built connection factory pattern for multi-cloud (enhanced scope)
5. Completed in 1 day instead of 7 days (better efficiency)

**Additional Deliverables** (Beyond Original Plan):
- Database status dashboard (visual + API)
- PowerShell helper scripts (3 scripts)
- Comprehensive documentation (7 documents vs 2 planned)
- Connection factory pattern
- Complete Phase 0 summary document

---

**Migration Owner**: You
**Last Updated**: February 1, 2026
**Status**: ✅ COMPLETE
**Achievement**: Phase 0 delivered ahead of schedule and under budget!
