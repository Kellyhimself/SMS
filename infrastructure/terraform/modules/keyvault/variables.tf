# ============================================
# KEY VAULT MODULE - VARIABLES
# ============================================

variable "keyvault_name" {
  description = "Name of the Key Vault (must be globally unique, 3-24 chars)"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]{3,24}$", var.keyvault_name))
    error_message = "Key Vault name must be 3-24 characters, alphanumeric and hyphens only."
  }
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "sku_name" {
  description = "SKU name (standard or premium)"
  type        = string
  default     = "standard"

  validation {
    condition     = contains(["standard", "premium"], var.sku_name)
    error_message = "SKU must be 'standard' or 'premium'."
  }
}

variable "soft_delete_retention_days" {
  description = "Soft delete retention period in days"
  type        = number
  default     = 7

  validation {
    condition     = var.soft_delete_retention_days >= 7 && var.soft_delete_retention_days <= 90
    error_message = "Soft delete retention must be between 7 and 90 days."
  }
}

variable "purge_protection_enabled" {
  description = "Enable purge protection"
  type        = bool
  default     = false  # Disabled for development
}

variable "network_acls_default_action" {
  description = "Default action for network ACLs"
  type        = string
  default     = "Allow"  # Allow all for development

  validation {
    condition     = contains(["Allow", "Deny"], var.network_acls_default_action)
    error_message = "Network ACLs default action must be 'Allow' or 'Deny'."
  }
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for Key Vault access"
  type        = list(string)
  default     = []
}

variable "allowed_subnet_ids" {
  description = "Allowed subnet IDs for Key Vault access"
  type        = list(string)
  default     = []
}

variable "aks_kubelet_identity_object_id" {
  description = "AKS Kubelet identity object ID for access policy"
  type        = string
  default     = ""
}

variable "store_database_secrets" {
  description = "Store database secrets in Key Vault"
  type        = bool
  default     = false
}

variable "database_connection_string" {
  description = "Database connection string"
  type        = string
  default     = ""
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "store_acr_secrets" {
  description = "Store ACR secrets in Key Vault"
  type        = bool
  default     = false
}

variable "acr_admin_password" {
  description = "ACR admin password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

# ============================================
# APPLICATION SECRETS
# ============================================

variable "store_app_secrets" {
  description = "Store application secrets in Key Vault"
  type        = bool
  default     = false
}

variable "app_secrets" {
  description = "Map of application secrets to store in Key Vault"
  type        = map(string)
  default     = {}
  sensitive   = true
}
