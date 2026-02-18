# ============================================
# COST MANAGEMENT MODULE - OUTPUTS
# ============================================

output "overall_budget_id" {
  description = "Overall subscription budget resource ID"
  value       = azurerm_consumption_budget_subscription.overall.id
}

output "monthly_budget_id" {
  description = "Monthly budget resource ID"
  value       = azurerm_consumption_budget_subscription.monthly.id
}

output "resource_group_budget_id" {
  description = "Resource group budget ID (if enabled)"
  value       = var.environment == "dev" && length(azurerm_consumption_budget_resource_group.dev) > 0 ? azurerm_consumption_budget_resource_group.dev[0].id : null
}

output "cost_tracking_tags" {
  description = "Recommended tags for cost tracking (apply to all resources)"
  value       = local.cost_tracking_tags
}

output "budget_configuration" {
  description = "Complete budget configuration details"
  value = {
    # Budget amounts
    total_budget   = azurerm_consumption_budget_subscription.overall.amount
    monthly_budget = azurerm_consumption_budget_subscription.monthly.amount

    # Alert configuration
    alert_thresholds = {
      actual_50_percent  = "50%"
      actual_75_percent  = "75%"
      actual_90_percent  = "90%"
      forecast_100_percent = "100% (forecasted)"
    }

    # Notification details
    notification_emails = var.alert_email_addresses

    # Budget period
    period = {
      start = var.budget_start_date
      end   = var.budget_end_date != "" ? var.budget_end_date : "No end date (ongoing)"
    }

    # Cost tracking
    cost_center = var.cost_center
    current_phase = var.current_phase
  }
  sensitive = false
}

output "alert_summary" {
  description = "Summary of configured alerts"
  value = <<-EOT

  ✅ Cost Management Configured!

  📊 Budget Summary:
     Total Budget:   $${azurerm_consumption_budget_subscription.overall.amount}
     Monthly Budget: $${azurerm_consumption_budget_subscription.monthly.amount}
     Period:         ${var.budget_start_date} to ${var.budget_end_date != "" ? var.budget_end_date : "ongoing"}

  🔔 Alert Thresholds:
     - 50% ($${azurerm_consumption_budget_subscription.overall.amount * 0.5})  - Actual spend
     - 75% ($${azurerm_consumption_budget_subscription.overall.amount * 0.75})  - Actual spend
     - 90% ($${azurerm_consumption_budget_subscription.overall.amount * 0.9})   - Actual spend
     - 100% ($${azurerm_consumption_budget_subscription.overall.amount})      - Forecasted spend

  📧 Notifications sent to:
     ${join(", ", var.alert_email_addresses)}

  🏷️  Cost Tracking Tags:
     Project:     ${local.cost_tracking_tags.Project}
     Phase:       ${local.cost_tracking_tags.Phase}
     Environment: ${local.cost_tracking_tags.Environment}
     Cost Center: ${local.cost_tracking_tags.CostCenter}

  💡 Next Steps:
     1. Check email for test alert
     2. Monitor costs: az consumption usage list
     3. View budgets: az consumption budget list

  EOT
}
