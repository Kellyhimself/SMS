# ============================================
# ACR MODULE - OUTPUTS
# ============================================

# ============================================
# REGISTRY INFORMATION
# ============================================

output "id" {
  description = "ACR resource ID"
  value       = azurerm_container_registry.main.id
}

output "name" {
  description = "ACR name"
  value       = azurerm_container_registry.main.name
}

output "login_server" {
  description = "ACR login server URL"
  value       = azurerm_container_registry.main.login_server
}

output "admin_username" {
  description = "ACR admin username (if admin enabled)"
  value       = var.admin_enabled ? azurerm_container_registry.main.admin_username : ""
  sensitive   = true
}

output "admin_password" {
  description = "ACR admin password (if admin enabled)"
  value       = var.admin_enabled ? azurerm_container_registry.main.admin_password : ""
  sensitive   = true
}

# ============================================
# DOCKER COMMANDS
# ============================================

output "docker_login_command" {
  description = "Command to login to ACR using Docker"
  value       = "az acr login --name ${azurerm_container_registry.main.name}"
}

output "docker_login_command_admin" {
  description = "Command to login to ACR using admin credentials"
  value       = var.admin_enabled ? "docker login ${azurerm_container_registry.main.login_server} -u ${azurerm_container_registry.main.admin_username} -p <admin_password>" : "Admin not enabled"
  sensitive   = false
}

output "docker_build_and_push_example" {
  description = "Example commands to build and push an image"
  value = <<-EOT
    # Build image
    docker build -t ${azurerm_container_registry.main.login_server}/sms-app:latest .

    # Login to ACR (choose one):
    # Option 1: Using Azure CLI (recommended)
    az acr login --name ${azurerm_container_registry.main.name}

    # Option 2: Using admin credentials (development only)
    # docker login ${azurerm_container_registry.main.login_server} -u ${var.admin_enabled ? azurerm_container_registry.main.admin_username : "N/A"} -p <password>

    # Push image
    docker push ${azurerm_container_registry.main.login_server}/sms-app:latest

    # List images in registry
    az acr repository list --name ${azurerm_container_registry.main.name} -o table

    # Show image tags
    az acr repository show-tags --name ${azurerm_container_registry.main.name} --repository sms-app -o table
  EOT
}

# ============================================
# COST ESTIMATE
# ============================================

output "estimated_monthly_cost" {
  description = "Estimated monthly cost for ACR"
  value = {
    sku_cost = var.sku == "Basic" ? 5.00 : (var.sku == "Standard" ? 20.00 : 80.00)
    storage  = "Included: 10GB (Basic), 100GB (Standard), 500GB (Premium)"
    total    = var.sku == "Basic" ? 5.00 : (var.sku == "Standard" ? 20.00 : 80.00)
  }
}

# ============================================
# NEXT STEPS
# ============================================

output "next_steps" {
  description = "Next steps after ACR deployment"
  value = <<-EOT
    ✅ Azure Container Registry deployed successfully!

    📋 Registry Information:
    - Name: ${azurerm_container_registry.main.name}
    - Login Server: ${azurerm_container_registry.main.login_server}
    - SKU: ${var.sku}
    - Admin Enabled: ${var.admin_enabled}

    🔧 Next Steps:
    1. Login to ACR:
       az acr login --name ${azurerm_container_registry.main.name}

    2. Build your Docker image:
       docker build -t ${azurerm_container_registry.main.login_server}/sms-app:latest .

    3. Push image to ACR:
       docker push ${azurerm_container_registry.main.login_server}/sms-app:latest

    4. List images in registry:
       az acr repository list --name ${azurerm_container_registry.main.name} -o table

    5. Enable image scanning (Azure Security Center):
       - Navigate to Azure Portal > Security Center
       - Enable Microsoft Defender for Containers

    💰 Estimated Monthly Cost: $${var.sku == "Basic" ? 5.00 : (var.sku == "Standard" ? 20.00 : 80.00)}/month

    📚 Documentation:
    - ACR: https://learn.microsoft.com/en-us/azure/container-registry/
    - Docker: https://docs.docker.com/
  EOT
}
