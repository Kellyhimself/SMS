# ============================================
# SENTINEL MODULE - VARIABLES
# ============================================

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  type        = string
}

variable "log_analytics_workspace_name" {
  description = "Log Analytics Workspace name"
  type        = string
}

variable "enable_azure_activity_connector" {
  description = "Enable Azure Activity data connector"
  type        = bool
  default     = true
}

variable "enable_aad_connector" {
  description = "Enable Azure AD data connector"
  type        = bool
  default     = false  # Requires additional permissions
}

variable "create_sample_rules" {
  description = "Create sample analytic rules for demonstration"
  type        = bool
  default     = true
}

variable "create_sample_watchlists" {
  description = "Create sample watchlists"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
