# Check what's using port 3000
netstat -ano | findstr :3000


📚 Useful Commands
Database Management:


# Connect to database
.\infrastructure\migrations\connect-azure-db.bat

# Run migrations
.\infrastructure\migrations\run-migration.ps1

# Test connection
.\infrastructure\migrations\test-connection.ps1

Terraform:


cd infrastructure/terraform/environments/dev

# View outputs
terraform output -json

# Refresh state
terraform refresh

# Destroy (when needed)
terraform destroy

# View server status
az postgres flexible-server show \
  --resource-group rg-sms-dev \
  --name psql-sms-dev-sci1tp18

# View costs
az consumption usage list --subscription "4430eb12-9548-4af6-b363-c8280245aa35"


# ============================================
# AZ commands
# ============================================
# Check current role assignments
az role assignment list --assignee $(az account show --query user.name -o tsv) --subscription "Azure subscription 1" -o table

# Add Cost Management Contributor role
az role assignment create \
  --assignee $(az account show --query user.name -o tsv) \
  --role "Cost Management Contributor" \
  --scope "/subscriptions/4430eb12-9548-4af6-b363-c8280245aa35"

#checking role assignments for user:
cd infrastructure/terraform/environments/dev && az role assignment list --all --query "[?principalName=='sonovaappex@gmail.com'].{Role:roleDefinitionName, Scope:scope}" -o table

# ============================================
Monitor costs:

az consumption usage list
az consumption budget list

Container orchestration with Kubernetis
# ============================================
Practice Exercise:


# Connect to your AKS cluster
az aks get-credentials --resource-group rg-sms-dev --name aks-sms-dev

# View cluster components
kubectl get nodes
kubectl get pods --all-namespaces
kubectl get services --all-namespaces

# Create a test namespace
kubectl create namespace test-app

# View cluster events
kubectl get events --all-namespaces


Container Registry
# ============================================
Core Concepts:
Image Layers

Docker images are built in layers (each Dockerfile instruction = layer)
Layers are cached and reused for efficiency
Smaller layers = faster builds and pulls
Image Tags

Version identifiers (:latest, :v1.2.3, :commit-sha)
Never use :latest in production (not reproducible)
Use semantic versioning or git commit SHAs
Image Scanning

Scans for vulnerabilities (CVEs) in base images and dependencies
Microsoft Defender for Containers integrates with ACR
Fails CI/CD pipeline if critical vulnerabilities found
Registry Authentication

Service Principal: For CI/CD pipelines
Managed Identity: For AKS to pull images (what we configured)
Admin credentials: For development only (what we enabled)
Practice Exercise:

# Login to ACR
az acr login --name smscentraldev

# List repositories (will be empty until you push)
az acr repository list --name smscentraldev -o table

# Enable image scanning (requires Microsoft Defender)
# az security atp storage update --resource-group rg-sms-dev --storage-ac

3. Networking in Azure
Core Concepts:
Virtual Networks (VNet)

Private network in Azure (like your home network)
Address space: 10.0.0.0/16 (65,536 IPs)
Subnets divide VNet into smaller segments
Subnets

AKS Subnet (10.0.1.0/24): 256 IPs for AKS nodes and pods
Each pod gets an IP from this subnet (Azure CNI)
Plan carefully - running out of IPs blocks scaling
Network Security Groups (NSG)

Firewall rules for subnets
Inbound/outbound rules (allow/deny traffic)
Default: Deny all inbound, allow all outbound
Azure CNI vs Kubenet

Azure CNI (what we use): Pods get VNet IPs, can communicate directly with Azure services
Kubenet: Pods use private network, NAT for external communication (saves IPs)
Service CIDR vs Pod CIDR

Service CIDR (10.2.0.0/16): IP range for Kubernetes services (internal only)
Pod CIDR: Not needed with Azure CNI (uses VNet subnet)
Network Flow Example:

Internet → Load Balancer (Public IP) 
  → AKS Service (10.2.0.10) 
  → Pod (10.0.1.25) 
  → PostgreSQL (private endpoint)
4. Security - Azure Key Vault
Core Concepts:
Secrets Management

Never store secrets in code, config files, or environment variables (visible in process list)
Key Vault centralizes secret storage with audit logs
Secrets have versions and expiration dates
Access Policies vs RBAC

Access Policies (what we use): Grant specific permissions to identities
RBAC: Azure role-based access control (newer approach)
Managed Identities

AKS pods can authenticate to Key Vault without storing credentials
System-assigned: Tied to resource lifecycle
User-assigned: Independent lifecycle, can be shared
CSI Driver for Kubernetes

Mounts Key Vault secrets as files in pods
Secrets auto-rotate without pod restart
We enabled this with key_vault_secrets_provider
Practice Exercise:

# Store a secret
az keyvault secret set --vault-name kv-sms-central-dev --name "DatabasePassword" --value "YourSecretValue"

# Retrieve a secret
az keyvault secret show --vault-name kv-sms-central-dev --name "DatabasePassword" --query value -o tsv

# List secrets
az keyvault secret list --vault-name kv-sms-central-dev -o table
5. Observability - Log Analytics & Sentinel
Core Concepts:
Kusto Query Language (KQL)

Query language for Log Analytics (similar to SQL)
Essential for troubleshooting and security analysis

// View AKS container logs
ContainerLog
| where TimeGenerated > ago(1h)
| where ContainerName contains "sms-app"
| project TimeGenerated, Computer, LogEntry
| order by TimeGenerated desc

