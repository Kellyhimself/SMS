# ============================================
# LOG ANALYTICS MODULE - VARIABLES
# ============================================

variable "workspace_name" {
  description = "Name of the Log Analytics workspace"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "sku" {
  description = "Pricing tier"
  type        = string
  default     = "PerGB2018"

  validation {
    condition     = contains(["Free", "PerNode", "Premium", "Standard", "Standalone", "Unlimited", "CapacityReservation", "PerGB2018"], var.sku)
    error_message = "SKU must be a valid Log Analytics pricing tier."
  }
}

variable "retention_in_days" {
  description = "Log retention period in days"
  type        = number
  default     = 30

  validation {
    condition     = var.retention_in_days >= 30 && var.retention_in_days <= 730
    error_message = "Retention must be between 30 and 730 days."
  }
}

variable "daily_quota_gb" {
  description = "Daily ingestion limit in GB (-1 for unlimited)"
  type        = number
  default     = -1
}

variable "enable_container_insights" {
  description = "Enable Container Insights solution"
  type        = bool
  default     = true
}

variable "enable_security_center" {
  description = "Enable Security Center solution"
  type        = bool
  default     = true
}

variable "enable_azure_activity" {
  description = "Enable Azure Activity solution"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
