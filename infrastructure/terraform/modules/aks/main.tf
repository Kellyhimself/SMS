# ============================================
# AZURE KUBERNETES SERVICE (AKS) MODULE
# Production-ready cluster with cost optimization
# ============================================

# ============================================
# AKS CLUSTER
# ============================================

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  # Cost Optimization: Free tier for development
  sku_tier = "Free"

  # Default Node Pool (system node pool)
  default_node_pool {
    name            = "system"
    vm_size         = var.node_vm_size
    os_disk_size_gb = var.os_disk_size_gb
    os_disk_type    = "Managed"
    type            = "VirtualMachineScaleSets"

    # Node count configuration
    # Note: In azurerm v4.x, use either node_count (fixed) OR min_count/max_count (auto-scaling)
    node_count = var.enable_auto_scaling ? null : var.node_count
    min_count  = var.enable_auto_scaling ? var.min_node_count : null
    max_count  = var.enable_auto_scaling ? var.max_node_count : null

    # Cost Optimization: Use ephemeral OS disks if available
    # Only for larger VM sizes (not B-series)
    # ephemeral_disk_size_gb = 0

    # Network configuration
    vnet_subnet_id = var.subnet_id

    # Node labels for workload scheduling
    node_labels = {
      "nodepool-type" = "system"
      "environment"   = var.environment
      "workload"      = "system"
    }

    # Node taints (none for system pool)
    # Allows application pods to run on system nodes for cost savings

    tags = merge(
      var.common_tags,
      {
        NodePool = "system"
      }
    )
  }

  # Identity: Use managed identity (recommended over service principal)
  identity {
    type = "SystemAssigned"
  }

  # Network configuration
  network_profile {
    network_plugin    = var.network_plugin
    network_policy    = var.network_policy
    dns_service_ip    = var.dns_service_ip
    service_cidr      = var.service_cidr
    load_balancer_sku = "standard"
  }

  # RBAC Configuration
  # Note: In azurerm v4.x, Azure AD integration is managed by default
  azure_active_directory_role_based_access_control {
    admin_group_object_ids = var.admin_group_object_ids
    azure_rbac_enabled     = true
  }

  # Azure Monitor integration
  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  # Azure Container Registry integration
  # Allows AKS to pull images from ACR without credentials
  # Note: We'll configure this via role assignment after cluster creation

  # Key Vault integration (for secrets)
  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  # Security: Enable pod security policy (deprecated in K8s 1.25+)
  # Use Azure Policy for Kubernetes instead
  # pod_security_policy_enabled = false

  # Maintenance window (optional)
  # maintenance_window {
  #   allowed {
  #     day   = "Sunday"
  #     hours = [2, 3, 4]
  #   }
  # }

  # Lifecycle management
  lifecycle {
    ignore_changes = [
      kubernetes_version, # Prevent auto-upgrades
      default_node_pool[0].node_count # Allow manual scaling
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name        = var.cluster_name
      Component   = "AKS"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )
}

# ============================================
# ACR INTEGRATION
# Note: ACR role assignment moved to environment-level configuration
# This allows proper dependency management between AKS and ACR modules
# See: infrastructure/terraform/environments/dev/main.tf
# ============================================

# ============================================
# ADDITIONAL NODE POOLS (Optional)
# Uncomment when needed for workload isolation
# ============================================

# resource "azurerm_kubernetes_cluster_node_pool" "user" {
#   name                  = "user"
#   kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
#   vm_size               = "Standard_D2s_v3"
#   node_count            = 1
#   enable_auto_scaling   = true
#   min_count             = 1
#   max_count             = 3
#
#   node_labels = {
#     "nodepool-type" = "user"
#     "environment"   = var.environment
#     "workload"      = "application"
#   }
#
#   tags = merge(
#     var.common_tags,
#     {
#       NodePool = "user"
#     }
#   )
# }
