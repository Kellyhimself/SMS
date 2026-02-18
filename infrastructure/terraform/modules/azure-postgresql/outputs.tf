# ============================================
# AZURE POSTGRESQL MODULE - OUTPUTS
# ============================================

# ============================================
# RESOURCE IDS
# ============================================

output "resource_group_id" {
  description = "ID of the resource group"
  value       = azurerm_resource_group.main.id
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "server_id" {
  description = "ID of the PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "server_name" {
  description = "Name of the PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "database_id" {
  description = "ID of the school management database"
  value       = azurerm_postgresql_flexible_server_database.school_management.id
}

output "database_name" {
  description = "Name of the school management database"
  value       = azurerm_postgresql_flexible_server_database.school_management.name
}

# ============================================
# CONNECTION INFORMATION
# ============================================

output "server_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "server_host" {
  description = "Hostname of the PostgreSQL server (same as FQDN)"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "server_port" {
  description = "Port number for PostgreSQL connections"
  value       = 5432
}

output "admin_username" {
  description = "Administrator username"
  value       = var.admin_username
  sensitive   = true
}

# ============================================
# CONNECTION STRINGS
# ============================================

output "connection_string" {
  description = "Full PostgreSQL connection string (psql format)"
  value       = local.connection_string
  sensitive   = true
}

output "connection_string_jdbc" {
  description = "JDBC connection string"
  value       = "jdbc:postgresql://${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.database_name}?sslmode=require"
  sensitive   = true
}

output "connection_string_node" {
  description = "Node.js pg library connection string"
  value = jsonencode({
    host     = azurerm_postgresql_flexible_server.main.fqdn
    port     = 5432
    database = var.database_name
    user     = var.admin_username
    password = var.admin_password
    ssl = {
      rejectUnauthorized = true
    }
  })
  sensitive = true
}

# ============================================
# ENVIRONMENT VARIABLES
# For Next.js .env files
# ============================================

output "env_vars" {
  description = "Environment variables for Next.js application"
  value = {
    DATABASE_PROVIDER         = "azure"
    AZURE_POSTGRES_HOST       = azurerm_postgresql_flexible_server.main.fqdn
    AZURE_POSTGRES_PORT       = "5432"
    AZURE_POSTGRES_DATABASE   = var.database_name
    AZURE_POSTGRES_USER       = var.admin_username
    AZURE_POSTGRES_PASSWORD   = var.admin_password
    AZURE_POSTGRES_SSL        = "true"
    AZURE_POSTGRES_SSL_MODE   = "require"
    DATABASE_URL              = local.connection_string
  }
  sensitive = true
}

# ============================================
# SERVER CONFIGURATION
# ============================================

output "server_sku" {
  description = "SKU name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.sku_name
}

output "server_version" {
  description = "PostgreSQL version"
  value       = azurerm_postgresql_flexible_server.main.version
}

output "storage_mb" {
  description = "Storage size in MB"
  value       = azurerm_postgresql_flexible_server.main.storage_mb
}

output "backup_retention_days" {
  description = "Backup retention period in days"
  value       = azurerm_postgresql_flexible_server.main.backup_retention_days
}

output "availability_zone" {
  description = "Availability zone"
  value       = azurerm_postgresql_flexible_server.main.zone
}

# ============================================
# COST INFORMATION (Estimates)
# ============================================

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD (approximate)"
  value = {
    compute_cost = var.sku_name == "B_Standard_B1ms" ? 12.00 : (
      var.sku_name == "B_Standard_B2s" ? 30.00 : 150.00
    )
    storage_cost = (var.storage_mb / 1024) * 0.10 # $0.10 per GB
    backup_cost  = ((var.storage_mb / 1024) * var.backup_retention_days * 0.05) / 30 # $0.05 per GB-month
    total_cost = (
      (var.sku_name == "B_Standard_B1ms" ? 12.00 : (var.sku_name == "B_Standard_B2s" ? 30.00 : 150.00)) +
      ((var.storage_mb / 1024) * 0.10) +
      (((var.storage_mb / 1024) * var.backup_retention_days * 0.05) / 30)
    )
  }
}

# ============================================
# FIREWALL RULES
# ============================================

output "firewall_rules" {
  description = "List of configured firewall rules"
  value = {
    azure_services_allowed = true
    local_dev_ip          = var.local_ip_address != "" ? var.local_ip_address : "Not configured"
    additional_ip_ranges  = length(var.allowed_ip_ranges) > 0 ? keys(var.allowed_ip_ranges) : []
  }
}

# ============================================
# NEXT STEPS
# ============================================

output "next_steps" {
  description = "Instructions for connecting to the database"
  value = <<-EOT
    ✅ PostgreSQL Flexible Server deployed successfully!

    📋 Connection Information:
    - Host: ${azurerm_postgresql_flexible_server.main.fqdn}
    - Port: 5432
    - Database: ${var.database_name}
    - Username: ${var.admin_username}

    🔧 Next Steps:
    1. Test connection:
       psql "postgresql://${var.admin_username}:***@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.database_name}?sslmode=require"

    2. Run migrations:
       psql $DATABASE_URL < migrations/migrate-to-azure.sql

    3. Update Next.js .env.local:
       DATABASE_PROVIDER=azure
       AZURE_POSTGRES_HOST=${azurerm_postgresql_flexible_server.main.fqdn}
       AZURE_POSTGRES_DATABASE=${var.database_name}
       AZURE_POSTGRES_USER=${var.admin_username}
       AZURE_POSTGRES_PASSWORD=***

    4. Enable extensions:
       CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
       CREATE EXTENSION IF NOT EXISTS "pgcrypto";
       CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

    💰 Estimated Cost: $${(var.sku_name == "B_Standard_B1ms" ? 12.00 : (var.sku_name == "B_Standard_B2s" ? 30.00 : 150.00)) + ((var.storage_mb / 1024) * 0.10)}/month
  EOT
}
