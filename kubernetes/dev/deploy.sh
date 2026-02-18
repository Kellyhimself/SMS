#!/bin/bash

# ============================================
# KUBERNETES DEPLOYMENT SCRIPT
# Automates deployment of SMS app to AKS
# ============================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-sms-dev"
AKS_NAME="aks-sms-dev"
ACR_NAME="smscentraldev"
NAMESPACE="default"
APP_NAME="sms-app"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SMS Application Deployment to AKS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Connect to AKS
echo -e "${YELLOW}[1/6] Connecting to AKS cluster...${NC}"
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --overwrite-existing

# Verify connection
echo "Verifying cluster connection..."
kubectl cluster-info
echo ""

# Step 2: Create ACR Secret
echo -e "${YELLOW}[2/6] Creating ACR image pull secret...${NC}"
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Delete existing secret if it exists
kubectl delete secret acr-secret --namespace=$NAMESPACE --ignore-not-found=true

# Create new secret
kubectl create secret docker-registry acr-secret \
  --docker-server=${ACR_NAME}.azurecr.io \
  --docker-username=${ACR_NAME} \
  --docker-password=${ACR_PASSWORD} \
  --docker-email=admin@example.com \
  --namespace=$NAMESPACE

echo -e "${GREEN}ACR secret created successfully${NC}"
echo ""

# Step 3: Apply SecretProviderClass
echo -e "${YELLOW}[3/6] Applying SecretProviderClass for Azure Key Vault...${NC}"
kubectl apply -f secretproviderclass.yaml
echo -e "${GREEN}SecretProviderClass applied successfully${NC}"
echo -e "\033[0;36mSecrets will be synced from Azure Key Vault when pods start${NC}"
echo ""

# Step 4: Apply ConfigMap
echo -e "${YELLOW}[4/6] Applying ConfigMap...${NC}"
kubectl apply -f configmap.yaml
echo -e "${GREEN}ConfigMap applied successfully${NC}"
echo ""

# Step 5: Deploy Application
echo -e "${YELLOW}[5/6] Deploying application...${NC}"
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
echo -e "${GREEN}Deployment and Service created successfully${NC}"
echo -e "\033[0;36mSecrets will be automatically synced from Key Vault to pods${NC}"
echo ""

# Step 6: Wait for deployment
echo -e "${YELLOW}[6/6] Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/$APP_NAME --namespace=$NAMESPACE --timeout=5m

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Show deployment status
echo "Pods:"
kubectl get pods -l app=$APP_NAME --namespace=$NAMESPACE
echo ""

echo "Service:"
kubectl get service sms-app-service --namespace=$NAMESPACE
echo ""

echo -e "${YELLOW}Getting external IP (this may take a few minutes)...${NC}"
echo "Run this command to watch for the external IP:"
echo "kubectl get service sms-app-service --namespace=$NAMESPACE -w"
echo ""

# Try to get external IP
EXTERNAL_IP=""
for i in {1..30}; do
  EXTERNAL_IP=$(kubectl get service sms-app-service --namespace=$NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
  if [ ! -z "$EXTERNAL_IP" ]; then
    break
  fi
  echo "Waiting for external IP... ($i/30)"
  sleep 10
done

if [ ! -z "$EXTERNAL_IP" ]; then
  echo -e "${GREEN}✓ External IP assigned: $EXTERNAL_IP${NC}"
  echo ""
  echo "Access your application at:"
  echo -e "${GREEN}http://$EXTERNAL_IP/${NC}"
  echo -e "${GREEN}http://$EXTERNAL_IP/api/health${NC}"
else
  echo -e "${YELLOW}⚠ External IP not yet assigned. Run the watch command above to monitor.${NC}"
fi

echo ""
echo "Useful commands:"
echo "- View logs: kubectl logs -l app=$APP_NAME --tail=100 -f"
echo "- Check pods: kubectl get pods -l app=$APP_NAME"
echo "- Describe deployment: kubectl describe deployment $APP_NAME"
echo "- Delete deployment: kubectl delete -f kubernetes/dev/"
