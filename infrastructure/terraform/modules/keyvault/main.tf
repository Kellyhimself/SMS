# ============================================
# AZURE KEY VAULT MODULE
# Secure storage for secrets, keys, and certificates
# ============================================

# Get current client config for access policy
data "azurerm_client_config" "current" {}

# ============================================
# KEY VAULT
# ============================================

resource "azurerm_key_vault" "main" {
  name                        = var.keyvault_name
  location                    = var.location
  resource_group_name         = var.resource_group_name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = var.soft_delete_retention_days
  purge_protection_enabled    = var.purge_protection_enabled
  sku_name                    = var.sku_name

  # Enable for Azure services
  enabled_for_deployment          = true
  enabled_for_template_deployment = true

  # Network ACLs
  network_acls {
    bypass         = "AzureServices"
    default_action = var.network_acls_default_action

    # Allow specific IP ranges
    ip_rules = var.allowed_ip_ranges

    # Allow specific subnets
    virtual_network_subnet_ids = var.allowed_subnet_ids
  }

  # Access policy for current user/service principal
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Update", "Create", "Import", "Delete",
      "Recover", "Backup", "Restore", "Decrypt", "Encrypt",
      "UnwrapKey", "WrapKey", "Verify", "Sign", "Purge"
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Recover",
      "Backup", "Restore", "Purge"
    ]

    certificate_permissions = [
      "Get", "List", "Update", "Create", "Import",
      "Delete", "Recover", "Backup", "Restore",
      "ManageContacts", "ManageIssuers", "GetIssuers",
      "ListIssuers", "SetIssuers", "DeleteIssuers", "Purge"
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name      = var.keyvault_name
      Component = "KeyVault"
      ManagedBy = "Terraform"
    }
  )
}

# ============================================
# ACCESS POLICIES
# ============================================

# Access policy for AKS (if provided)
resource "azurerm_key_vault_access_policy" "aks" {
  count = var.aks_kubelet_identity_object_id != "" ? 1 : 0

  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = var.aks_kubelet_identity_object_id

  secret_permissions = [
    "Get", "List"
  ]

  certificate_permissions = [
    "Get", "List"
  ]
}

# ============================================
# SECRETS (Optional - store database credentials)
# ============================================

# Database connection string secret
resource "azurerm_key_vault_secret" "database_connection_string" {
  count = var.store_database_secrets ? 1 : 0

  name         = "database-connection-string"
  value        = var.database_connection_string
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault.main
  ]
}

# Database password secret
resource "azurerm_key_vault_secret" "database_password" {
  count = var.store_database_secrets ? 1 : 0

  name         = "database-password"
  value        = var.database_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault.main
  ]
}

# ACR admin password (if admin enabled)
resource "azurerm_key_vault_secret" "acr_admin_password" {
  count = var.store_acr_secrets && var.acr_admin_password != "" ? 1 : 0

  name         = "acr-admin-password"
  value        = var.acr_admin_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault.main
  ]
}

# ============================================
# APPLICATION SECRETS
# ============================================

# Store application secrets (API keys, etc.)
resource "azurerm_key_vault_secret" "app_secrets" {
  for_each = var.store_app_secrets ? nonsensitive(var.app_secrets) : {}

  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault.main
  ]
}
