# ============================================
# MICROSOFT SENTINEL MODULE
# SIEM/SOAR for security monitoring and threat detection
# ============================================

# ============================================
# MICROSOFT SENTINEL (onboard Log Analytics)
# ============================================

resource "azurerm_log_analytics_solution" "sentinel" {
  solution_name         = "SecurityInsights"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = var.log_analytics_workspace_id
  workspace_name        = var.log_analytics_workspace_name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/SecurityInsights"
  }

  tags = merge(
    var.common_tags,
    {
      Component = "Sentinel"
      ManagedBy = "Terraform"
    }
  )
}

# ============================================
# DATA CONNECTORS
# Note: Data connectors must be configured manually in Azure Portal
# azurerm provider v4.x has limited/deprecated support for Sentinel data connectors
# ============================================

# Manual Configuration Required:
# 1. Go to Azure Portal > Microsoft Sentinel > Configuration > Data connectors
# 2. Enable desired connectors:
#    - Azure Activity (free)
#    - Azure Active Directory (requires P1/P2 license)
#    - Microsoft Defender for Cloud
#    - Office 365 (requires license)
#
# Note: azurerm_sentinel_data_connector_* resources are not fully supported in v4.x

# ============================================
# ANALYTIC RULES (Threat Detection)
# KQL queries that run automatically to detect threats
# ============================================

# Example: Detect multiple failed logins
resource "azurerm_sentinel_alert_rule_scheduled" "failed_logins" {
  count = var.create_sample_rules ? 1 : 0

  name                       = "Multiple Failed Login Attempts"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Multiple Failed Login Attempts Detected"
  severity                   = "Medium"
  enabled                    = true

  query = <<-EOT
    SigninLogs
    | where ResultType != "0"
    | where TimeGenerated > ago(1h)
    | summarize FailedAttempts = count() by UserPrincipalName, IPAddress
    | where FailedAttempts > 5
    | project UserPrincipalName, IPAddress, FailedAttempts
  EOT

  query_frequency            = "PT1H"  # Run every hour
  query_period               = "PT1H"  # Look back 1 hour
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false
  suppression_duration       = "PT1H"

  tactics = ["InitialAccess", "CredentialAccess"]

  # Note: incident_configuration removed in azurerm v4.x
  # Configure incident creation in Azure Portal > Sentinel > Analytics

  depends_on = [
    azurerm_log_analytics_solution.sentinel
  ]
}

# Example: Detect suspicious PowerShell activity
resource "azurerm_sentinel_alert_rule_scheduled" "suspicious_powershell" {
  count = var.create_sample_rules ? 1 : 0

  name                       = "Suspicious PowerShell Activity"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Suspicious PowerShell Commands Detected"
  severity                   = "High"
  enabled                    = true

  query = <<-EOT
    SecurityEvent
    | where EventID == 4688  // Process creation
    | where CommandLine has "powershell"
    | where CommandLine has_any ("Invoke-Expression", "IEX", "DownloadString", "FromBase64String", "-EncodedCommand")
    | project TimeGenerated, Computer, Account, CommandLine
  EOT

  query_frequency     = "PT15M"  # Run every 15 minutes
  query_period        = "PT15M"
  trigger_operator    = "GreaterThan"
  trigger_threshold   = 0
  suppression_enabled = false
  suppression_duration = "PT15M"

  tactics = ["Execution", "DefenseEvasion"]

  # Note: incident_configuration removed in azurerm v4.x
  # Configure incident creation in Azure Portal > Sentinel > Analytics

  depends_on = [
    azurerm_log_analytics_solution.sentinel
  ]
}

# ============================================
# WATCHLISTS (Threat Intelligence)
# Custom lists for threat hunting
# ============================================

# Example: IP address watchlist
resource "azurerm_sentinel_watchlist" "suspicious_ips" {
  count = var.create_sample_watchlists ? 1 : 0

  name                       = "SuspiciousIPs"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Suspicious IP Addresses"
  item_search_key            = "IPAddress"

  depends_on = [
    azurerm_log_analytics_solution.sentinel
  ]
}
