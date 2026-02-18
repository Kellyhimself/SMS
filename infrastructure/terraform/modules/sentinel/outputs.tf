# ============================================
# SENTINEL MODULE - OUTPUTS
# ============================================

output "id" {
  description = "Sentinel solution ID"
  value       = azurerm_log_analytics_solution.sentinel.id
}

output "name" {
  description = "Sentinel solution name"
  value       = azurerm_log_analytics_solution.sentinel.solution_name
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost for Sentinel"
  value = {
    ingestion_cost = "~$2-3 for typical security logs (2GB/month)"
    retention_cost = "Included in Log Analytics"
    total          = "~$2-3/month"
  }
}

output "next_steps" {
  description = "Next steps after Sentinel deployment"
  value = <<-EOT
    ✅ Microsoft Sentinel deployed successfully!

    📋 SIEM/SOAR Capabilities:
    - Threat detection with KQL queries
    - Security incident management
    - SOAR playbooks (Logic Apps)
    - Threat hunting with KQL
    - Watchlists for threat intelligence

    🔧 Access Sentinel:
    1. Go to Azure Portal
    2. Search for "Microsoft Sentinel"
    3. Select your workspace: ${var.log_analytics_workspace_name}

    🔍 View Security Incidents:
    1. Click "Incidents" in left menu
    2. Review detected threats
    3. Investigate and respond

    📊 Run Threat Hunting Queries:
    1. Click "Hunting" in left menu
    2. Run built-in queries or create custom KQL queries
    3. Example KQL queries:

       // Find failed login attempts
       SigninLogs
       | where ResultType != "0"
       | summarize count() by UserPrincipalName, IPAddress

       // Find suspicious PowerShell activity
       SecurityEvent
       | where EventID == 4688
       | where CommandLine has "powershell"
       | where CommandLine has_any ("IEX", "DownloadString")

    🤖 Create SOAR Playbooks:
    1. Click "Automation" > "Playbooks"
    2. Create Logic App for automated response
    3. Examples:
       - Block suspicious IPs
       - Send email alerts
       - Create tickets in Jira
       - Isolate compromised machines

    📚 Learn More:
    - Sentinel: https://learn.microsoft.com/en-us/azure/sentinel/
    - KQL: https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/
    - MITRE ATT&CK: https://attack.mitre.org/
  EOT
}
