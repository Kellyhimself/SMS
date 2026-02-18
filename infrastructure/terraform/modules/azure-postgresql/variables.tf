# ============================================
# AZURE POSTGRESQL MODULE - VARIABLES
# ============================================

# ============================================
# REQUIRED VARIABLES
# ============================================

variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_username) >= 3 && length(var.admin_username) <= 63
    error_message = "Admin username must be between 3 and 63 characters."
  }

  validation {
    condition     = !contains(["admin", "administrator", "root", "postgres"], lower(var.admin_username))
    error_message = "Admin username cannot be reserved names (admin, administrator, root, postgres)."
  }
}

variable "admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_password) >= 8 && length(var.admin_password) <= 128
    error_message = "Password must be between 8 and 128 characters."
  }

  validation {
    # Simplified validation: just check that password contains required characters
    # This allows ANY special characters, making it compatible with more password policies
    condition = (
      can(regex("[a-z]", var.admin_password)) &&  # Has lowercase
      can(regex("[A-Z]", var.admin_password)) &&  # Has uppercase
      can(regex("[0-9]", var.admin_password)) &&  # Has digit
      can(regex("[^A-Za-z0-9]", var.admin_password))  # Has special char (any non-alphanumeric)
    )
    error_message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
  }
}

# ============================================
# OPTIONAL VARIABLES (with defaults)
# ============================================

variable "database_name" {
  description = "Name of the main database to create"
  type        = string
  default     = "school_management"
}

variable "sku_name" {
  description = "PostgreSQL SKU name (B_Standard_B1ms for cost-optimized)"
  type        = string
  default     = "B_Standard_B1ms" # Burstable B1ms: 1 vCore, 2GB RAM

  validation {
    condition = contains([
      "B_Standard_B1ms",   # Burstable: $12/month
      "B_Standard_B2s",    # Burstable: $30/month
      "GP_Standard_D2s_v3" # General Purpose: $150/month
    ], var.sku_name)
    error_message = "SKU must be a valid PostgreSQL Flexible Server SKU."
  }
}

variable "storage_mb" {
  description = "Storage size in MB (minimum 32GB = 32768 MB)"
  type        = number
  default     = 32768 # 32 GB

  validation {
    condition     = var.storage_mb >= 32768 && var.storage_mb <= 16777216
    error_message = "Storage must be between 32GB (32768 MB) and 16TB (16777216 MB)."
  }
}

variable "postgres_version" {
  description = "PostgreSQL version (11, 12, 13, 14, 15)"
  type        = string
  default     = "15" # Latest stable version

  validation {
    condition     = contains(["11", "12", "13", "14", "15"], var.postgres_version)
    error_message = "PostgreSQL version must be 11, 12, 13, 14, or 15."
  }
}

variable "backup_retention_days" {
  description = "Number of days to retain backups (7-35)"
  type        = number
  default     = 7 # Minimum for cost savings

  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days."
  }
}

variable "availability_zone" {
  description = "Availability zone for the server (1, 2, 3, or empty for auto-select)"
  type        = string
  default     = "" # Empty = let Azure choose (important for free subscriptions)

  validation {
    # Allow "1", "2", "3", or "" (empty = let Azure choose automatically)
    # Empty string is useful for free subscriptions with zone restrictions
    condition     = contains(["1", "2", "3", ""], var.availability_zone)
    error_message = "Availability zone must be 1, 2, 3, or empty string (for auto-selection)."
  }
}

variable "public_network_access_enabled" {
  description = "Enable public network access (true for dev, false for prod)"
  type        = bool
  default     = true
}

variable "max_connections" {
  description = "Maximum number of connections (50-5000)"
  type        = string
  default     = "100"

  validation {
    condition     = tonumber(var.max_connections) >= 50 && tonumber(var.max_connections) <= 5000
    error_message = "Max connections must be between 50 and 5000."
  }
}

variable "local_ip_address" {
  description = "Your local IP address for development access (leave empty to skip)"
  type        = string
  default     = ""

  validation {
    condition = var.local_ip_address == "" || can(regex(
      "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
      var.local_ip_address
    ))
    error_message = "Local IP address must be a valid IPv4 address or empty."
  }
}

variable "allowed_ip_ranges" {
  description = "Map of allowed IP ranges for firewall rules"
  type = map(object({
    start = string
    end   = string
  }))
  default = {}

  # Example:
  # allowed_ip_ranges = {
  #   "office" = {
  #     start = "203.0.113.1"
  #     end   = "203.0.113.10"
  #   }
  #   "home" = {
  #     start = "198.51.100.1"
  #     end   = "198.51.100.1"
  #   }
  # }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "SchoolManagementSystem"
  }
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics (optional)"
  type        = string
  default     = ""
}
