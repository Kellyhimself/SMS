# ============================================
# AKS MODULE - OUTPUTS
# ============================================

# ============================================
# CLUSTER INFORMATION
# ============================================

output "cluster_id" {
  description = "AKS cluster resource ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_fqdn" {
  description = "AKS cluster FQDN"
  value       = azurerm_kubernetes_cluster.main.fqdn
}

output "kubernetes_version" {
  description = "Kubernetes version"
  value       = azurerm_kubernetes_cluster.main.kubernetes_version
}

# ============================================
# KUBECONFIG
# ============================================

output "kubeconfig" {
  description = "Kubernetes configuration for kubectl access"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "kube_admin_config" {
  description = "Kubernetes admin configuration"
  value       = azurerm_kubernetes_cluster.main.kube_admin_config_raw
  sensitive   = true
}

output "host" {
  description = "Kubernetes API server host"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].host
  sensitive   = true
}

output "client_certificate" {
  description = "Kubernetes client certificate"
  value       = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_certificate)
  sensitive   = true
}

output "client_key" {
  description = "Kubernetes client key"
  value       = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_key)
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Kubernetes cluster CA certificate"
  value       = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
  sensitive   = true
}

# ============================================
# IDENTITY
# ============================================

output "kubelet_identity_object_id" {
  description = "Object ID of the Kubelet managed identity"
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "kubelet_identity_client_id" {
  description = "Client ID of the Kubelet managed identity"
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].client_id
}

output "system_assigned_identity_principal_id" {
  description = "Principal ID of the system assigned identity"
  value       = azurerm_kubernetes_cluster.main.identity[0].principal_id
}

# ============================================
# NETWORK
# ============================================

output "node_resource_group" {
  description = "Auto-generated resource group containing cluster resources"
  value       = azurerm_kubernetes_cluster.main.node_resource_group
}

output "network_profile" {
  description = "Network profile of the cluster"
  value = {
    network_plugin = azurerm_kubernetes_cluster.main.network_profile[0].network_plugin
    network_policy = azurerm_kubernetes_cluster.main.network_profile[0].network_policy
    service_cidr   = azurerm_kubernetes_cluster.main.network_profile[0].service_cidr
    dns_service_ip = azurerm_kubernetes_cluster.main.network_profile[0].dns_service_ip
  }
}

# ============================================
# KUBECTL COMMANDS
# ============================================

output "kubectl_connect_command" {
  description = "Command to connect kubectl to the cluster"
  value       = "az aks get-credentials --resource-group ${var.resource_group_name} --name ${azurerm_kubernetes_cluster.main.name}"
}

output "cluster_info_command" {
  description = "Command to get cluster information"
  value       = "kubectl cluster-info"
}

# ============================================
# COST ESTIMATE
# ============================================

output "estimated_monthly_cost" {
  description = "Estimated monthly cost for AKS resources"
  value = {
    control_plane = 0  # Free tier
    nodes = {
      vm_cost      = var.node_vm_size == "Standard_B2s" ? 30.00 * var.node_count : 60.00 * var.node_count
      disk_cost    = (var.os_disk_size_gb / 1024) * 0.10 * var.node_count
      total_nodes  = var.node_vm_size == "Standard_B2s" ? (30.00 + (var.os_disk_size_gb / 1024 * 0.10)) * var.node_count : (60.00 + (var.os_disk_size_gb / 1024 * 0.10)) * var.node_count
    }
    load_balancer = 0.50  # Basic Load Balancer
    total         = (var.node_vm_size == "Standard_B2s" ? 30.00 : 60.00) * var.node_count + 0.50
  }
}

# ============================================
# NEXT STEPS
# ============================================

output "next_steps" {
  description = "Next steps after cluster deployment"
  value = <<-EOT
    ✅ AKS Cluster deployed successfully!

    📋 Cluster Information:
    - Name: ${azurerm_kubernetes_cluster.main.name}
    - Kubernetes Version: ${azurerm_kubernetes_cluster.main.kubernetes_version}
    - Node Count: ${var.node_count}
    - VM Size: ${var.node_vm_size}
    - Location: ${var.location}

    🔧 Next Steps:
    1. Connect kubectl to cluster:
       az aks get-credentials --resource-group ${var.resource_group_name} --name ${azurerm_kubernetes_cluster.main.name}

    2. Verify cluster is running:
       kubectl get nodes
       kubectl get pods --all-namespaces

    3. Deploy your application:
       kubectl apply -f kubernetes/

    4. View cluster dashboard (optional):
       az aks browse --resource-group ${var.resource_group_name} --name ${azurerm_kubernetes_cluster.main.name}

    💰 Estimated Monthly Cost: $${(var.node_vm_size == "Standard_B2s" ? 30.00 : 60.00) * var.node_count + 0.50}/month

    📚 Documentation:
    - AKS: https://learn.microsoft.com/en-us/azure/aks/
    - kubectl: https://kubernetes.io/docs/reference/kubectl/
  EOT
}