// Detect failed login attempts
SigninLogs
| where ResultType != 0  // Non-zero = failure
| summarize FailedAttempts = count() by UserPrincipalName, IPAddress
| where FailedAttempts > 5
Container Insights

Collects metrics and logs from AKS nodes and containers
Performance data: CPU, memory, disk, network
View in Azure Portal → Monitor → Containers
Microsoft Sentinel (SIEM/SOAR)

SIEM: Security Information and Event Management (log aggregation and analysis)
SOAR: Security Orchestration, Automation, and Response (automated incident response)
Analytics Rules: KQL queries that detect threats and create incidents
Workbooks: Dashboards for security visibility
Playbooks: Automated responses (e.g., block IP, disable user)
Log Flow:

AKS Pods → Container Insights → Log Analytics Workspace → Sentinel
                                                         ↓
                                                   Alerts & Incidents
6. Infrastructure as Code - Terraform
Core Concepts:
Declarative vs Imperative

Declarative (Terraform): Describe desired state, Terraform figures out how
Imperative (Bash scripts): Step-by-step instructions
State Management

terraform.tfstate: Current state of infrastructure
Never edit manually - can corrupt infrastructure
Store remotely (Azure Blob Storage) for team collaboration
Modules

Reusable Terraform code (like functions in programming)
We created 6 modules: AKS, ACR, VNet, Key Vault, Log Analytics, Sentinel
Benefits: DRY principle, easier testing, versioning
Dependencies

depends_on: Explicit dependencies between resources
Implicit dependencies: Terraform detects from resource references
Example: AKS depends on VNet (needs subnet ID)
Terraform Workflow


terraform init      # Download providers, initialize backend
terraform plan      # Preview changes (dry run)
terraform apply     # Create/update infrastructure
terraform destroy   # Delete all resources
Best Practices You Applied:

Separate modules from environments
Use variables for reusability
Output important values
Tag all resources for cost tracking
Use depends_on for correct resource ordering
7. DevSecOps Principles
Shift Left Security:
Security integrated early in development, not after deployment.

What we'll implement next:

SAST (Static Application Security Testing)

CodeQL: Analyzes code for vulnerabilities (SQL injection, XSS)
Semgrep: Pattern-based code scanning
Runs on every commit
Dependency Scanning

Snyk/npm audit: Scans dependencies for known vulnerabilities
Fails build if critical CVEs found
Container Scanning

Trivy: Scans Docker images for OS and app vulnerabilities
Runs before pushing to ACR
DAST (Dynamic Application Security Testing)

OWASP ZAP: Tests running app for vulnerabilities
Runs in staging environment
Security Gates in CI/CD:

Code Commit → SAST → Build → Container Scan → Push to ACR 
  → Deploy to Staging → DAST → Manual Approval → Deploy to Prod
8. Cost Optimization
Concepts Applied:
Right-Sizing

Started with smallest VM (Standard_B2ps_v2) for learning
Monitor usage, scale up only when needed
Budget Alerts

Set $50/month, $200 total budget
Alerts at 50%, 75%, 90%, 100% thresholds
Email notifications to sonovaappex@gmail.com
Free Tier Usage

AKS control plane: Free tier
PostgreSQL: B_Standard_B1ms (cheapest tier)
Basic SKUs where possible (ACR, Key Vault)
Tagging Strategy


tags = {
  Project     = "SchoolManagementSystem"
  Environment = "dev"
  CostCenter  = "Learning"
  Phase       = "Phase1"
  Owner       = "DevOps-Team"
}
Query costs by tag in Azure Cost Management
9. Next Steps - Hands-On Learning
Week 1: Kubernetes Basics

# Deploy a test nginx pod
kubectl run nginx --image=nginx --port=80

# Expose it as a service
kubectl expose pod nginx --type=LoadBalancer --port=80

# Get external IP
kubectl get services

# View logs
kubectl logs nginx

# Execute commands in pod
kubectl exec -it nginx -- /bin/bash

# Delete resources
kubectl delete pod nginx
kubectl delete service nginx
Week 2: Container Basics

# Create a simple Dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 80

# Build and push
docker build -t smscentraldev.azurecr.io/test:v1 .
docker push smscentraldev.azurecr.io/test:v1
Week 3: Security & Monitoring

# View KQL queries in Azure Portal
# Portal → Log Analytics → Logs

# Practice KQL queries
# Start with: Perf | take 10

# Configure Sentinel alerts
# Portal → Sentinel → Analytics → Create scheduled rule
10. Recommended Learning Resources
Kubernetes:

Official docs: https://kubernetes.io/docs/tutorials/
Practice: https://www.katacoda.com/courses/kubernetes
Azure:

Microsoft Learn AKS path
Azure Architecture Center
Security:

OWASP Top 10: https://owasp.org/www-project-top-ten/
DevSecOps manifesto
KQL:

Must Learn KQL series on YouTube
https://aka.ms/lademo (Log Analytics demo environment)
Your Current Infrastructure Summary

Resource Group: rg-sms-dev
├── AKS Cluster (aks-sms-dev)
│   ├── 1 node (Standard_B2ps_v2)
│   ├── Kubernetes 1.33.6
│   └── Integrated with ACR, Key Vault, Log Analytics
├── Container Registry (smscentraldev.azurecr.io)
├── Key Vault (kv-sms-central-dev)
├── Virtual Network (vnet-sms-dev)
│   └── AKS Subnet (10.0.1.0/24)
├── Log Analytics (law-sms-dev)
├── Sentinel (SecurityInsights)
├── PostgreSQL (psql-sms-dev-sci1tp18)
└── Budgets (50/month, $200 total)
