# ============================================
# KEY VAULT MODULE - OUTPUTS
# ============================================

output "id" {
  description = "Key Vault ID"
  value       = azurerm_key_vault.main.id
}

output "name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

output "vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "tenant_id" {
  description = "Tenant ID"
  value       = azurerm_key_vault.main.tenant_id
}

output "next_steps" {
  description = "Next steps after Key Vault deployment"
  value = <<-EOT
    ✅ Azure Key Vault deployed successfully!

    📋 Key Vault Information:
    - Name: ${azurerm_key_vault.main.name}
    - URI: ${azurerm_key_vault.main.vault_uri}
    - SKU: ${var.sku_name}

    🔧 Next Steps:
    1. Add secrets to Key Vault:
       az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "my-secret" --value "secret-value"

    2. Retrieve secrets:
       az keyvault secret show --vault-name ${azurerm_key_vault.main.name} --name "my-secret"

    3. List all secrets:
       az keyvault secret list --vault-name ${azurerm_key_vault.main.name}

    4. Integrate with AKS (use Secrets Store CSI Driver):
       helm install csi-secrets-store-provider-azure/csi-secrets-store-provider-azure --generate-name

    📚 Documentation:
    - Key Vault: https://learn.microsoft.com/en-us/azure/key-vault/
    - AKS Integration: https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver
  EOT
}
