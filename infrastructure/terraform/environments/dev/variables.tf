# ============================================
# DEVELOPMENT ENVIRONMENT - VARIABLES
# ============================================

# ============================================
# ENVIRONMENT
# ============================================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus2" # 10% cheaper than eastus, better capacity

  validation {
    condition = contains([
      "eastus",
      "eastus2",
      "westus",
      "westus2",
      "centralus"
    ], var.location)
    error_message = "Location must be a valid US region for cost optimization."
  }
}

# ============================================
# POSTGRESQL CONFIGURATION
# ============================================

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "school_management"
}

variable "postgres_sku_name" {
  description = "PostgreSQL SKU (B_Standard_B1ms for cost-optimized)"
  type        = string
  default     = "B_Standard_B1ms" # $12/month
}

variable "postgres_storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = 32768 # 32 GB (minimum)
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "availability_zone" {
  description = "Availability zone (1, 2, 3, or empty for auto-select)"
  type        = string
  default     = "" # Empty = let Azure choose (better for free subscriptions)
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7 # Minimum for cost savings
}

# ============================================
# CREDENTIALS
# IMPORTANT: Use environment variables or Azure Key Vault in production
# ============================================

variable "postgres_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "smsadmin"
  sensitive   = true
}

variable "postgres_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
  # Set via environment variable: TF_VAR_postgres_admin_password
  # or via terraform.tfvars (gitignored)
}

# ============================================
# NETWORK ACCESS
# ============================================

variable "public_network_access_enabled" {
  description = "Enable public network access"
  type        = bool
  default     = true # True for development, false for production
}

variable "local_ip_address" {
  description = "Your local IP for development access"
  type        = string
  default     = "" # Will be set at runtime or via tfvars

  # Get your IP: curl -s ifconfig.me
  # Or set via: TF_VAR_local_ip_address=$(curl -s ifconfig.me)
}

variable "allowed_ip_ranges" {
  description = "Additional allowed IP ranges"
  type = map(object({
    start = string
    end   = string
  }))
  default = {
    # Example: Uncomment and customize
    # "school-office" = {
    #   start = "203.0.113.1"
    #   end   = "203.0.113.10"
    # }
  }
}

# ============================================
# PERFORMANCE
# ============================================

variable "max_connections" {
  description = "Maximum PostgreSQL connections"
  type        = string
  default     = "100" # Adequate for development
}

# ============================================
# TAGS
# ============================================

variable "common_tags" {
  description = "Common resource tags"
  type        = map(string)
  default = {
    Project     = "SchoolManagementSystem"
    ManagedBy   = "Terraform"
    Environment = "Development"
    CostCenter  = "Learning"
    Owner       = "DevOps-Team"
  }
}

# ============================================
# COST MANAGEMENT
# ============================================

variable "total_budget_amount" {
  description = "Total budget for entire Azure subscription (4 months)"
  type        = number
  default     = 200
}

variable "monthly_budget_amount" {
  description = "Monthly budget amount"
  type        = number
  default     = 50
}

variable "budget_start_date" {
  description = "Budget start date (ISO 8601 format: YYYY-MM-DD)"
  type        = string
  default     = "2026-02-01"
}

variable "budget_end_date" {
  description = "Budget end date (ISO 8601 format: YYYY-MM-DD). Leave empty for no end date."
  type        = string
  default     = "2026-05-31"
}

variable "alert_email_addresses" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  # Set via terraform.tfvars (required)
}

variable "owner_email" {
  description = "Email address of project owner"
  type        = string
  # Set via terraform.tfvars (required)
}

variable "cost_center" {
  description = "Cost center for budget tracking"
  type        = string
  default     = "Learning & Development"
}

variable "current_phase" {
  description = "Current project phase (Phase0, Phase1, etc.)"
  type        = string
  default     = "Phase1"
}

# ============================================
# PHASE 1: AKS CONFIGURATION
# ============================================

variable "aks_kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.28"
}

variable "aks_node_count" {
  description = "Number of nodes in the AKS node pool"
  type        = number
  default     = 1
}

variable "aks_node_vm_size" {
  description = "VM size for AKS nodes (Standard_B2s for cost-optimized)"
  type        = string
  default     = "Standard_B2s"
}

# ============================================
# PHASE 1: AZURE CONTAINER REGISTRY
# ============================================

variable "acr_name" {
  description = "Azure Container Registry name (globally unique, 5-50 alphanumeric characters)"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9]{5,50}$", var.acr_name))
    error_message = "ACR name must be 5-50 alphanumeric characters only (no hyphens or special characters)."
  }
}

# ============================================
# PHASE 1: AZURE KEY VAULT
# ============================================

variable "keyvault_name" {
  description = "Azure Key Vault name (globally unique, 3-24 characters, alphanumeric and hyphens)"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]{1,22}[a-zA-Z0-9]$", var.keyvault_name))
    error_message = "Key Vault name must be 3-24 characters, start with letter, end with alphanumeric, contain only alphanumeric and hyphens."
  }
}

# ============================================
# APPLICATION SECRETS
# ============================================

variable "resend_api_key" {
  description = "Resend API key for email notifications"
  type        = string
  default     = "REPLACE_WITH_ACTUAL_KEY"
  sensitive   = true
}
