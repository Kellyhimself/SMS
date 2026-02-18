# ============================================
# SCHOOL MANAGEMENT SYSTEM - DEVELOPMENT ENVIRONMENT
# Azure PostgreSQL Infrastructure
# ============================================

# ============================================
# MODULE: AZURE POSTGRESQL
# ============================================

module "postgresql" {
  source = "../../modules/azure-postgresql"

  # Resource Group
  resource_group_name = "rg-sms-${var.environment}"
  location            = var.location
  environment         = var.environment

  # Database Configuration
  database_name = var.database_name

  # Server Configuration
  sku_name          = var.postgres_sku_name
  storage_mb        = var.postgres_storage_mb
  postgres_version  = var.postgres_version
  availability_zone = var.availability_zone

  # Credentials
  admin_username = var.postgres_admin_username
  admin_password = var.postgres_admin_password

  # Backup
  backup_retention_days = var.backup_retention_days

  # Network Access
  public_network_access_enabled = var.public_network_access_enabled
  local_ip_address               = var.local_ip_address
  allowed_ip_ranges              = var.allowed_ip_ranges

  # Performance
  max_connections = var.max_connections

  # Tags
  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      DeployedBy  = "Terraform"
      Owner       = "DevOps-Team"
    }
  )
}

# ============================================
# MODULE: COST MANAGEMENT
# ============================================

module "cost_management" {
  source = "../../modules/cost-management"

  # Environment
  environment = var.environment

  # Budget Configuration
  total_budget_amount   = var.total_budget_amount
  monthly_budget_amount = var.monthly_budget_amount
  budget_start_date     = var.budget_start_date
  budget_end_date       = var.budget_end_date

  # Resource Group (for resource-specific budget)
  resource_group_id = module.postgresql.resource_group_id

  # Alert Configuration
  alert_email_addresses = var.alert_email_addresses

  # Cost Tracking
  cost_center   = var.cost_center
  current_phase = var.current_phase
  owner_email   = var.owner_email
}

# ============================================
# MODULE: VIRTUAL NETWORK (Phase 1)
# ============================================

module "vnet" {
  source = "../../modules/vnet"

  vnet_name           = "vnet-sms-${var.environment}"
  location            = var.location
  resource_group_name = module.postgresql.resource_group_name

  # Network configuration
  address_space                 = ["10.0.0.0/16"]
  aks_subnet_address_prefixes   = ["10.0.1.0/24"]

  # Optional subnets (disabled for cost savings)
  create_database_subnet = false
  create_appgw_subnet    = false
  create_nat_gateway     = false

  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Component   = "Networking"
    }
  )
}

# ============================================
# MODULE: LOG ANALYTICS (Phase 1)
# ============================================

module "log_analytics" {
  source = "../../modules/log-analytics"

  workspace_name      = "law-sms-${var.environment}"
  location            = var.location
  resource_group_name = module.postgresql.resource_group_name

  # Retention and quota
  retention_in_days = 30
  daily_quota_gb    = -1  # Unlimited

  # Solutions
  enable_container_insights = true
  enable_security_center    = true
  enable_azure_activity     = true

  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Component   = "Monitoring"
    }
  )
}

# ============================================
# MODULE: MICROSOFT SENTINEL (Phase 1)
# ============================================

module "sentinel" {
  source = "../../modules/sentinel"

  location                       = var.location
  resource_group_name            = module.postgresql.resource_group_name
  log_analytics_workspace_id     = module.log_analytics.id
  log_analytics_workspace_name   = module.log_analytics.name

  # Data connectors
  enable_azure_activity_connector = true
  enable_aad_connector            = false  # Requires additional permissions

  # Sample rules for learning (disabled - create manually in Portal after deployment)
  create_sample_rules      = false
  create_sample_watchlists = false

  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Component   = "Security"
    }
  )

  depends_on = [
    module.log_analytics
  ]
}

# ============================================
# MODULE: AZURE CONTAINER REGISTRY (Phase 1)
# ============================================

module "acr" {
  source = "../../modules/acr"

  registry_name       = var.acr_name
  location            = var.location
  resource_group_name = module.postgresql.resource_group_name

  # SKU and access
  sku           = "Basic"  # Cost-optimized
  admin_enabled = true     # For development

  # Network access
  public_network_access_enabled = true

  environment = var.environment
  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Component   = "ContainerRegistry"
    }
  )
}

# ============================================
# MODULE: AZURE KEY VAULT (Phase 1)
# ============================================

module "keyvault" {
  source = "../../modules/keyvault"

  keyvault_name       = var.keyvault_name
  location            = var.location
  resource_group_name = module.postgresql.resource_group_name

  # Configuration
  sku_name                       = "standard"
  soft_delete_retention_days     = 7
  purge_protection_enabled       = false  # Disabled for development
  network_acls_default_action    = "Allow"  # Allow all for development

