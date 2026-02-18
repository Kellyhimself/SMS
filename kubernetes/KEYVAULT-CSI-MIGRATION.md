# Azure Key Vault CSI Driver Migration

This document explains the migration from Kubernetes Secrets to Azure Key Vault with CSI Driver.

## What Changed

### Before (kubectl secrets)
```yaml
# Secrets stored in Kubernetes etcd
apiVersion: v1
kind: Secret
metadata:
  name: sms-app-secrets
stringData:
  AZURE_POSTGRES_PASSWORD: "password123"
  RESEND_API_KEY: "key456"
```

### After (Key Vault CSI Driver)
```yaml
# Secrets stored in Azure Key Vault
# Referenced via SecretProviderClass
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-sms-app
spec:
  provider: azure
  parameters:
    keyvaultName: "kv-sms-dev-8f2a"
    objects: |
      array:
        - objectName: AZURE-POSTGRES-PASSWORD
          objectAlias: AZURE_POSTGRES_PASSWORD
```

## Cost Comparison

| Approach | Monthly Cost | Features |
|----------|--------------|----------|
| **kubectl secrets** | $0.00 | Basic secret storage in etcd |
| **Key Vault CSI** | **~$0.10** | Centralized management, audit logs, rotation support |

**Cost breakdown:**
- Key Vault base: Free (already deployed)
- Secret operations: $0.03 per 10,000 operations
- Estimated operations: ~100 pod starts/month = $0.00
- Total: Negligible (~$0.10/month)

## Benefits

✅ **Centralized Management** - All secrets in one place
✅ **Audit Logging** - Track who accessed what and when
✅ **Automatic Rotation** - Support for secret rotation
✅ **No Secrets in Git** - Never commit secrets to version control
✅ **Compliance Ready** - SOC 2, HIPAA, ISO 27001 compliant
✅ **RBAC Integration** - Fine-grained access control
✅ **Disaster Recovery** - Azure handles backups

## Files Modified

### Terraform Changes
1. **modules/keyvault/variables.tf** - Added `app_secrets` variable
2. **modules/keyvault/main.tf** - Added `app_secrets` resource
3. **environments/dev/variables.tf** - Added `resend_api_key` variable
4. **environments/dev/main.tf** - Updated Key Vault module to store app secrets

### Kubernetes Changes
1. **kubernetes/dev/secretproviderclass.yaml** - NEW: Maps Key Vault to K8s
2. **kubernetes/dev/deployment.yaml** - Added CSI volume mount
3. **kubernetes/dev/kustomization.yaml** - Replaced secret.yaml with secretproviderclass.yaml
4. **kubernetes/dev/deploy.ps1** - Updated to apply SecretProviderClass

### Removed
- ~~kubernetes/dev/secret.yaml~~ - No longer needed (secrets in Key Vault)

## Deployment Steps

### Step 1: Store Secrets in Key Vault via Terraform

```powershell
# Navigate to terraform directory
cd C:\Kelly\SMS\infrastructure\terraform\environments\dev

# (Optional) Set Resend API key if you have one
# $env:TF_VAR_resend_api_key = "your-actual-key-here"

# Apply Terraform to store secrets in Key Vault
terraform apply

# Verify secrets were created
az keyvault secret list --vault-name kv-sms-dev-8f2a -o table
```

Expected output:
```
Name                      Enabled
----------------------   ---------
AZURE-POSTGRES-HOST      True
AZURE-POSTGRES-DATABASE  True
AZURE-POSTGRES-USER      True
AZURE-POSTGRES-PASSWORD  True
RESEND-API-KEY           True
```

### Step 2: Deploy Application with CSI Driver

```powershell
# Navigate to kubernetes directory
cd C:\Kelly\SMS\kubernetes\dev

# Run deployment script
.\deploy.ps1
```

The script will:
1. Connect to AKS
2. Create ACR image pull secret
3. Apply SecretProviderClass (connects to Key Vault)
4. Deploy application (mounts secrets from Key Vault)
5. Create LoadBalancer service

### Step 3: Verify Secrets Are Mounted

```powershell
# Get pod name
$POD_NAME = kubectl get pods -l app=sms-app -o jsonpath='{.items[0].metadata.name}'

# Check if secrets are mounted
kubectl exec $POD_NAME -- ls -la /mnt/secrets-store

# View secret value (for debugging)
kubectl exec $POD_NAME -- cat /mnt/secrets-store/AZURE_POSTGRES_PASSWORD

# Check environment variables
kubectl exec $POD_NAME -- env | grep AZURE_POSTGRES
```

Expected output:
```
AZURE_POSTGRES_HOST=psql-sms-dev-sci1tp18.postgres.database.azure.com
AZURE_POSTGRES_DATABASE=smsdb
AZURE_POSTGRES_USER=psqladmin
AZURE_POSTGRES_PASSWORD=MySchool@Azure2026
```

