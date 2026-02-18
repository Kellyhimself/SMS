# ============================================
# AZURE CONTAINER REGISTRY (ACR) MODULE
# Private Docker registry for storing container images
# ============================================

# ============================================
# CONTAINER REGISTRY
# ============================================

resource "azurerm_container_registry" "main" {
  name                = var.registry_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku

  # Admin user (for development - disable in production)
  admin_enabled = var.admin_enabled

  # Public network access
  public_network_access_enabled = var.public_network_access_enabled

  # Zone redundancy (Premium SKU only)
  zone_redundancy_enabled = var.sku == "Premium" ? var.zone_redundancy_enabled : false

  # Note: retention_policy and trust_policy have been deprecated in azurerm v4.x
  # Use Azure Policy or configure via Azure Portal if needed

  tags = merge(
    var.common_tags,
    {
      Name      = var.registry_name
      Component = "ACR"
      ManagedBy = "Terraform"
    }
  )
}

# ============================================
# VULNERABILITY SCANNING (Defender for Containers)
# Requires Premium SKU and Microsoft Defender for Cloud
# ============================================

# Note: This is configured at the subscription level in Azure Security Center
# Not directly in Terraform ACR resource

# ============================================
# WEBHOOK (Optional)
# Trigger actions when images are pushed/deleted
# ============================================

# Example webhook for CI/CD integration
# resource "azurerm_container_registry_webhook" "ci_webhook" {
#   count = var.enable_webhook ? 1 : 0
#
#   name                = "${var.registry_name}-webhook"
#   resource_group_name = var.resource_group_name
#   registry_name       = azurerm_container_registry.main.name
#   location            = var.location
#
#   service_uri = var.webhook_service_uri
#   status      = "enabled"
#   scope       = "*:*"
#   actions     = ["push", "delete"]
#   custom_headers = {
#     "Content-Type" = "application/json"
#   }
# }
