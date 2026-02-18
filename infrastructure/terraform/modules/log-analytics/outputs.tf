# ============================================
# LOG ANALYTICS MODULE - OUTPUTS
# ============================================

output "id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "name" {
  description = "Log Analytics Workspace name"
  value       = azurerm_log_analytics_workspace.main.name
}

output "workspace_id" {
  description = "Log Analytics Workspace ID (for agents)"
  value       = azurerm_log_analytics_workspace.main.workspace_id
}

output "primary_shared_key" {
  description = "Primary shared key"
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
}

output "secondary_shared_key" {
  description = "Secondary shared key"
  value       = azurerm_log_analytics_workspace.main.secondary_shared_key
  sensitive   = true
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost for Log Analytics"
  value = {
    ingestion_cost = "~$2-5 for typical AKS cluster (5GB/month)"
    retention_cost = "Included for ${var.retention_in_days} days"
    total          = "~$2-5/month"
  }
}

output "next_steps" {
  description = "Next steps after deployment"
  value = <<-EOT
    ✅ Log Analytics Workspace deployed successfully!

    📋 Workspace Information:
    - Name: ${azurerm_log_analytics_workspace.main.name}
    - Workspace ID: ${azurerm_log_analytics_workspace.main.workspace_id}
    - Retention: ${var.retention_in_days} days

    🔧 Query logs with KQL:
    1. Go to Azure Portal > Log Analytics Workspace
    2. Click "Logs" in the left menu
    3. Run KQL queries, for example:

       // View all container logs
       ContainerLog
       | where TimeGenerated > ago(1h)
       | project TimeGenerated, Computer, ContainerID, LogEntry
       | limit 100

       // View Kubernetes events
       KubeEvents
       | where TimeGenerated > ago(1h)
       | project TimeGenerated, Namespace, Name, Reason, Message

    💡 Learn KQL:
    - https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/
  EOT
}