## How It Works

1. **Terraform** stores secrets in Azure Key Vault
2. **AKS Managed Identity** has permission to read from Key Vault
3. **SecretProviderClass** defines which secrets to retrieve
4. **CSI Driver** mounts secrets as files in `/mnt/secrets-store`
5. **Kubernetes** syncs these to a Kubernetes Secret (optional)
6. **Deployment** references the synced Kubernetes Secret via `envFrom`

```
┌──────────────┐
│ Azure Key    │
│ Vault        │◄────────┐
└──────────────┘         │
                         │ (Read via Managed Identity)
                         │
┌──────────────┐    ┌────┴─────┐    ┌──────────────┐
│ Terraform    │───►│ Secrets  │◄───│ CSI Driver   │
│ (Store)      │    │          │    │              │
└──────────────┘    └──────────┘    └──────┬───────┘
                                            │
                                            │ (Mount)
                                            │
                                    ┌───────▼───────┐
                                    │ Pod           │
                                    │ /mnt/secrets  │
                                    └───────────────┘
```

## Troubleshooting

### Issue: Secrets not appearing in pod

**Check CSI driver is installed:**
```powershell
kubectl get pods -n kube-system | Select-String "csi"
```

Expected: `secrets-store-csi-driver-*` pods running

**Check SecretProviderClass:**
```powershell
kubectl get secretproviderclass
kubectl describe secretproviderclass azure-keyvault-sms-app
```

### Issue: Permission denied accessing Key Vault

**Check AKS identity has access:**
```powershell
$KUBELET_ID = az aks show -g rg-sms-dev -n aks-sms-dev --query identityProfile.kubeletidentity.objectId -o tsv
az keyvault show -n kv-sms-dev-8f2a --query properties.accessPolicies
```

### Issue: Pod fails to start with CSI error

**Check pod events:**
```powershell
kubectl describe pod -l app=sms-app
```

**Check CSI driver logs:**
```powershell
kubectl logs -n kube-system -l app=secrets-store-csi-driver
```

## Security Best Practices

### ✅ Do
- Store all secrets in Key Vault
- Use managed identities (no passwords)
- Enable Key Vault audit logging
- Rotate secrets regularly
- Use separate Key Vaults per environment

### ❌ Don't
- Commit secrets to Git (including terraform.tfvars)
- Use admin passwords (use managed identities)
- Share Key Vaults between environments
- Grant overly broad permissions
- Log secret values

## Adding New Secrets

To add a new secret:

1. **Add to Terraform variables** (environments/dev/variables.tf):
```hcl
variable "twilio_auth_token" {
  description = "Twilio authentication token"
  type        = string
  sensitive   = true
}
```

2. **Add to Key Vault module** (environments/dev/main.tf):
```hcl
module "keyvault" {
  app_secrets = {
    # ... existing secrets ...
    TWILIO-AUTH-TOKEN = var.twilio_auth_token
  }
}
```

3. **Add to SecretProviderClass** (kubernetes/dev/secretproviderclass.yaml):
```yaml
objects: |
  array:
    # ... existing objects ...
    - |
      objectName: TWILIO-AUTH-TOKEN
      objectType: secret
      objectAlias: TWILIO_AUTH_TOKEN
```

4. **Apply changes:**
```powershell
terraform apply
kubectl apply -f kubernetes/dev/secretproviderclass.yaml
kubectl rollout restart deployment/sms-app
```

## Cost Monitoring

Monitor Key Vault costs in Azure Portal:
```powershell
# View Key Vault metrics
az monitor metrics list `
  --resource $(az keyvault show -n kv-sms-dev-8f2a --query id -o tsv) `
  --metric "ServiceApiHit" `
  --start-time 2026-02-01 --end-time 2026-02-02
```

## Rollback (if needed)

To rollback to kubectl secrets:

1. **Revert Kubernetes manifests:**
```powershell
git checkout HEAD^ -- kubernetes/dev/
kubectl apply -f kubernetes/dev/secret.yaml
kubectl apply -f kubernetes/dev/deployment.yaml
```

2. **Revert Terraform:**
```powershell
cd infrastructure/terraform/environments/dev
git checkout HEAD^ -- .
terraform apply
```

## Next Steps

- [ ] Enable Key Vault soft delete and purge protection (production)
- [ ] Set up secret rotation policies
- [ ] Configure audit log alerts
- [ ] Integrate with Azure Monitor
- [ ] Add secrets for other services (Twilio, WhatsApp, etc.)

## References

- [Azure Key Vault Provider for Secrets Store CSI Driver](https://azure.github.io/secrets-store-csi-driver-provider-azure/)
- [AKS Key Vault Integration](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)
- [Azure Key Vault Best Practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)
