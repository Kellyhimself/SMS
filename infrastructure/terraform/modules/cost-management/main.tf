# ============================================
# AZURE COST MANAGEMENT MODULE
# Budgets, Alerts, and Cost Tracking
# ============================================
# This module sets up cost monitoring and alerts to ensure
# we stay within the $200 Azure credits budget
# ============================================

# ============================================
# DATA SOURCES
# ============================================

# Get current subscription
data "azurerm_subscription" "current" {}

# ============================================
# CONSUMPTION BUDGET
# ============================================

# Overall subscription budget ($200 for 4 months)
resource "azurerm_consumption_budget_subscription" "overall" {
  name            = "budget-sms-overall"
  subscription_id = data.azurerm_subscription.current.id

  # Total budget: configurable (default $200 over 4 months)
  amount     = var.total_budget_amount
  time_grain = "Monthly"

  # Budget period: 4 months
  time_period {
    start_date = var.budget_start_date      # e.g., "2026-02-01T00:00:00Z"
    end_date   = var.budget_end_date        # e.g., "2026-05-31T23:59:59Z"
  }

  # Alert at 50% ($100)
  notification {
    enabled        = true
    threshold      = 50.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.alert_email_addresses

    # Optional: Contact roles (e.g., Owner, Contributor)
    # contact_roles = ["Owner"]
  }

  # Alert at 75% ($150)
  notification {
    enabled        = true
    threshold      = 75.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.alert_email_addresses
  }

  # Alert at 90% ($180)
  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.alert_email_addresses
  }

  # Forecast alert at 100% (predict when we'll hit budget)
  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Forecasted"

    contact_emails = var.alert_email_addresses
  }
}

# Monthly budget for each phase
resource "azurerm_consumption_budget_subscription" "monthly" {
  name            = "budget-sms-monthly-${var.environment}"
  subscription_id = data.azurerm_subscription.current.id

  # Monthly budget based on phase
  # Phase 0: $16, Phase 1: $40, Phase 2-3: $50, Phase 4-5: $40
  amount     = var.monthly_budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = var.budget_start_date
  }

  # Alert at 80% of monthly budget
  notification {
    enabled        = true
    threshold      = 80.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.alert_email_addresses
  }

  # Alert at 100% of monthly budget
  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.alert_email_addresses
  }
}

# Resource Group specific budget (optional, for dev environment)
resource "azurerm_consumption_budget_resource_group" "dev" {
  count = var.environment == "dev" ? 1 : 0

  name              = "budget-rg-sms-${var.environment}"
  resource_group_id = var.resource_group_id

  amount     = var.monthly_budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = var.budget_start_date
  }

  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.alert_email_addresses
  }

  # Filter to only PostgreSQL costs (optional)
  filter {
    dimension {
      name = "ResourceType"
      values = [
        "microsoft.dbforpostgresql/flexibleservers"
      ]
    }
  }
}

# ============================================
# COST ANOMALY ALERTS (Future)
# ============================================
# Note: Azure Cost Anomaly Detection is still in preview
# Uncomment when generally available

# resource "azurerm_cost_anomaly_alert" "subscription" {
#   name            = "anomaly-alert-sms"
#   subscription_id = data.azurerm_subscription.current.id
#
#   email_addresses = var.alert_email_addresses
# }

# ============================================
# RESOURCE TAGGING FOR COST TRACKING
# ============================================

# Cost Center tags (for cost allocation)
locals {
  cost_tracking_tags = {
    CostCenter  = var.cost_center
    Project     = "SchoolManagementSystem"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Phase       = var.current_phase  # e.g., "Phase0", "Phase1"
    Owner       = var.owner_email
  }
}