  # AKS access
  aks_kubelet_identity_object_id = module.aks.kubelet_identity_object_id

  # Database secrets
  store_database_secrets = true
  database_password      = var.postgres_admin_password

  # Application secrets
  store_app_secrets = true
  app_secrets = {
    AZURE-POSTGRES-HOST     = module.postgresql.server_fqdn
    AZURE-POSTGRES-DATABASE = var.database_name
    AZURE-POSTGRES-USER     = var.postgres_admin_username
    AZURE-POSTGRES-PASSWORD = var.postgres_admin_password
    RESEND-API-KEY          = var.resend_api_key
  }

  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Component   = "Security"
    }
  )

  depends_on = [
    module.aks,
    module.postgresql
  ]
}

# ============================================
# MODULE: AZURE KUBERNETES SERVICE (Phase 1)
# ============================================

module "aks" {
  source = "../../modules/aks"

  cluster_name        = "aks-sms-${var.environment}"
  location            = var.location
  resource_group_name = module.postgresql.resource_group_name
  dns_prefix          = "aks-sms-${var.environment}"

  # Kubernetes version
  kubernetes_version = var.aks_kubernetes_version

  # Node pool configuration (cost-optimized)
  node_count          = var.aks_node_count
  node_vm_size        = var.aks_node_vm_size
  os_disk_size_gb     = 30
  enable_auto_scaling = false

  # Network configuration
  subnet_id       = module.vnet.aks_subnet_id
  network_plugin  = "azure"
  network_policy  = "azure"
  dns_service_ip  = "10.2.0.10"
  service_cidr    = "10.2.0.0/16"

  # Monitoring
  log_analytics_workspace_id = module.log_analytics.id

  # ACR integration
  acr_id = module.acr.id

  # RBAC (empty for now, configure later)
  admin_group_object_ids = []

  environment = var.environment
  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Component   = "Kubernetes"
    }
  )

  depends_on = [
    module.vnet,
    module.log_analytics,
    module.acr
  ]
}

# ============================================
# INTER-MODULE PERMISSIONS
# ============================================

# Grant AKS access to pull images from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = module.aks.kubelet_identity_object_id
  role_definition_name             = "AcrPull"
  scope                            = module.acr.id
  skip_service_principal_aad_check = true

  depends_on = [
    module.aks,
    module.acr
  ]
}

# Grant AKS access to Key Vault secrets
resource "azurerm_key_vault_access_policy" "aks_keyvault_access" {
  key_vault_id = module.keyvault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = module.aks.kubelet_identity_object_id

  secret_permissions = [
    "Get", "List"
  ]

  certificate_permissions = [
    "Get", "List"
  ]

  depends_on = [
    module.aks,
    module.keyvault
  ]
}

# Grant current user AKS cluster admin access
resource "azurerm_role_assignment" "current_user_aks_admin" {
  principal_id         = data.azurerm_client_config.current.object_id
  role_definition_name = "Azure Kubernetes Service RBAC Cluster Admin"
  scope                = module.aks.cluster_id

  depends_on = [
    module.aks
  ]
}

# Get current client config
data "azurerm_client_config" "current" {}

# ============================================
# OUTPUTS
# Pass through module outputs
# ============================================

output "resource_group_name" {
  description = "Name of the resource group"
  value       = module.postgresql.resource_group_name
}

output "postgres_server_name" {
  description = "PostgreSQL server name"
  value       = module.postgresql.server_name
}

output "postgres_server_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = module.postgresql.server_fqdn
}

output "postgres_database_name" {
  description = "Database name"
  value       = module.postgresql.database_name
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = module.postgresql.connection_string
  sensitive   = true
}

output "env_vars" {
  description = "Environment variables for Next.js"
  value       = module.postgresql.env_vars
  sensitive   = true
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost"
  value       = module.postgresql.estimated_monthly_cost
}

output "next_steps" {
  description = "Next steps after deployment"
  value       = module.postgresql.next_steps
  sensitive   = true  # Contains password in connection string
}

# ============================================
# COST MANAGEMENT OUTPUTS
# ============================================

output "budget_summary" {
  description = "Cost management budget summary"
  value       = module.cost_management.alert_summary
}

output "overall_budget_id" {
  description = "Overall budget resource ID"
  value       = module.cost_management.overall_budget_id
}

output "monthly_budget_id" {
  description = "Monthly budget resource ID"
  value       = module.cost_management.monthly_budget_id
}

output "cost_tracking_tags" {
  description = "Cost tracking tags applied to resources"
  value       = module.cost_management.cost_tracking_tags
}

# ============================================
# PHASE 1 OUTPUTS
# ============================================

