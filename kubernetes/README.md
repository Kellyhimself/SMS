# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the SMS application to Azure Kubernetes Service (AKS).

## Directory Structure

```
kubernetes/
├── dev/                        # Development environment
│   ├── configmap.yaml         # Non-sensitive configuration
│   ├── secret.yaml            # Sensitive credentials (DO NOT COMMIT)
│   ├── deployment.yaml        # Application deployment
│   ├── service.yaml           # Load balancer service
│   └── kustomization.yaml     # Kustomize configuration
└── README.md                  # This file
```

## Prerequisites

1. **Azure CLI** installed and logged in
2. **kubectl** installed
3. **AKS cluster** running and accessible
4. **ACR** (Azure Container Registry) with the application image
5. **Docker image** pushed to ACR (`sms-app:v1.0.0`)

## Deployment Steps

### 1. Connect to AKS Cluster

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group rg-sms-dev \
  --name aks-sms-dev \
  --overwrite-existing

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 2. Create ACR Image Pull Secret

The deployment needs credentials to pull images from your private Azure Container Registry.

```bash
# Get ACR credentials
ACR_NAME="smscentraldev"
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Create Kubernetes secret for ACR authentication
kubectl create secret docker-registry acr-secret \
  --docker-server=${ACR_NAME}.azurecr.io \
  --docker-username=${ACR_NAME} \
  --docker-password=${ACR_PASSWORD} \
  --docker-email=your-email@example.com \
  --namespace=default

# Verify secret was created
kubectl get secret acr-secret
```

### 3. Update Secret Values

Edit `dev/secret.yaml` and replace placeholder values with actual credentials:

```yaml
AZURE_POSTGRES_PASSWORD: "your-actual-password"
RESEND_API_KEY: "your-actual-api-key"
```

**SECURITY WARNING:** Never commit `secret.yaml` with real values to version control!

Alternatively, create the secret directly with kubectl:

```bash
kubectl create secret generic sms-app-secrets \
  --from-literal=AZURE_POSTGRES_HOST="psql-sms-dev-sci1tp18.postgres.database.azure.com" \
  --from-literal=AZURE_POSTGRES_DATABASE="smsdb" \
  --from-literal=AZURE_POSTGRES_USER="psqladmin" \
  --from-literal=AZURE_POSTGRES_PASSWORD="YOUR_PASSWORD_HERE" \
  --from-literal=RESEND_API_KEY="YOUR_API_KEY_HERE" \
  --namespace=default
```

### 4. Deploy Application

Option A: Using kubectl apply

```bash
# Deploy all resources
kubectl apply -f kubernetes/dev/

# Or deploy individually
kubectl apply -f kubernetes/dev/configmap.yaml
kubectl apply -f kubernetes/dev/secret.yaml
kubectl apply -f kubernetes/dev/deployment.yaml
kubectl apply -f kubernetes/dev/service.yaml
```

Option B: Using Kustomize

```bash
# Deploy with kustomize
kubectl apply -k kubernetes/dev/

# View what would be deployed (dry run)
kubectl apply -k kubernetes/dev/ --dry-run=client -o yaml
```

### 5. Verify Deployment

```bash
# Check all resources
kubectl get all -l app=sms-app

# Check pods are running
kubectl get pods -l app=sms-app
kubectl describe pod -l app=sms-app

# Check deployment status
kubectl rollout status deployment/sms-app

# Check service and get external IP
kubectl get service sms-app-service

# View logs
kubectl logs -l app=sms-app --tail=100 -f
```

### 6. Get External IP Address

```bash
# Get the external IP (may take a few minutes to provision)
kubectl get service sms-app-service -w

# Once EXTERNAL-IP shows an IP address (not <pending>), you can access:
# http://<EXTERNAL-IP>/
# http://<EXTERNAL-IP>/api/health
```

## Health Checks

The application includes comprehensive health checks:

- **Startup Probe**: Gives the app up to 120 seconds to start
- **Liveness Probe**: Restarts container if it becomes unresponsive
- **Readiness Probe**: Stops sending traffic if app isn't ready

All probes use the `/api/health` endpoint.

## Scaling

### Manual Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment sms-app --replicas=3

# Verify scaling
kubectl get pods -l app=sms-app
```

### Auto-scaling (Horizontal Pod Autoscaler)

```bash
# Create HPA (scales between 2-10 pods based on CPU usage)
kubectl autoscale deployment sms-app \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Check HPA status
kubectl get hpa
```

## Rolling Updates

Update the image version in `deployment.yaml` or use kubectl:

```bash
# Update to new version
kubectl set image deployment/sms-app \
  sms-app=smscentraldev.azurecr.io/sms-app:v1.1.0

# Watch rollout
kubectl rollout status deployment/sms-app

# Rollback if needed
kubectl rollout undo deployment/sms-app
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -l app=sms-app

# Describe pod for events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Get previous container logs (if crashed)
kubectl logs <pod-name> --previous
```

### Image Pull Errors

```bash
# Verify ACR secret exists
kubectl get secret acr-secret

# Test ACR authentication
az acr login --name smscentraldev

# Verify image exists
az acr repository show --name smscentraldev --image sms-app:v1.0.0
```

### Database Connection Issues

```bash
# Check if secret is applied
kubectl get secret sms-app-secrets
kubectl describe secret sms-app-secrets

# Verify environment variables in pod
kubectl exec -it <pod-name> -- env | grep AZURE_POSTGRES

# Test database connectivity from pod
kubectl exec -it <pod-name> -- sh
# Then inside pod:
# apk add postgresql-client
# psql -h $AZURE_POSTGRES_HOST -U $AZURE_POSTGRES_USER -d $AZURE_POSTGRES_DATABASE
```

### Service Not Accessible

```bash
# Check service
kubectl get service sms-app-service
kubectl describe service sms-app-service

# Check endpoints
kubectl get endpoints sms-app-service

# Verify load balancer is provisioned
az network lb list --resource-group MC_rg-sms-dev_aks-sms-dev_eastus
```

## Cleanup

```bash
# Delete all resources
kubectl delete -k kubernetes/dev/

# Or delete individually
kubectl delete -f kubernetes/dev/

# Delete ACR secret
kubectl delete secret acr-secret

# Verify cleanup
kubectl get all -l app=sms-app
```

## Security Best Practices

1. **Never commit secrets** - Use Azure Key Vault or sealed secrets
2. **Use RBAC** - Limit who can deploy to production
3. **Enable Pod Security Policies** - Restrict what pods can do
4. **Network Policies** - Control traffic between pods
5. **Regular Updates** - Keep images and dependencies up to date
6. **Scan Images** - Use Trivy or similar tools to scan for vulnerabilities

## Next Steps

1. Set up Ingress controller for custom domain and HTTPS
2. Implement Azure Key Vault integration for secrets
3. Add monitoring with Prometheus and Grafana
4. Set up alerting with Azure Monitor
5. Implement CI/CD pipeline with GitHub Actions
6. Add network policies for security
7. Configure backup and disaster recovery
