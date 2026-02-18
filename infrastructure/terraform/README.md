# Terraform Infrastructure - School Management System
## Azure PostgreSQL Deployment

This Terraform configuration deploys Azure Database for PostgreSQL Flexible Server for the School Management System.

---

## 📁 Directory Structure

```
infrastructure/terraform/
├── providers.tf                    # Terraform provider configuration
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
├── modules/
│   └── azure-postgresql/           # PostgreSQL module
│       ├── main.tf                 # Main resources
│       ├── variables.tf            # Input variables
│       └── outputs.tf              # Output values
└── environments/
    └── dev/                        # Development environment
        ├── main.tf                 # Environment configuration
        ├── variables.tf            # Environment variables
        └── terraform.tfvars.example # Example values (copy to terraform.tfvars)
```

---

## 🚀 Prerequisites

### 1. Install Required Tools

**Azure CLI** (for authentication):
```bash
# Windows (winget)
winget install Microsoft.AzureCLI

# Or download from: https://aka.ms/installazurecliwindows
```

**Terraform** (Infrastructure as Code):
```bash
# Windows (Chocolatey)
choco install terraform

# Or download from: https://www.terraform.io/downloads
```

**PostgreSQL Client** (for testing):
```bash
# Windows (Chocolatey)
choco install postgresql --params '/Password:postgres'

# Or download from: https://www.postgresql.org/download/windows/
```

### 2. Verify Installations

```bash
az --version       # Should show Azure CLI 2.x
terraform --version # Should show Terraform 1.6+
psql --version     # Should show PostgreSQL 15+
```

### 3. Azure Account Setup

```bash
# Login to Azure
az login

# List your subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "Azure subscription 1"

# Verify
az account show
```

---

## 💰 Cost Estimate

### Development Environment (B1ms)

| Resource | Configuration | Monthly Cost |
|----------|---------------|--------------|
| **PostgreSQL Server** | B1ms (1 vCore, 2GB RAM) | $12.00 |
| **Storage** | 32GB LRS | $3.20 |
| **Backup** | 7-day retention | $0.80 |
| **Bandwidth** | Outbound transfers | ~$1.00 |
| **TOTAL** | | **~$17.00/month** |

**Covered by**: Azure $200 free credits (enough for ~11 months)

---

## 📝 Deployment Steps

### Step 1: Create Terraform Variables File

```bash
cd infrastructure/terraform/environments/dev

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars (use VS Code or any editor)
code terraform.tfvars
```

**Set these required values in `terraform.tfvars`**:

```hcl
# REQUIRED: Set a strong password
postgres_admin_password = "YourSecureP@ssw0rd123!"

# OPTIONAL: Set your local IP for development access
# Get your IP: curl -s ifconfig.me
local_ip_address = "203.0.113.42"  # Replace with your actual IP
```

### Step 2: Initialize Terraform

```bash
# Make sure you're in the dev environment directory
cd infrastructure/terraform/environments/dev

# Initialize Terraform (downloads providers)
terraform init
```

**Expected output**:
```
Initializing modules...
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/azurerm versions matching "~> 3.100.0"...
- Installing hashicorp/azurerm v3.100.0...
Terraform has been successfully initialized!
```

### Step 3: Review the Plan

```bash
# See what Terraform will create
terraform plan

# Save the plan to a file (optional)
terraform plan -out=tfplan
```

**Expected resources to be created**:
- 1 Resource Group (`rg-sms-dev`)
- 1 PostgreSQL Flexible Server (`psql-sms-dev-xxxxxxxx`)
- 1 Database (`school_management`)
- 2-3 Firewall Rules (Azure services, local IP)
- 4 Server Configurations (max_connections, shared_buffers, etc.)

### Step 4: Deploy Infrastructure

```bash
# Apply the configuration
terraform apply

# Review the plan and type 'yes' when prompted
```

**Deployment time**: 5-10 minutes

**Expected output**:
```
Apply complete! Resources: 8 added, 0 changed, 0 destroyed.

Outputs:

connection_string = <sensitive>
estimated_monthly_cost = {
  "compute_cost" = 12
  "storage_cost" = 3.2
  "backup_cost" = 0.8
  "total_cost" = 16
}
postgres_server_fqdn = "psql-sms-dev-abc12345.postgres.database.azure.com"
...
```

### Step 5: Get Connection Information

```bash
# View all outputs
terraform output

# Get connection string (sensitive, won't show by default)
terraform output -raw connection_string

# Get environment variables for Next.js
terraform output -json env_vars | jq -r 'to_entries[] | "\(.key)=\(.value)"'
```

### Step 6: Test Connection

```bash
# Get connection string
CONNECTION_STRING=$(terraform output -raw connection_string)

# Test connection with psql
psql "$CONNECTION_STRING"

# Should see: school_management=>
```

**If connection works**:
```sql
-- Check PostgreSQL version
SELECT version();

-- List databases
\l

-- Exit
\q
```

---

