# ============================================
# VIRTUAL NETWORK (VNet) MODULE
# Network infrastructure for AKS and other resources
# ============================================

# ============================================
# VIRTUAL NETWORK
# ============================================

resource "azurerm_virtual_network" "main" {
  name                = var.vnet_name
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = var.address_space

  tags = merge(
    var.common_tags,
    {
      Name      = var.vnet_name
      Component = "Network"
      ManagedBy = "Terraform"
    }
  )
}

# ============================================
# SUBNETS
# ============================================

# AKS Subnet
resource "azurerm_subnet" "aks" {
  name                 = var.aks_subnet_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.aks_subnet_address_prefixes

  # Required for AKS
  service_endpoints = [
    "Microsoft.Sql",
    "Microsoft.Storage",
    "Microsoft.KeyVault",
    "Microsoft.ContainerRegistry"
  ]
}

# PostgreSQL Subnet (if needed for private endpoint)
resource "azurerm_subnet" "database" {
  count = var.create_database_subnet ? 1 : 0

  name                 = var.database_subnet_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.database_subnet_address_prefixes

  service_endpoints = [
    "Microsoft.Sql"
  ]

  delegation {
    name = "postgresql-delegation"

    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action"
      ]
    }
  }
}

# Application Gateway Subnet (for future ingress)
resource "azurerm_subnet" "appgw" {
  count = var.create_appgw_subnet ? 1 : 0

  name                 = var.appgw_subnet_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.appgw_subnet_address_prefixes
}

# ============================================
# NETWORK SECURITY GROUPS (NSGs)
# ============================================

# AKS NSG
resource "azurerm_network_security_group" "aks" {
  name                = "${var.aks_subnet_name}-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Allow HTTPS from internet (for LoadBalancer service)
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow HTTP from internet (for LoadBalancer service)
  security_rule {
    name                       = "AllowHTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.aks_subnet_name}-nsg"
    }
  )
}

# Associate NSG with AKS subnet
resource "azurerm_subnet_network_security_group_association" "aks" {
  subnet_id                 = azurerm_subnet.aks.id
  network_security_group_id = azurerm_network_security_group.aks.id
}

# ============================================
# NAT GATEWAY (Optional - for outbound internet)
# ============================================

# Public IP for NAT Gateway
resource "azurerm_public_ip" "nat" {
  count = var.create_nat_gateway ? 1 : 0

  name                = "${var.vnet_name}-nat-ip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.vnet_name}-nat-ip"
    }
  )
}

# NAT Gateway
resource "azurerm_nat_gateway" "main" {
  count = var.create_nat_gateway ? 1 : 0

  name                = "${var.vnet_name}-nat"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku_name            = "Standard"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.vnet_name}-nat"
    }
  )
}

# Associate NAT Gateway with Public IP
resource "azurerm_nat_gateway_public_ip_association" "main" {
  count = var.create_nat_gateway ? 1 : 0

  nat_gateway_id       = azurerm_nat_gateway.main[0].id
  public_ip_address_id = azurerm_public_ip.nat[0].id
}

# Associate NAT Gateway with AKS subnet
resource "azurerm_subnet_nat_gateway_association" "aks" {
  count = var.create_nat_gateway ? 1 : 0

  subnet_id      = azurerm_subnet.aks.id
  nat_gateway_id = azurerm_nat_gateway.main[0].id
}
