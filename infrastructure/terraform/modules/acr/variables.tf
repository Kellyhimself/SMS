# ============================================
# ACR MODULE - VARIABLES
# ============================================

# ============================================
# REQUIRED VARIABLES
# ============================================

variable "registry_name" {
  description = "Name of the Azure Container Registry (must be globally unique, alphanumeric only)"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9]{5,50}$", var.registry_name))
    error_message = "Registry name must be 5-50 alphanumeric characters."
  }
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

# ============================================
# OPTIONAL VARIABLES
# ============================================

variable "sku" {
  description = "SKU tier (Basic, Standard, Premium)"
  type        = string
  default     = "Basic"  # Cost-optimized for development

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.sku)
    error_message = "SKU must be Basic, Standard, or Premium."
  }
}

variable "admin_enabled" {
  description = "Enable admin user (for development only)"
  type        = bool
  default     = true  # Enable for development convenience
}

variable "public_network_access_enabled" {
  description = "Enable public network access"
  type        = bool
  default     = true  # Allow public access for development
}

variable "zone_redundancy_enabled" {
  description = "Enable zone redundancy (Premium SKU only)"
  type        = bool
  default     = false
}

variable "retention_days" {
  description = "Image retention policy in days (Premium SKU only, 0 = disabled)"
  type        = number
  default     = 0  # Disabled for cost savings
}

variable "enable_content_trust" {
  description = "Enable Docker Content Trust (Premium SKU only)"
  type        = bool
  default     = false
}

variable "geo_replication_locations" {
  description = "List of Azure regions for geo-replication (Premium SKU only)"
  type        = list(string)
  default     = []
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for network rules (Premium SKU only)"
  type        = list(string)
  default     = []
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}
