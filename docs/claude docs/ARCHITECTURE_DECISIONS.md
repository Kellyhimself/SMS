# Architecture Decision Records (ADRs)
## Key Technical Decisions for SMS Transformation

This document records important architectural decisions, their context, alternatives considered, and rationale.

---

## ADR-001: Multi-Cloud Database Strategy (Azure + Supabase IaC)

**Date**: 2026-02-01
**Status**: ✅ Accepted & Implemented
**Decision Maker**: Development Team

### Context

Supabase project was deleted due to inactivity. Need to choose between:
1. Recreate Supabase project (free)
2. Migrate to Azure SQL/PostgreSQL
3. Use both with IaC for easy switching

### Decision

**Use Azure PostgreSQL during $200 credit period, maintain parallel IaC for Supabase migration.**

### Rationale

**Why Azure First**:
- ✅ Learning opportunity (Azure Database for PostgreSQL)
- ✅ $200 free credits available
- ✅ Integrated with Azure ecosystem (App Service, AKS, Sentinel)
- ✅ Enterprise-grade features (point-in-time restore, high availability)
- ✅ Aligns with learning goals (DevSecOps, Cloud Architecture)

**Why Keep Supabase IaC**:
- ✅ Cost optimization after credits expire (~$0 vs ~$12/month)
- ✅ Multi-cloud strategy (avoid vendor lock-in)
- ✅ PostgreSQL compatibility (same database engine)
- ✅ Built-in auth and realtime features

**Why Not SQL Server**:
- ❌ Different SQL dialect (harder migration)
- ❌ More expensive than PostgreSQL
- ❌ Less compatible with existing code

### Consequences

**Positive**:
- Learn Azure managed databases
- IaC makes switching between providers trivial
- Best of both worlds (Azure learning + Supabase cost efficiency)

**Negative**:
- Must maintain two IaC configurations
- Slightly more complex connection abstraction layer

**Mitigation**:
- Use connection factory pattern for abstraction
- Keep IaC configs in sync
- Test regularly on both platforms

### Implementation

1. Create `infrastructure/terraform/modules/azure-postgresql/`
2. Create `infrastructure/terraform/modules/supabase-postgresql/`
3. Create `src/lib/database/connection-factory.ts`
4. Environment variable: `DATABASE_PROVIDER=azure|supabase`

---

## ADR-002: Azure PostgreSQL Flexible Server vs. Single Server

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

Azure offers two PostgreSQL deployment options:
1. **Single Server** (legacy, being deprecated)
2. **Flexible Server** (new, recommended)

### Decision

**Use Azure Database for PostgreSQL Flexible Server.**

### Rationale

**Why Flexible Server**:
- ✅ Microsoft's recommended option (Single Server deprecated after 2025)
- ✅ Better cost optimization (Burstable B1ms tier)
- ✅ More granular control (CPU, memory, IOPS)
- ✅ Zone-redundant HA available (optional)
- ✅ Better maintenance window control

**Why Not Single Server**:
- ❌ Being deprecated (retirement date: March 2025)
- ❌ Limited SKU options
- ❌ Less flexible

### Consequences