# VNet outputs
output "vnet_id" {
  description = "Virtual network ID"
  value       = module.vnet.vnet_id
}

output "aks_subnet_id" {
  description = "AKS subnet ID"
  value       = module.vnet.aks_subnet_id
}

# AKS outputs
output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.cluster_name
}

output "aks_cluster_fqdn" {
  description = "AKS cluster FQDN"
  value       = module.aks.cluster_fqdn
}

output "aks_kubeconfig" {
  description = "Kubernetes configuration"
  value       = module.aks.kubeconfig
  sensitive   = true
}

output "kubectl_connect_command" {
  description = "Command to connect kubectl"
  value       = module.aks.kubectl_connect_command
}

# ACR outputs
output "acr_name" {
  description = "Container registry name"
  value       = module.acr.name
}

output "acr_login_server" {
  description = "Container registry login server"
  value       = module.acr.login_server
}

output "acr_admin_username" {
  description = "ACR admin username"
  value       = module.acr.admin_username
  sensitive   = true
}

output "docker_login_command" {
  description = "Command to login to ACR"
  value       = module.acr.docker_login_command
}

# Key Vault outputs
output "keyvault_name" {
  description = "Key Vault name"
  value       = module.keyvault.name
}

output "keyvault_uri" {
  description = "Key Vault URI"
  value       = module.keyvault.vault_uri
}

# Log Analytics outputs
output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = module.log_analytics.workspace_id
}

output "log_analytics_workspace_name" {
  description = "Log Analytics workspace name"
  value       = module.log_analytics.name
}

# Sentinel outputs
output "sentinel_enabled" {
  description = "Microsoft Sentinel enabled"
  value       = true
}

# Key Vault secrets verification
output "keyvault_secrets_verification" {
  description = "Commands to verify Key Vault secrets"
  value = <<-EOT
    Verify secrets are stored in Key Vault:

    # List all secrets
    az keyvault secret list --vault-name ${module.keyvault.name} -o table

    # View specific secret (for debugging)
    az keyvault secret show --vault-name ${module.keyvault.name} --name AZURE-POSTGRES-HOST

    Expected secrets:
    - AZURE-POSTGRES-HOST
    - AZURE-POSTGRES-DATABASE
    - AZURE-POSTGRES-USER
    - AZURE-POSTGRES-PASSWORD
    - RESEND-API-KEY
    - database-connection-string
    - database-password
  EOT
}

# Combined next steps
output "phase_1_next_steps" {
  description = "Next steps for Phase 1"
  value = <<-EOT
    ✅ Phase 1 Infrastructure Deployed Successfully!

    📋 Resources Created:
    - Virtual Network: ${module.vnet.vnet_name}
    - AKS Cluster: ${module.aks.cluster_name}
    - Container Registry: ${module.acr.login_server}
    - Key Vault: ${module.keyvault.name}
    - Log Analytics: ${module.log_analytics.name}
    - Microsoft Sentinel: Enabled

    🔧 Connect to AKS:
    ${module.aks.kubectl_connect_command}
    kubectl get nodes
    kubectl get pods --all-namespaces

    🐳 Login to ACR:
    ${module.acr.docker_login_command}

    📊 View Logs (KQL):
    - Go to Azure Portal > Log Analytics Workspace
    - Run KQL queries in "Logs" section

    🔐 Access Key Vault:
    az keyvault secret list --vault-name ${module.keyvault.name}

    🛡️ View Security (Sentinel):
    - Go to Azure Portal > Microsoft Sentinel
    - Select workspace: ${module.log_analytics.name}
    - View incidents, hunting queries, and analytics rules

    💰 Total Phase 1 Cost: ~$39.60/month
    - AKS: $30
    - ACR: $5
    - Log Analytics: $2
    - Sentinel: $2
    - Key Vault: $0.60 (with secrets)

    ✅ Completed:
    - ✓ Containerized Next.js application (Docker multi-stage build)
    - ✓ Pushed Docker image to ACR (v1.0.0)
    - ✓ Created Kubernetes manifests (Deployment, Service, ConfigMap)
    - ✓ Integrated Azure Key Vault CSI Driver for secrets
    - ✓ Stored secrets in Key Vault (PostgreSQL, Resend API)

    📚 Next Steps:
    1. Deploy application to AKS:
       cd kubernetes/dev && ./deploy.ps1

    2. Verify deployment:
       kubectl get pods -l app=sms-app
       kubectl get service sms-app-service

    3. Test application:
       curl http://<EXTERNAL-IP>/api/health

    4. Set up CI/CD pipeline with DevSecOps:
       - GitHub Actions workflow
       - SAST scanning (CodeQL, Semgrep)
       - Dependency scanning (Snyk)
       - Container scanning (Trivy)
       - DAST scanning (OWASP ZAP)
  EOT
}
