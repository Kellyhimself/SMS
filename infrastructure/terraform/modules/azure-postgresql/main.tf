# ============================================
# AZURE DATABASE FOR POSTGRESQL FLEXIBLE SERVER
# Cost-optimized configuration for learning/development
# Estimated Cost: ~$12-15/month (covered by Azure credits)
# ============================================

# Random suffix for globally unique names
resource "random_string" "unique" {
  length  = 8
  special = false
  upper   = false
}

# Resource Group for all SMS resources
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = merge(
    var.common_tags,
    {
      Purpose     = "School Management System"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "SMS-Azure-Transformation"
      CostCenter  = "Learning"
    }
  )
}

# ============================================
# POSTGRESQL FLEXIBLE SERVER
# ============================================

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "psql-sms-${var.environment}-${random_string.unique.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  # FREE TIER / COST-OPTIMIZED: Burstable B1ms
  # - 1 vCore
  # - 2 GB RAM
  # - Cost: ~$12/month (covered by credits)
  sku_name = var.sku_name

  # Storage configuration
  storage_mb = var.storage_mb

  # PostgreSQL version (same as Supabase default)
  version = var.postgres_version

  # Admin credentials
  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  # Backup configuration
  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = false # Save costs

  # High Availability - DISABLED for cost savings
  # Can enable later for production
  # high_availability {
  #   mode = "ZoneRedundant"
  # }

  # Availability zone
  # Convert empty string to null (let Azure auto-select zone)
  # This avoids zone restriction errors on free subscriptions
  zone = var.availability_zone != "" ? var.availability_zone : null

  # Public network access
  # Enable for development, disable for production
  public_network_access_enabled = var.public_network_access_enabled

  tags = merge(
    var.common_tags,
    {
      Component = "Database"
      Database  = "PostgreSQL"
    }
  )

  lifecycle {
    prevent_destroy = false # Allow destroy during learning
    ignore_changes = [
      zone, # Prevent unnecessary recreation
    ]
  }
}

# ============================================
# POSTGRESQL CONFIGURATION
# Performance and security settings
# ============================================

resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  name      = "max_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.max_connections
}

resource "azurerm_postgresql_flexible_server_configuration" "shared_buffers" {
  name      = "shared_buffers"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "16384" # 128MB for B1ms (8192 pages * 8KB)
}

resource "azurerm_postgresql_flexible_server_configuration" "work_mem" {
  name      = "work_mem"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "4096" # 4MB per operation
}

# Enable query statistics extension (pg_stat_statements)
# First, we need to load the extension via shared_preload_libraries
resource "azurerm_postgresql_flexible_server_configuration" "shared_preload_libraries" {
  name      = "shared_preload_libraries"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "pg_stat_statements"
}

# Then configure pg_stat_statements to track all queries
# Note: This depends on the extension being loaded above
resource "azurerm_postgresql_flexible_server_configuration" "pg_stat_statements_track" {
  name      = "pg_stat_statements.track"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "all"

  # Ensure extension is loaded first
  depends_on = [azurerm_postgresql_flexible_server_configuration.shared_preload_libraries]
}

# ============================================
# FIREWALL RULES
# ============================================

# Allow access from Azure services (required for Azure App Service, AKS)
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Allow access from local development machine (temporary)
# IMPORTANT: Replace with your actual IP address or remove for production
resource "azurerm_postgresql_flexible_server_firewall_rule" "local_dev" {
  count            = var.local_ip_address != "" ? 1 : 0
  name             = "allow-local-development"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = var.local_ip_address
  end_ip_address   = var.local_ip_address
}

# Allow access from specific IP ranges (e.g., school office, home)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each         = var.allowed_ip_ranges
  name             = "allow-${each.key}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value.start
  end_ip_address   = each.value.end
}

# ============================================
# DATABASES
# ============================================

# Main school management database
resource "azurerm_postgresql_flexible_server_database" "school_management" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = false # Set to true for production
  }
}

# ============================================
# EXTENSIONS
# Enable PostgreSQL extensions (run after database creation)
# Note: Extensions must be created via SQL after Terraform deployment
# ============================================

# Extensions to enable manually or via migration script:
# - uuid-ossp (for UUID generation)
# - pgcrypto (for encryption)
# - pg_stat_statements (for query performance)

# ============================================
# MONITORING & DIAGNOSTICS
# ============================================

# Diagnostic settings (sends logs to Log Analytics)
# Uncomment when Log Analytics workspace is created

# resource "azurerm_monitor_diagnostic_setting" "postgres" {
#   name                       = "postgres-diagnostics"
#   target_resource_id         = azurerm_postgresql_flexible_server.main.id
#   log_analytics_workspace_id = var.log_analytics_workspace_id
#
#   enabled_log {
#     category = "PostgreSQLLogs"
#   }
#
#   metric {
#     category = "AllMetrics"
#   }
# }

# ============================================
# OUTPUTS
# ============================================

# Connection information (will be marked as sensitive)
locals {
  connection_string = "postgresql://${var.admin_username}:${var.admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.database_name}?sslmode=require"
}
