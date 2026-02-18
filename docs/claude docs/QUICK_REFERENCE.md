# Quick Reference Guide
## SMS Azure Transformation

**Last Updated**: February 1, 2026 (Updated with Phase 0 completion)
**Azure Server**: psql-sms-dev-sci1tp18.postgres.database.azure.com

---

## 📚 Documentation Index

| Document | Purpose | Location |
|----------|---------|----------|
| **[TRANSFORMATION_ROADMAP.md](./TRANSFORMATION_ROADMAP.md)** | Master plan, timeline, all 72 files | Main reference |
| **[AZURE_MIGRATION_GUIDE.md](./AZURE_MIGRATION_GUIDE.md)** | Step-by-step Azure PostgreSQL migration | Week 0 guide |
| **[ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)** | Why we made key technical choices | Reference |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | This file - quick commands/links | Daily use |

---

## 🚀 Quick Start Commands

### Azure CLI Setup
```bash
# Install Azure CLI (Windows)
winget install Microsoft.AzureCLI

# Login
az login

# Set subscription
az account set --subscription "Azure subscription 1"

# Check credits remaining
az consumption usage list --start-date 2026-02-01 --end-date 2026-02-28
```

### Terraform Commands
```bash
cd infrastructure/terraform/environments/dev

# Initialize
terraform init

# Plan (dry-run)
terraform plan

# Apply changes
terraform apply

# Destroy everything (careful!)
terraform destroy

# Show current state
terraform show

# Get outputs (connection strings, etc.)
terraform output
```

### Database Commands
```bash
# Set connection string (ACTUAL SERVER)
export DATABASE_URL="postgresql://smsadmin:MySchool@Azure2026@psql-sms-dev-sci1tp18.postgres.database.azure.com:5432/school_management?sslmode=require"

# Quick connect (PowerShell - Windows)
.\infrastructure\migrations\connect-azure-db.bat

# Connect with psql
psql $DATABASE_URL

# Run migration
cd infrastructure/migrations
powershell -ExecutionPolicy Bypass -File run-migration.ps1

# Test connection
powershell -ExecutionPolicy Bypass -File test-connection.ps1

# List tables
psql $DATABASE_URL -c "\dt"

# Check database status
psql $DATABASE_URL -c "SELECT version();"

# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20260201.sql
```

### Database Dashboard (New!)
```bash
# Start dev server
npm run dev

# View visual dashboard
# Open browser: http://localhost:3000/db-status
# Shows: Connection status, all tables, row counts, sizes

# View JSON API
# Open browser: http://localhost:3000/api/db/status
# Returns: Full database info as JSON
```

### Next.js Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build
npm run build

# Start production server
npm start

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

### Docker Commands
```bash
# Build image
docker build -t sms-app:latest .

# Run locally
docker run -p 3000:3000 --env-file .env.local sms-app:latest

# Push to Azure Container Registry
az acr login --name acrsmsprod
docker tag sms-app:latest acrsmsprod.azurecr.io/sms-app:latest
docker push acrsmsprod.azurecr.io/sms-app:latest
```

### Kubernetes (AKS) Commands
```bash
# Get credentials
az aks get-credentials --resource-group rg-sms-dev --name aks-sms-dev

# View pods
kubectl get pods -n sms-dev

# View services
kubectl get services -n sms-dev

# View logs
kubectl logs -f deployment/sms-app -n sms-dev

# Scale deployment
kubectl scale deployment/sms-app --replicas=3 -n sms-dev

# Apply changes
kubectl apply -f kubernetes/base/deployment.yaml

# Port forward for debugging
kubectl port-forward service/sms-app 3000:3000 -n sms-dev
```

---

## 💰 Cost Monitoring

### Check Current Spend
```bash
# Cost analysis (last 30 days)
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --query "[].{Service:instanceName, Cost:pretaxCost}" \
  -o table

# Budget status
az consumption budget list -o table
```

### Cost Optimization Actions
```bash
# Stop AKS (save money when not using)
az aks stop --resource-group rg-sms-dev --name aks-sms-dev

# Start AKS
az aks start --resource-group rg-sms-dev --name aks-sms-dev

# Scale AKS to 0 nodes
az aks nodepool scale \
  --resource-group rg-sms-dev \
  --cluster-name aks-sms-dev \
  --name agentpool \
  --node-count 0

# Delete unused resources
az resource list --resource-group rg-sms-dev -o table
az resource delete --ids <resource-id>
```

---

## 🔐 Security Quick Commands

### Sentinel KQL Queries
```kql
// Failed login attempts (last 24h)
AppTraces
| where TimeGenerated > ago(24h)
| where Message contains "login failed"
| summarize FailedAttempts = count() by user_email = tostring(parse_json(Properties).email), bin(TimeGenerated, 5m)
| where FailedAttempts > 5

// Suspicious payment activity
AppTraces
| where TimeGenerated > ago(1h)
| where Message contains "payment"
| summarize TotalAmount = sum(todouble(parse_json(Properties).amount)) by school_id = tostring(parse_json(Properties).school_id)
| where TotalAmount > 1000000

// Unauthorized access attempts
AppTraces
| where Message contains "unauthorized" or Message contains "access denied"
| project TimeGenerated, user_email = tostring(parse_json(Properties).user_email), resource = tostring(parse_json(Properties).resource)
```

### Azure AD
```bash
# List users
az ad user list -o table

# Create user
az ad user create \
  --display-name "John Teacher" \
  --password "P@ssw0rd123!" \
  --user-principal-name john@yourschool.onmicrosoft.com

# Assign role
az role assignment create \
  --assignee john@yourschool.onmicrosoft.com \
  --role "Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-sms-dev
```

