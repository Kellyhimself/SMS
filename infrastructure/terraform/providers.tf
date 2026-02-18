# ============================================
# TERRAFORM PROVIDERS CONFIGURATION
# School Management System - Azure Infrastructure
# ============================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  # Backend configuration - LOCAL STATE for learning/development
  #
  # WHY LOCAL STATE:
  # - Zero cost (no storage account needed)
  # - Easy to destroy/recreate environments
  # - Perfect for solo learning projects
  # - State file: infrastructure/terraform/environments/dev/terraform.tfstate
  #
  # TO MIGRATE TO AZURE BACKEND LATER (for production):
  # 1. Uncomment the azurerm backend below
  # 2. Create storage account manually
  # 3. Run: terraform init -migrate-state
  #
  # backend "azurerm" {
  #   resource_group_name  = "rg-sms-terraform-state"
  #   storage_account_name = "smstfstate<unique-id>"
  #   container_name       = "tfstate"
  #   key                  = "sms-dev.tfstate"
  # }
}

provider "azurerm" {
  features {
    # PostgreSQL features
    postgresql_flexible_server {
      restart_server_on_configuration_value_change = true
    }

    # Resource Group features
    resource_group {
      prevent_deletion_if_contains_resources = false
    }

    # Key Vault features
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }

  # Skip provider registration (faster deployments)
  skip_provider_registration = false
}

provider "random" {
  # Random provider for generating unique names
}
