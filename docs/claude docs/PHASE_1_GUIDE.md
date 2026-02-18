# Phase 1: DevSecOps Foundation - Implementation Guide
## Azure Kubernetes Service (AKS) + CI/CD Security Pipeline

**Timeline**: Feb 1 - Mar 7, 2026 (4 weeks)
**Budget**: $40
**Status**: 🚀 IN PROGRESS

---

## 📋 PHASE 1 OVERVIEW

### Learning Objectives

By the end of Phase 1, you will have hands-on experience with:

**DevSecOps Skills:**
- ✅ Azure Kubernetes Service (AKS) deployment and management
- ✅ Infrastructure as Code (Terraform) for production workloads
- ✅ Container orchestration (Kubernetes/Docker)
- ✅ Azure Container Registry (ACR) for private image storage
- ✅ CI/CD pipelines with GitHub Actions
- ✅ Security scanning (SAST, DAST, container scanning, dependency scanning)

**Security & Compliance:**
- ✅ Microsoft Sentinel SIEM setup
- ✅ Azure Key Vault for secrets management
- ✅ Log Analytics for centralized logging
- ✅ Security gates in deployment pipeline

**Tools You'll Master:**
- Terraform (IaC)
- Docker (containerization)
- Kubernetes/AKS (orchestration)
- GitHub Actions (CI/CD)
- CodeQL, Semgrep (SAST)
- Snyk, npm audit (dependency scanning)
- Trivy (container scanning)
- OWASP ZAP (DAST)

---

## 🗓️ WEEK-BY-WEEK BREAKDOWN

### Week 1: Infrastructure Setup (Feb 1-7)

**Day 1-2: AKS Cluster**
- [ ] Create AKS Terraform module
- [ ] Configure node pool (cost-optimized B-series VMs)
- [ ] Set up networking (Azure CNI, network policies)
- [ ] Configure RBAC
- [ ] Deploy AKS cluster

**Day 3: Azure Container Registry**
- [ ] Create ACR Terraform module
- [ ] Enable admin access (for development)
- [ ] Configure geo-replication (optional)
- [ ] Set up image scanning

**Day 4: Azure Key Vault**
- [ ] Create Key Vault Terraform module
- [ ] Configure access policies
- [ ] Add database credentials as secrets
- [ ] Integrate with AKS (CSI driver)

**Day 5: Log Analytics & Sentinel**
- [ ] Create Log Analytics Workspace
- [ ] Create Microsoft Sentinel workspace
- [ ] Configure data connectors
- [ ] Set up initial logging

**Day 6-7: Integration & Testing**
- [ ] Integrate all modules into dev environment
- [ ] Deploy complete infrastructure
- [ ] Verify connectivity
- [ ] Test kubectl access

---

### Week 2: Containerization (Feb 8-14)

**Day 1-2: Dockerize Application**
- [ ] Create multi-stage Dockerfile
- [ ] Optimize image size
- [ ] Create .dockerignore
- [ ] Build local image
- [ ] Test locally

**Day 3: Push to ACR**
- [ ] Login to Azure Container Registry
- [ ] Tag image properly
- [ ] Push image to ACR
- [ ] Verify image in ACR portal

**Day 4-5: Kubernetes Manifests**
- [ ] Create Deployment manifest
- [ ] Create Service manifest (LoadBalancer)
- [ ] Create ConfigMap for environment variables
- [ ] Create Secret for database credentials
- [ ] Create Ingress (optional)

**Day 6-7: Deploy to AKS**
- [ ] Connect to AKS cluster
- [ ] Apply manifests
- [ ] Verify pods are running
- [ ] Test application access
- [ ] Check logs

---

### Week 3: CI/CD Pipeline (Feb 15-21)

**Day 1-2: GitHub Actions Setup**
- [ ] Create .github/workflows directory
- [ ] Create main pipeline workflow
- [ ] Configure build stage
- [ ] Configure test stage
- [ ] Configure deploy stage

**Day 3: SAST Integration**
- [ ] Add CodeQL workflow
- [ ] Add Semgrep workflow
- [ ] Configure SonarCloud (optional)
- [ ] Set up failure thresholds

**Day 4: Dependency Scanning**
- [ ] Add Snyk scanning
- [ ] Add npm audit
- [ ] Configure vulnerability thresholds
- [ ] Set up automated PR creation for fixes

