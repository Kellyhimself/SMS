# ============================================
# LOG ANALYTICS WORKSPACE MODULE
# Centralized logging and monitoring
# ============================================

# ============================================
# LOG ANALYTICS WORKSPACE
# ============================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = var.workspace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  retention_in_days   = var.retention_in_days

  # Daily quota (optional)
  daily_quota_gb = var.daily_quota_gb

  tags = merge(
    var.common_tags,
    {
      Name      = var.workspace_name
      Component = "LogAnalytics"
      ManagedBy = "Terraform"
    }
  )
}

# ============================================
# LOG ANALYTICS SOLUTIONS
# ============================================

# Container Insights solution (for AKS monitoring)
resource "azurerm_log_analytics_solution" "container_insights" {
  count = var.enable_container_insights ? 1 : 0

  solution_name         = "ContainerInsights"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/ContainerInsights"
  }

  tags = var.common_tags
}

# Security Center solution (for security monitoring)
resource "azurerm_log_analytics_solution" "security" {
  count = var.enable_security_center ? 1 : 0

  solution_name         = "Security"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/Security"
  }

  tags = var.common_tags
}

# Azure Activity solution (for Azure resource logs)
resource "azurerm_log_analytics_solution" "azure_activity" {
  count = var.enable_azure_activity ? 1 : 0

  solution_name         = "AzureActivity"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/AzureActivity"
  }

  tags = var.common_tags
}