**Positive**:
- Future-proof (won't need migration)
- Lower cost with burstable tier
- Better performance tuning options

**Negative**:
- Slightly different Terraform provider syntax
- More configuration options (complexity)

**Cost**:
- Burstable B1ms: ~$12/month
- 32GB storage: ~$3/month
- **Total**: ~$15/month (within budget)

---

## ADR-002.1: Terraform State Management - Local vs Remote Backend

**Date**: 2026-02-01
**Status**: ✅ Accepted & Implemented

### Context

Terraform state can be stored:
1. **Locally** (terraform.tfstate file in project)
2. **Remotely** (Azure Blob Storage, ~$4/month)
3. **Terraform Cloud** (free tier available)

### Decision

**Use local state for dev environment during learning phase.**

### Rationale

**Why Local State**:
- ✅ Zero cost (saves $1-4/month)
- ✅ Faster iterations (no remote sync)
- ✅ Easy to destroy and recreate
- ✅ Perfect for solo learning projects
- ✅ Can migrate to remote later with `terraform init -migrate-state`

**Why Not Remote Backend Now**:
- ❌ Additional cost ($1-4/month for storage)
- ❌ Chicken-and-egg problem (need Terraform to create storage for Terraform)
- ❌ Overkill for single-developer learning project

### Implementation

State file location: `infrastructure/terraform/environments/dev/terraform.tfstate`
- Gitignored for security
- Backed up manually when needed
- Will migrate to Azure Storage in production

### Consequences

**Positive**:
- Saved $4/month ($16 over 4 months)
- Faster development cycle
- No dependency on remote services

**Negative**:
- State not shared across team (N/A for solo project)
- Manual backup required
- No automatic locking

**Actual Savings**: $4/month = $16 over 4-month learning period

---

## ADR-002.2: Connection Factory Pattern for Multi-Cloud

**Date**: 2026-02-01
**Status**: ✅ Accepted & Implemented

### Context

Need to support both Azure PostgreSQL and Supabase with minimal code changes.

### Decision

**Implement database factory pattern with environment-based provider selection.**

### Rationale

**Why Factory Pattern**:
- ✅ Single point of configuration (`DATABASE_PROVIDER` env var)
- ✅ No code changes to switch providers
- ✅ Type-safe abstraction layer
- ✅ Provider-specific optimizations possible
- ✅ Future-proof (can add more providers)

**Alternative Considered**: Direct imports
- ❌ Would require code changes to switch
- ❌ No abstraction layer
- ❌ Hard to test

### Implementation

Created `src/lib/db/factory.ts`:
```typescript
export function getDatabaseProvider(): 'azure' | 'supabase' {
  return process.env.DATABASE_PROVIDER === 'azure' ? 'azure' : 'supabase'
}

export const db = {
  get provider() { return getDatabaseProvider() },
  sql: async (query, params) => { /* provider-specific */ },
  transaction: async (callback) => { /* provider-specific */ },
  healthCheck: async () => { /* provider-specific */ }
}
```

### Consequences

**Positive**:
- Switch providers with environment variable
- Clean abstraction for services
- Easy to test both providers

**Negative**:
- Slight overhead (factory lookup)
- Two code paths to maintain

**Actual Usage**:
```typescript
// Before
import { supabase } from '@/lib/supabase/client'
const { data } = await supabase.from('schools').select('*')

// After
import { db } from '@/lib/db/factory'
const data = await db.sql<School>('SELECT * FROM schools')
```

---

## ADR-003: Microservices Architecture for Payroll/Accounting

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

Payroll and accounting features can be implemented as:
1. **Monolith** (add to existing Next.js app)
2. **Microservices** (separate services on AKS)
3. **Serverless** (Azure Functions)

### Decision

**Implement as microservices deployed on Azure Kubernetes Service (AKS).**

### Rationale

**Why Microservices**:
- ✅ Aligns with learning goals (DevOps, Kubernetes, microservices)
- ✅ Independent scaling (payroll runs can be resource-intensive)
- ✅ Technology flexibility (can use different frameworks)
- ✅ Fault isolation (payroll failure doesn't affect student management)
- ✅ Team scalability (different developers can own services)
- ✅ Portfolio value (demonstrates enterprise architecture)

**Why Not Monolith**:
- ❌ Limited learning (no Kubernetes experience)
- ❌ Tight coupling (harder to maintain)
- ❌ Scaling challenges (must scale entire app)

**Why Not Serverless**:
- ❌ Cold start issues for payroll runs
- ❌ Timeout limits (Azure Functions: 10 min max)
- ❌ Harder to debug and monitor
- ❌ Less control over execution environment

### Service Boundaries

1. **Payroll Service**:
   - Employee management
   - Salary calculations (PAYE, NSSF, NHIF)
   - Payroll runs, payslips, P9 forms

2. **Accounting Service**:
   - Chart of Accounts, General Ledger
   - Journal entries (double-entry)
   - AP/AR, bank reconciliation

3. **Budgeting Service**:
   - Budget planning and tracking
   - Cash flow forecasting
   - Variance analysis

### Consequences

**Positive**:
- Real-world microservices experience
- Better separation of concerns
- Independent deployment and scaling
- Technology diversity possible

**Negative**:
- More infrastructure complexity (AKS, service mesh)
- Inter-service communication overhead
- Distributed transactions complexity
- Higher operational cost

**Mitigation**:
- Use Azure Service Bus for async communication
- Event-driven architecture (reduce coupling)
- Start with minimal replicas (cost optimization)
- Use Helm charts for easy deployment

---

## ADR-004: Terraform vs. Bicep for Infrastructure as Code

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

Azure infrastructure can be defined using:
1. **Terraform** (multi-cloud, HCL)
2. **Bicep** (Azure-native, DSL)
3. **ARM Templates** (JSON, verbose)

### Decision

**Use Terraform as primary IaC tool, provide Bicep examples for reference.**

### Rationale

**Why Terraform**:
- ✅ Multi-cloud (works with Supabase, AWS, GCP)
- ✅ Industry standard (more job opportunities)
- ✅ Larger ecosystem (modules, providers)
- ✅ Better state management
- ✅ Aligns with DevSecOps learning goals

**Why Not Bicep**:
- ❌ Azure-only (vendor lock-in)
- ❌ Less mature ecosystem
- ❌ Smaller community

**Why Not ARM**:
- ❌ JSON verbosity (harder to read/maintain)
- ❌ Being replaced by Bicep

### Consequences

**Positive**:
- Portable skills (applicable to AWS, GCP)
- Rich module ecosystem
- Better job market alignment

**Negative**:
- Azure-specific features may lag behind Bicep
- Need to install Terraform CLI (extra dependency)

**Implementation**:
- Primary: Terraform in `infrastructure/terraform/`
- Reference: Bicep examples in `infrastructure/bicep/` (optional)

---

## ADR-005: GitHub Actions vs. Azure DevOps for CI/CD

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

CI/CD can be implemented with:
1. **GitHub Actions** (if code is on GitHub)
2. **Azure DevOps Pipelines**
3. **Jenkins** (self-hosted)

### Decision

**Use GitHub Actions with Azure integration.**

### Rationale

**Why GitHub Actions**:
- ✅ Already using GitHub for source control
- ✅ Free for public repos (unlimited minutes)
- ✅ Free for private repos (2000 min/month)
- ✅ Native integration with Azure (azure/login action)
- ✅ Large marketplace of actions
- ✅ YAML-based (easy to version control)

**Why Not Azure DevOps**:
- ❌ Separate platform (context switching)
- ❌ Another tool to learn (time cost)
- ✅ Can still use for advanced scenarios later

**Why Not Jenkins**:
- ❌ Self-hosted (infrastructure cost)
- ❌ Maintenance overhead
- ❌ More complex setup

### Consequences

**Positive**:
- Single platform (GitHub for code + CI/CD)
- Easy collaboration (pull request checks)
- Excellent marketplace (security scanners)

**Negative**:
- GitHub dependency (vendor lock-in)
- Minute limits on free tier

**Mitigation**:
- Use self-hosted runners if minute limits reached
- Can migrate to Azure DevOps later (similar YAML syntax)

---

## ADR-006: Row-Level Security (RLS) for Multi-Tenancy

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

Multi-tenant data isolation can be achieved via:
1. **Application-level** filtering (WHERE school_id = ?)
2. **Database Row-Level Security** (RLS policies)
3. **Separate databases** per school

### Decision

**Use PostgreSQL Row-Level Security (RLS) policies.**

### Rationale

**Why RLS**:
- ✅ Security at database level (defense in depth)
- ✅ Prevents accidental data leaks (even if app has bugs)
- ✅ PostgreSQL native feature (no additional tools)
- ✅ Transparent to application code (once session configured)

**Why Not Application-Level Only**:
- ❌ Human error risk (forgetting WHERE clause)
- ❌ SQL injection could bypass filters
- ❌ No protection if attacker gets DB access

**Why Not Separate Databases**:
- ❌ Operational overhead (backup, maintenance per school)
- ❌ Cost (separate instances)
- ❌ Reporting complexity (cross-school analytics)

### Implementation

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "School isolation" ON students
  FOR ALL USING (school_id = current_setting('app.current_school_id')::uuid);

-- Set school context in application
-- await db.query("SET app.current_school_id = $1", [schoolId]);
```

### Consequences

**Positive**:
- Maximum security (database-enforced)
- Prevents data leaks
- Compliance-friendly (audit trail)

**Negative**:
- Slight performance overhead (policy evaluation)
- Requires setting session variable
- Debugging complexity (queries filtered silently)

**Mitigation**:
- Index `school_id` columns
- Centralize session setup (middleware)
- Add logging for RLS denials

---

## ADR-007: Kenya Tax Calculation (PAYE, NSSF, NHIF)

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

Payroll tax calculations can be:
1. **Hardcoded** in application
2. **Database-driven** (tax rules in tables)
3. **External API** (KRA integration)

### Decision

**Hardcoded tax brackets in TypeScript calculators with annual configuration updates.**

### Rationale

**Why Hardcoded**:
- ✅ Tax brackets change annually (not monthly)
- ✅ Faster calculation (no DB lookups)
- ✅ Type-safe (compile-time checks)
- ✅ Version controlled (Git history of changes)
- ✅ No external API dependency (KRA API unreliable)

**Why Not Database-Driven**:
- ❌ Unnecessary complexity for annual changes
- ❌ Performance overhead (extra queries)
- ❌ Type safety loss

**Why Not External API**:
- ❌ KRA API not available for tax calculations
- ❌ Dependency on external service (availability risk)

### Tax Rules (2026)

**PAYE Brackets**:
```typescript
const PAYE_BANDS = [
  { min: 0, max: 24000, rate: 0.10 },        // 10%
  { min: 24001, max: 32333, rate: 0.25 },    // 25%
  { min: 32334, max: 500000, rate: 0.30 },   // 30%
  { min: 500001, max: 800000, rate: 0.325 }, // 32.5%
  { min: 800001, max: null, rate: 0.35 },    // 35%
];
const PERSONAL_RELIEF = 2400; // KES per month
```

**NSSF**:
- Tier I: 6% up to KES 7,000 (max KES 420)
- Tier II: 6% from 7,001 to 36,000 (max KES 2,160)
- Employer matches employee contribution

**NHIF**:
- Tiered based on gross salary (18 bands)
- Fixed amount per band (KES 150 - KES 2,500)

**Housing Levy** (new in 2024):
- Employee: 1.5% of gross
- Employer: 1.5% of gross

### Consequences

**Positive**:
- Fast, reliable calculations
- Version controlled tax changes
- No external dependencies

**Negative**:
- Must manually update annually
- Not dynamic (can't adjust mid-year easily)

**Mitigation**:
- Set reminder for annual tax bracket updates (January)
- Unit tests to catch calculation errors
- Configuration file for easy updates

---

## ADR-008: Cost Optimization Strategy

**Date**: 2026-02-01
**Status**: ✅ Accepted

### Context

Need to stay within $200 Azure credits over 4 months (~$50/month).

### Decision

**Auto-scale AKS to zero during off-hours, use free tiers wherever possible.**

### Cost Optimization Tactics

1. **AKS Auto-Scaling**:
   - Scale to 0 nodes: 10 PM - 6 AM (save 8 hours/day = 33%)
   - Scale to 0 nodes: Weekends (save 2 days/week = 29%)
   - **Total Savings**: ~60% on compute

2. **Use Free Tiers**:
   - App Service: F1 (free tier)
   - Azure AD B2C: Free up to 50k MAU
   - Log Analytics: Free 5GB/month
   - Application Insights: Free 1GB/month
   - Sentinel: Free 10GB for first 31 days

3. **Burstable VMs**:
   - Use B-series (B1ms, B2s) instead of D-series
   - Save ~40% on VM costs

4. **Storage Optimization**:
   - LRS instead of GRS (cheaper, acceptable for learning)
   - 7-day backup retention (minimum)

5. **Budget Alerts**:
   - Alert at 50% ($25)
   - Alert at 80% ($40)
   - Forecast alert at 100%

### Target Costs

| Month | Services | Budget | Actual (Est.) |
|-------|----------|--------|---------------|
| 1 | PostgreSQL, App Service | $50 | $15 |
| 2 | + AKS, ACR, Sentinel | $50 | $45 |
| 3 | Full stack | $50 | $48 |
| 4 | Full stack + optimization | $50 | $35 |
| **Total** | | **$200** | **$143** |

**Savings**: $57 buffer for unexpected costs

### Consequences

**Positive**:
- Stay well within budget
- Learn FinOps principles
- Real-world cost optimization experience

**Negative**:
- Dev environment not 24/7 available
- Must schedule around auto-scaling

**Mitigation**:
- Manual scale-up for demos/testing
- Use local development when AKS is scaled down

---

## 📊 DECISION SUMMARY TABLE

| ADR | Decision | Status | Impact | Cost Impact |
|-----|----------|--------|--------|-------------|
| ADR-001 | Multi-cloud (Azure + Supabase IaC) | ✅ Accepted | High | Neutral |
| ADR-002 | PostgreSQL Flexible Server | ✅ Accepted | Medium | $15/month |
| ADR-003 | Microservices on AKS | ✅ Accepted | High | $30/month |
| ADR-004 | Terraform over Bicep | ✅ Accepted | Medium | None |
| ADR-005 | GitHub Actions over Azure DevOps | ✅ Accepted | Medium | Free |
| ADR-006 | Row-Level Security (RLS) | ✅ Accepted | High | None |
| ADR-007 | Hardcoded tax calculations | ✅ Accepted | Medium | None |
| ADR-008 | Auto-scaling cost optimization | ✅ Accepted | High | -60% savings |

---

## 🔄 REVIEW SCHEDULE

These decisions should be reviewed:
- **Monthly**: Cost optimization effectiveness
- **Quarterly**: Technology choices (new Azure features)
- **Annually**: Tax calculation rules (January)

---

**Last Updated**: February 1, 2026
**Next Review**: March 1, 2026
