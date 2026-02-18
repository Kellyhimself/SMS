# ============================================
# KUBERNETES DEPLOYMENT SCRIPT (PowerShell)
# Automates deployment of SMS app to AKS
# ============================================

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "rg-sms-dev"
$AKS_NAME = "aks-sms-dev"
$ACR_NAME = "smscentraldev"
$NAMESPACE = "default"
$APP_NAME = "sms-app"

Write-Host "========================================" -ForegroundColor Green
Write-Host "SMS Application Deployment to AKS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Connect to AKS
Write-Host "[1/6] Connecting to AKS cluster..." -ForegroundColor Yellow
az aks get-credentials `
  --resource-group $RESOURCE_GROUP `
  --name $AKS_NAME `
  --overwrite-existing

# Verify connection
Write-Host "Verifying cluster connection..."
kubectl cluster-info
Write-Host ""

# Step 2: Create ACR Secret
Write-Host "[2/6] Creating ACR image pull secret..." -ForegroundColor Yellow
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

# Delete existing secret if it exists
kubectl delete secret acr-secret --namespace=$NAMESPACE --ignore-not-found=true 2>$null

# Create new secret
kubectl create secret docker-registry acr-secret `
  --docker-server="$ACR_NAME.azurecr.io" `
  --docker-username=$ACR_NAME `
  --docker-password=$ACR_PASSWORD `
  --docker-email="admin@example.com" `
  --namespace=$NAMESPACE

Write-Host "ACR secret created successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Apply SecretProviderClass
Write-Host "[3/6] Applying SecretProviderClass for Azure Key Vault..." -ForegroundColor Yellow
kubectl apply -f secretproviderclass.yaml
Write-Host "SecretProviderClass applied successfully" -ForegroundColor Green
Write-Host "Secrets will be synced from Azure Key Vault when pods start" -ForegroundColor Cyan
Write-Host ""

# Step 4: Apply ConfigMap
Write-Host "[4/6] Applying ConfigMap..." -ForegroundColor Yellow
kubectl apply -f configmap.yaml
Write-Host "ConfigMap applied successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy Application
Write-Host "[5/6] Deploying application..." -ForegroundColor Yellow
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
Write-Host "Deployment and Service created successfully" -ForegroundColor Green
Write-Host "Secrets will be automatically synced from Key Vault to pods" -ForegroundColor Cyan
Write-Host ""

# Step 6: Wait for deployment
Write-Host "[6/6] Waiting for deployment to be ready..." -ForegroundColor Yellow
kubectl rollout status deployment/$APP_NAME --namespace=$NAMESPACE --timeout=5m

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Show deployment status
Write-Host "Pods:"
kubectl get pods -l app=$APP_NAME --namespace=$NAMESPACE
Write-Host ""

Write-Host "Service:"
kubectl get service sms-app-service --namespace=$NAMESPACE
Write-Host ""

Write-Host "Getting external IP (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "Run this command to watch for the external IP:"
Write-Host "kubectl get service sms-app-service --namespace=$NAMESPACE -w"
Write-Host ""

# Try to get external IP
$EXTERNAL_IP = ""
for ($i = 1; $i -le 30; $i++) {
  $EXTERNAL_IP = kubectl get service sms-app-service --namespace=$NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
  if ($EXTERNAL_IP) {
    break
  }
  Write-Host "Waiting for external IP... ($i/30)"
  Start-Sleep -Seconds 10
}

if ($EXTERNAL_IP) {
  Write-Host "External IP assigned: $EXTERNAL_IP" -ForegroundColor Green
  Write-Host ""
  Write-Host "Access your application at:"
  Write-Host "http://$EXTERNAL_IP/" -ForegroundColor Green
  Write-Host "http://$EXTERNAL_IP/api/health" -ForegroundColor Green
} else {
  Write-Host "External IP not yet assigned. Run the watch command above to monitor." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Useful commands:"
Write-Host "- View logs: kubectl logs -l app=$APP_NAME --tail=100 -f"
Write-Host "- Check pods: kubectl get pods -l app=$APP_NAME"
Write-Host "- Describe deployment: kubectl describe deployment $APP_NAME"
Write-Host "- Delete deployment: kubectl delete -f kubernetes/dev/"
