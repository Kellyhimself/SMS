# ============================================
# VNET MODULE - VARIABLES
# ============================================

variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "address_space" {
  description = "Address space for the VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "aks_subnet_name" {
  description = "Name of the AKS subnet"
  type        = string
  default     = "aks-subnet"
}

variable "aks_subnet_address_prefixes" {
  description = "Address prefixes for AKS subnet"
  type        = list(string)
  default     = ["10.0.1.0/24"]
}

variable "create_database_subnet" {
  description = "Create a dedicated database subnet"
  type        = bool
  default     = false
}

variable "database_subnet_name" {
  description = "Name of the database subnet"
  type        = string
  default     = "database-subnet"
}

variable "database_subnet_address_prefixes" {
  description = "Address prefixes for database subnet"
  type        = list(string)
  default     = ["10.0.2.0/24"]
}

variable "create_appgw_subnet" {
  description = "Create Application Gateway subnet"
  type        = bool
  default     = false
}

variable "appgw_subnet_name" {
  description = "Name of the Application Gateway subnet"
  type        = string
  default     = "appgw-subnet"
}

variable "appgw_subnet_address_prefixes" {
  description = "Address prefixes for Application Gateway subnet"
  type        = list(string)
  default     = ["10.0.3.0/24"]
}

variable "create_nat_gateway" {
  description = "Create NAT Gateway for outbound internet access"
  type        = bool
  default     = false  # Disabled for cost savings
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
