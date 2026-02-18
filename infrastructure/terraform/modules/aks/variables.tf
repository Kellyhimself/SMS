# ============================================
# AKS MODULE - VARIABLES
# ============================================

# ============================================
# REQUIRED VARIABLES
# ============================================

variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
}

variable "location" {
  description = "Azure region for the cluster"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix for the cluster"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for the AKS cluster"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID for monitoring"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

# ============================================
# OPTIONAL VARIABLES
# ============================================

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"  # Stable version as of Feb 2026
}

variable "node_count" {
  description = "Number of nodes in the default node pool"
  type        = number
  default     = 1  # Cost-optimized for development
}

variable "node_vm_size" {
  description = "VM size for nodes"
  type        = string
  default     = "Standard_B2s"  # 2 vCPU, 4GB RAM - cost-effective

  validation {
    condition = can(regex("^Standard_", var.node_vm_size))
    error_message = "VM size must be a valid Azure Standard size."
  }
}

variable "os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 30  # Minimum recommended
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for the node pool"
  type        = bool
  default     = false  # Manual scaling for development
}

variable "min_node_count" {
  description = "Minimum node count when auto-scaling is enabled"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum node count when auto-scaling is enabled"
  type        = number
  default     = 3
}

variable "network_plugin" {
  description = "Network plugin (azure or kubenet)"
  type        = string
  default     = "azure"  # Azure CNI for better integration

  validation {
    condition     = contains(["azure", "kubenet"], var.network_plugin)
    error_message = "Network plugin must be 'azure' or 'kubenet'."
  }
}

variable "network_policy" {
  description = "Network policy plugin"
  type        = string
  default     = "azure"  # Azure Network Policy for security

  validation {
    condition     = contains(["azure", "calico", "none"], var.network_policy)
    error_message = "Network policy must be 'azure', 'calico', or 'none'."
  }
}

variable "dns_service_ip" {
  description = "IP address for DNS service within cluster"
  type        = string
  default     = "10.2.0.10"
}

variable "service_cidr" {
  description = "CIDR range for services"
  type        = string
  default     = "10.2.0.0/16"
}

variable "admin_group_object_ids" {
  description = "Azure AD group object IDs for cluster admin access"
  type        = list(string)
  default     = []  # Empty for now, configure later
}

variable "acr_id" {
  description = "Azure Container Registry resource ID for image pulling"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