---

## 📊 Monitoring & Logging

### Application Insights
```bash
# Query logs (last 1 hour)
az monitor app-insights query \
  --app ai-sms-dev \
  --analytics-query "requests | where timestamp > ago(1h) | summarize count() by resultCode" \
  -o table

# View exceptions
az monitor app-insights query \
  --app ai-sms-dev \
  --analytics-query "exceptions | where timestamp > ago(24h) | project timestamp, type, outerMessage" \
  -o table
```

### Log Analytics
```bash
# Export logs
az monitor log-analytics query \
  --workspace law-sms-dev \
  --analytics-query "AzureDiagnostics | where ResourceType == 'POSTGRESQL'" \
  -o json > postgres-logs.json
```

---

## 🔄 Backup & Recovery

### PostgreSQL Backup
```bash
# Manual backup
az postgres flexible-server backup create \
  --resource-group rg-sms-dev \
  --name psql-sms-dev \
  --backup-name manual-backup-$(date +%Y%m%d)

# List backups
az postgres flexible-server backup list \
  --resource-group rg-sms-dev \
  --server-name psql-sms-dev \
  -o table

# Restore to point-in-time
az postgres flexible-server restore \
  --resource-group rg-sms-dev \
  --name psql-sms-dev-restored \
  --source-server psql-sms-dev \
  --restore-time "2026-02-01T12:00:00Z"
```

### Terraform State Backup
```bash
# Pull current state
cd infrastructure/terraform/environments/dev
terraform state pull > terraform-state-backup-$(date +%Y%m%d).json

# Push state (restore)
terraform state push terraform-state-backup-20260201.json
```

---

## 🧪 Testing

### Run All Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load test (Apache Bench)
ab -n 1000 -c 10 http://localhost:3000/api/students

# Security scan
npm audit
npm run lint
```

### Database Testing
```sql
-- Test RLS policies
SET app.current_school_id = '<school-uuid>';
SELECT * FROM students; -- Should only see this school's students

-- Test foreign key constraints
INSERT INTO users (school_id, email, name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'Test', 'admin');
-- Should fail (invalid school_id)

-- Performance test
EXPLAIN ANALYZE SELECT * FROM students WHERE school_id = '<uuid>';
```

---

## 📦 Deployment Checklist

### Pre-Deployment
- [ ] Run tests: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] Lint passes: `npm run lint`
- [ ] Security scan: `npm audit`
- [ ] Database migrations ready
- [ ] Environment variables configured

### Deployment Steps
```bash
# 1. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. Build Docker image
docker build -t sms-app:v1.0.0 .

# 3. Push to ACR
az acr login --name acrsmsprod
docker tag sms-app:v1.0.0 acrsmsprod.azurecr.io/sms-app:v1.0.0
docker push acrsmsprod.azurecr.io/sms-app:v1.0.0

# 4. Update Kubernetes
kubectl set image deployment/sms-app \
  sms-app=acrsmsprod.azurecr.io/sms-app:v1.0.0 \
  -n sms-prod

# 5. Verify deployment
kubectl rollout status deployment/sms-app -n sms-prod

# 6. Smoke test
curl https://sms.yourdomain.com/api/health
```

### Post-Deployment
- [ ] Verify application is running
- [ ] Check logs for errors
- [ ] Run smoke tests
- [ ] Monitor performance metrics
- [ ] Notify team of deployment

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
az postgres flexible-server show \
  --resource-group rg-sms-dev \
  --name psql-sms-dev \
  --query state

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group rg-sms-dev \
  --server-name psql-sms-dev \
  -o table

# Test connection
psql "host=psql-sms-dev.postgres.database.azure.com user=smsadmin dbname=school_management sslmode=require"
```

**AKS Pod Not Starting**
```bash
# Describe pod for events
kubectl describe pod <pod-name> -n sms-dev

# View logs
kubectl logs <pod-name> -n sms-dev --previous

# Check resource limits
kubectl top pods -n sms-dev

# Check secrets
kubectl get secrets -n sms-dev
```

**High Azure Costs**
```bash
# Identify expensive resources
az consumption usage list \
  --start-date 2026-02-01 \
  --end-date 2026-02-28 \
  --query "sort_by([].{Resource:instanceName, Cost:pretaxCost}, &Cost)" \
  -o table

# Stop non-essential services
az aks stop --resource-group rg-sms-dev --name aks-sms-dev
```

---

## 🔗 Important Links

### Azure Portal
- [Azure Portal](https://portal.azure.com)
- [Cost Management](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview)
- [Microsoft Sentinel](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/microsoft.securityinsightsarg%2Fsentinel)
- [Application Insights](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/microsoft.insights%2Fcomponents)

### Documentation
- [Azure PostgreSQL Docs](https://learn.microsoft.com/en-us/azure/postgresql/)
- [AKS Docs](https://learn.microsoft.com/en-us/azure/aks/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [KQL Reference](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/)

### Tools
- [Azure CLI Docs](https://learn.microsoft.com/en-us/cli/azure/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Terraform Commands](https://www.terraform.io/cli/commands)

---

## 📞 Support

### Get Help
- **Azure Support**: [Azure Support Portal](https://portal.azure.com/#view/Microsoft_Azure_Support/HelpAndSupportBlade)
- **Community**: [Stack Overflow - Azure](https://stackoverflow.com/questions/tagged/azure)
- **Documentation**: All docs in `/docs` folder

### Emergency Contacts
- **Project Owner**: You
- **Backup**: [Your backup contact]

---

**Quick Reference v1.0**
**Created**: February 1, 2026
**Last Updated**: February 1, 2026