## 🔧 Common Operations

### View Current Infrastructure

```bash
# Show current state
terraform show

# List all resources
terraform state list

# Show specific resource
terraform state show module.postgresql.azurerm_postgresql_flexible_server.main
```

### Update Infrastructure

```bash
# Make changes to terraform.tfvars or *.tf files

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Destroy Infrastructure

**⚠️ WARNING: This will DELETE all resources and DATA!**

```bash
# Destroy all resources
terraform destroy

# Type 'yes' to confirm
```

### Backup Terraform State

```bash
# Export current state
terraform state pull > terraform-state-backup-$(date +%Y%m%d).json

# Restore state (if needed)
terraform state push terraform-state-backup-20260201.json
```

---

## 🔐 Security Best Practices

### 1. Never Commit Secrets

**Files to NEVER commit**:
- `terraform.tfvars` (contains passwords)
- `*.tfstate` (contains sensitive outputs)
- `*.tfstate.backup`

**Already gitignored**: See `.gitignore`

### 2. Use Strong Passwords

Password requirements:
- ✅ 8-128 characters
- ✅ Contains uppercase letter
- ✅ Contains lowercase letter
- ✅ Contains number
- ✅ Contains special character (@$!%*?&)

Generate secure password:
```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,63,64) | Get-Random -Count 16 | % {[char]$_})

# Or use: https://passwordsgenerator.net/
```

### 3. Use Environment Variables

Instead of `terraform.tfvars`, use environment variables:

```bash
# Windows PowerShell
$env:TF_VAR_postgres_admin_password = "YourSecureP@ssw0rd123!"
$env:TF_VAR_local_ip_address = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Linux/Mac
export TF_VAR_postgres_admin_password="YourSecureP@ssw0rd123!"
export TF_VAR_local_ip_address=$(curl -s ifconfig.me)

terraform apply
```

### 4. Restrict Network Access

For production:
- Set `public_network_access_enabled = false`
- Use Azure Private Link
- Remove local IP firewall rules

---

## 📊 Monitoring & Costs

### Check Current Costs

```bash
# View current month spending
az consumption usage list \
  --start-date 2026-02-01 \
  --end-date 2026-02-28 \
  --query "[?instanceName=='psql-sms-dev*'].{Service:instanceName, Cost:pretaxCost}" \
  --output table
```

### Set Budget Alerts

```bash
# Create budget (via Azure Portal or CLI)
az consumption budget create \
  --resource-group rg-sms-dev \
  --budget-name sms-monthly-budget \
  --amount 50 \
  --time-grain Monthly \
  --time-period start=2026-02-01 \
  --threshold 80
```

### Cost Optimization

```bash
# Stop database (not supported for Flexible Server, but can delete/recreate)
# Instead, scale down to B1ms (already cheapest) or delete when not in use

terraform destroy  # Delete everything
terraform apply    # Recreate when needed (5-10 min)
```

---

## 🐛 Troubleshooting

### Error: "Connection refused"

**Cause**: Firewall not configured correctly

**Solution**:
```bash
# Check your current IP
curl -s ifconfig.me

# Update terraform.tfvars
local_ip_address = "your-actual-ip"

# Apply changes
terraform apply
```

### Error: "Password does not meet requirements"

**Cause**: Weak password in `terraform.tfvars`

**Solution**:
- Use at least 8 characters
- Include uppercase, lowercase, number, special character
- Example: `SecureP@ssw0rd123!`

### Error: "Resource already exists"

**Cause**: Terraform state out of sync

**Solution**:
```bash
# Import existing resource
terraform import module.postgresql.azurerm_resource_group.main /subscriptions/{subscription-id}/resourceGroups/rg-sms-dev

# Or destroy and recreate
terraform destroy
terraform apply
```

### Error: "Insufficient credits"

**Cause**: Azure credits depleted

**Solution**:
- Check credit balance: `az account show`
- Optimize costs (already using cheapest SKU)
- Migrate to Supabase (free tier) using IaC

---

## 📚 Next Steps

After successful deployment:

1. **✅ Run database migrations**
   ```bash
   psql "$(terraform output -raw connection_string)" < ../../migrations/migrate-to-azure.sql
   ```

2. **✅ Update Next.js `.env.local`**
   ```bash
   terraform output -json env_vars | jq -r 'to_entries[] | "\(.key)=\(.value)"' > .env.azure
   ```

3. **✅ Test Next.js app locally**
   ```bash
   npm run dev
   ```

4. **✅ Create Supabase IaC** (for future migration)
   See: `docs/AZURE_MIGRATION_GUIDE.md`

---

## 📞 Support

- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/postgresql_flexible_server
- **Azure PostgreSQL Docs**: https://learn.microsoft.com/en-us/azure/postgresql/
- **Project Docs**: `../../docs/`

---

**Created**: February 1, 2026
**Last Updated**: February 1, 2026
**Terraform Version**: >= 1.6.0
**Azure Provider**: ~> 3.100.0
