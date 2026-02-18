# ============================================
# VNET MODULE - OUTPUTS
# ============================================

output "vnet_id" {
  description = "Virtual network ID"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Virtual network name"
  value       = azurerm_virtual_network.main.name
}

output "vnet_address_space" {
  description = "Virtual network address space"
  value       = azurerm_virtual_network.main.address_space
}

output "aks_subnet_id" {
  description = "AKS subnet ID"
  value       = azurerm_subnet.aks.id
}

output "aks_subnet_name" {
  description = "AKS subnet name"
  value       = azurerm_subnet.aks.name
}

output "database_subnet_id" {
  description = "Database subnet ID (if created)"
  value       = var.create_database_subnet ? azurerm_subnet.database[0].id : ""
}

output "appgw_subnet_id" {
  description = "Application Gateway subnet ID (if created)"
  value       = var.create_appgw_subnet ? azurerm_subnet.appgw[0].id : ""
}

output "nat_gateway_id" {
  description = "NAT Gateway ID (if created)"
  value       = var.create_nat_gateway ? azurerm_nat_gateway.main[0].id : ""
}
