# ============================================
# TERRAFORM & PROVIDER CONFIGURATION
# Development Environment
# ============================================
# This file configures Terraform and providers for the DEV environment.
# Each environment (dev/staging/prod) has its own providers.tf with
# environment-specific settings.
# ============================================

terraform {
  # Minimum Terraform version required
  required_version = ">= 1.6.0"

  # Required providers with version constraints
  required_providers {
    # Azure Resource Manager provider
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.58.0"  # Allow 4.58.x updates, not 4.59+
    }

    # Random provider (for generating unique names)
    random = {
      source  = "hashicorp/random"
      version = "~> 3.8.0"
    }
  }

  # Backend: Using LOCAL STATE for learning/development
  #
  # State file location: ./terraform.tfstate (gitignored)
  #
  # WHY LOCAL STATE:
  # - Zero cost (no Azure Storage Account needed = save $1/month)
  # - Easy environment recreation: terraform destroy && terraform apply
  # - Perfect for solo learning projects
  # - Simple debugging (state is just a JSON file you can inspect)
  #
  # WHEN TO MIGRATE TO REMOTE BACKEND:
  # - Team collaboration needed
  # - Production environment
  # - State locking required
  # - Backup/versioning needed
  #
  # HOW TO MIGRATE LATER:
  # 1. Create Azure Storage Account manually
  # 2. Uncomment backend block below and configure
  # 3. Run: terraform init -migrate-state
  #
  # backend "azurerm" {
  #   resource_group_name  = "rg-sms-terraform-state"
  #   storage_account_name = "smstfstate<unique-id>"
  #   container_name       = "tfstate"
  #   key                  = "sms-dev.tfstate"
  # }
}

# ============================================
# AZURE PROVIDER CONFIGURATION
# ============================================
# This configures how Terraform interacts with Azure for DEV environment

provider "azurerm" {
  # Subscription ID - explicitly specify for Terraform
  # This is your Azure subscription where resources will be created
  subscription_id = "4430eb12-9548-4af6-b363-c8280245aa35"

  # Features block is REQUIRED by azurerm provider v2.0+
  # Controls provider behavior for specific resource types
  features {

    # PostgreSQL Flexible Server behavior
    postgresql_flexible_server {
      # Auto-restart server when configuration changes (e.g., max_connections)
      # This is convenient for dev, but you might want manual control in prod
      restart_server_on_configuration_value_change = true
    }

    # Resource Group behavior
    resource_group {
      # Allow deletion of resource groups that still contain resources
      # DEV: true (easy cleanup during learning)
      # PROD: false (safety - prevent accidental deletion)
      prevent_deletion_if_contains_resources = false
    }

    # Key Vault behavior (for future use in Phase 1)
    key_vault {
      # Permanently delete soft-deleted key vaults on destroy
      # DEV: true (clean slate for recreation)
      # PROD: false (recovery safety net)
      purge_soft_delete_on_destroy = true

      # Recover soft-deleted key vaults if found
      recover_soft_deleted_key_vaults = true
    }
  }

  # Provider registration
  # Set to true to skip registering Azure providers (faster if already registered)
  # Set to false for first-time setup (ensures providers are registered)
  skip_provider_registration = false

  # Note: This provider will use Azure CLI authentication
  # Make sure you're logged in: az login
  # And have the correct subscription set: az account set --subscription <id>
}

# ============================================
# RANDOM PROVIDER
# ============================================
# Used for generating random strings for globally unique Azure resource names
# Example: Storage accounts need globally unique names across ALL of Azure

provider "random" {
  # No configuration needed for random provider
}
