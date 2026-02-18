# ============================================
# COST MANAGEMENT MODULE - VARIABLES
# ============================================

# ============================================
# REQUIRED VARIABLES
# ============================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "alert_email_addresses" {
  description = "Email addresses to receive budget alerts"
  type        = list(string)

  validation {
    condition     = length(var.alert_email_addresses) > 0
    error_message = "At least one email address is required for budget alerts."
  }
}

variable "total_budget_amount" {
  description = "Total budget for the entire subscription period (4 months)"
  type        = number
  default     = 200

  validation {
    condition     = var.total_budget_amount > 0 && var.total_budget_amount <= 1000
    error_message = "Total budget must be between 1 and 1000 USD."
  }
}

variable "budget_start_date" {
  description = "Budget period start date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)"
  type        = string

  validation {
    condition     = can(regex("^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}Z)?$", var.budget_start_date))
    error_message = "Budget start date must be in format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ."
  }
}

# ============================================
# OPTIONAL VARIABLES
# ============================================

variable "budget_end_date" {
  description = "Budget period end date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ). If empty, budget continues indefinitely."
  type        = string
  default     = ""

  validation {
    condition = var.budget_end_date == "" || can(regex("^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}Z)?$", var.budget_end_date))
    error_message = "Budget end date must be in format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ, or empty."
  }
}

variable "monthly_budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 50

  validation {
    condition     = var.monthly_budget_amount > 0 && var.monthly_budget_amount <= 200
    error_message = "Monthly budget must be between 1 and 200 USD."
  }
}

variable "resource_group_id" {
  description = "Resource group ID for resource group-specific budget (optional)"
  type        = string
  default     = ""
}

variable "cost_center" {
  description = "Cost center name for cost allocation"
  type        = string
  default     = "Learning"
}

variable "current_phase" {
  description = "Current project phase (for cost tracking)"
  type        = string
  default     = "Phase0"

  validation {
    condition     = can(regex("^Phase[0-5]$", var.current_phase))
    error_message = "Current phase must be Phase0, Phase1, Phase2, Phase3, Phase4, or Phase5."
  }
}

variable "owner_email" {
  description = "Project owner email address"
  type        = string
  default     = ""
}

variable "enable_resource_group_budget" {
  description = "Enable resource group-specific budget"
  type        = bool
  default     = true
}

variable "enable_anomaly_detection" {
  description = "Enable cost anomaly detection (when available)"
  type        = bool
  default     = false
}