**Day 5: Container Scanning**
- [ ] Add Trivy scanning
- [ ] Scan for vulnerabilities
- [ ] Scan for misconfigurations
- [ ] Block high/critical vulnerabilities

**Day 6-7: Testing & Refinement**
- [ ] Test complete pipeline
- [ ] Optimize build times
- [ ] Add caching
- [ ] Document workflow

---

### Week 4: DAST & Finalization (Feb 22-28)

**Day 1-2: DAST Integration**
- [ ] Set up OWASP ZAP
- [ ] Configure baseline scan
- [ ] Add to CI/CD pipeline
- [ ] Review and fix findings

**Day 3-4: Security Hardening**
- [ ] Review all security scans
- [ ] Fix identified vulnerabilities
- [ ] Implement security best practices
- [ ] Update dependencies

**Day 5: Documentation**
- [ ] Update architecture diagrams
- [ ] Document deployment process
- [ ] Create runbook for operations
- [ ] Update TRANSFORMATION_ROADMAP.md

**Day 6-7: Phase 1 Review**
- [ ] Test complete workflow end-to-end
- [ ] Verify all security gates
- [ ] Check budget spending
- [ ] Prepare for Phase 2

---

## 💰 COST BREAKDOWN (Estimated)

### Azure Resources

| Resource | SKU | Monthly Cost | Notes |
|----------|-----|--------------|-------|
| AKS Cluster | Free tier | $0 | Control plane is free |
| Node Pool (1 node) | Standard_B2s | $30 | 2 vCPU, 4GB RAM |
| Azure Container Registry | Basic | $5 | 10GB storage |
| Log Analytics | Pay-as-you-go | $2 | ~5GB ingestion |
| Sentinel | Pay-as-you-go | $2 | Basic ingestion |
| Key Vault | Standard | $0.50 | <10,000 operations |
| Load Balancer | Basic | $0.50 | For AKS service |
| **Total Phase 1** | | **~$40/month** | Within budget ✅ |

### Free Tools
- GitHub Actions (2,000 minutes/month free)
- CodeQL (free for public repos)
- Snyk (free tier)
- Trivy (open source)
- OWASP ZAP (open source)

---

## 🎯 SUCCESS CRITERIA

Phase 1 is complete when:

- [ ] AKS cluster is running and accessible
- [ ] Application is containerized and deployed to AKS
- [ ] ACR contains versioned Docker images
- [ ] CI/CD pipeline runs automatically on git push
- [ ] All security scans are integrated and passing
- [ ] Secrets are stored in Azure Key Vault
- [ ] Logs are collected in Log Analytics
- [ ] Sentinel is configured for basic monitoring
- [ ] Documentation is updated
- [ ] Cost is under $40/month

---

## 🚀 LET'S START: TASK 1 - AKS TERRAFORM MODULE

### What We're Building

An Azure Kubernetes Service (AKS) cluster with:
- 1 node (Standard_B2s) for cost optimization
- Azure CNI networking
- Network policies enabled
- RBAC enabled
- Managed identity
- Integration with Azure Container Registry
- Auto-scaling disabled (manual for now)

### File Structure

```
infrastructure/terraform/modules/aks/
├── main.tf       # AKS cluster and node pool resources
├── variables.tf  # Input variables
└── outputs.tf    # Cluster info (kubeconfig, etc.)
```

### Next Steps

I'll create the AKS Terraform module now. This will be the foundation for running your containerized application.

**Ready to proceed?** I'll create:
1. AKS Terraform module
2. ACR Terraform module
3. Key Vault Terraform module
4. Log Analytics & Sentinel modules
5. Integrate everything into dev environment

After that, we'll containerize your Next.js app and deploy it!

---

## 📚 REFERENCE LINKS

### Azure Documentation
- [AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [ACR Documentation](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/)
- [Microsoft Sentinel](https://learn.microsoft.com/en-us/azure/sentinel/)

### Tool Documentation
- [Terraform AzureRM Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Kubernetes](https://kubernetes.io/docs/)
- [Docker](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Phase 1 Guide v1.0**
**Created**: February 1, 2026
**Last Updated**: February 1, 2026
**Status**: 🚀 Ready to Start
