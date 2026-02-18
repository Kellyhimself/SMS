# Docker Guide - School Management System

This guide covers building, testing, and deploying the SMS application using Docker.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Building the Docker Image](#building-the-docker-image)
3. [Testing Locally](#testing-locally)
4. [Pushing to Azure Container Registry](#pushing-to-azure-container-registry)
5. [Docker Image Best Practices](#docker-image-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Azure CLI
- Access to Azure Container Registry: `smscentraldev.azurecr.io`

### Environment Variables
Create a `.env.local` file with your Azure PostgreSQL credentials:
```bash
cp .env.azure.example .env.local
# Edit .env.local with your actual credentials
```

---

## Building the Docker Image

### 1. Build Locally for Testing

```bash
# Navigate to project root
cd c:\Kelly\SMS

# Build the image
docker build -t sms-app:latest .

# View the built image
docker images sms-app
```

### 2. Build with Tag for ACR

```bash
# Build and tag for Azure Container Registry
docker build -t smscentraldev.azurecr.io/sms-app:latest .

# Build with version tag (recommended for production)
docker build -t smscentraldev.azurecr.io/sms-app:v1.0.0 .

# Build with git commit SHA (best for traceability)
docker build -t smscentraldev.azurecr.io/sms-app:$(git rev-parse --short HEAD) .
```

### 3. Multi-Platform Build (Optional)

For deployment on different architectures (ARM, AMD64):

```bash
# Create a new builder
docker buildx create --name multiplatform --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t smscentraldev.azurecr.io/sms-app:latest \
  --push \
  .
```

---

## Testing Locally

### Option 1: Using Docker Run

```bash
# Run the container
docker run -d \
  --name sms-app \
  --env-file .env.local \
  -p 3000:3000 \
  sms-app:latest

# View logs
docker logs -f sms-app

# Test health endpoint
curl http://localhost:3000/api/health

# Access the app
# Open http://localhost:3000 in your browser

# Stop and remove
docker stop sms-app
docker rm sms-app
```

### Option 2: Using Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Verify Health Check

```bash
# Check container health
docker inspect sms-app | grep Health -A 10

# Manual health check
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "message": "All systems operational",
#   "database": "connected",
#   "responseTime": 45,
#   "timestamp": "2026-02-02T12:00:00.000Z"
# }
```

---

## Pushing to Azure Container Registry

### 1. Login to ACR

```bash
# Option 1: Using Azure CLI (recommended)
az acr login --name smscentraldev

# Option 2: Using Docker login with admin credentials
docker login smscentraldev.azurecr.io

# Verify login
az acr repository list --name smscentraldev -o table
```

### 2. Push Image to ACR

```bash
# Push latest tag
docker push smscentraldev.azurecr.io/sms-app:latest

# Push version tag
docker push smscentraldev.azurecr.io/sms-app:v1.0.0

# Push git commit tag
docker push smscentraldev.azurecr.io/sms-app:$(git rev-parse --short HEAD)
```

### 3. Verify Image in ACR

```bash
# List repositories
az acr repository list --name smscentraldev -o table

# List tags for sms-app
az acr repository show-tags \
  --name smscentraldev \
  --repository sms-app \
  -o table

# Show image details
az acr repository show \
  --name smscentraldev \
  --image sms-app:latest
```

### 4. Scan Image for Vulnerabilities (Optional)

```bash
# Enable Microsoft Defender for Containers (one-time setup)
az security atp storage update \
  --resource-group rg-sms-dev \
  --is-enabled true

# Trigger manual scan
az acr task run \
  --name image-scan \
  --registry smscentraldev \
  --image sms-app:latest
```

---

## Docker Image Best Practices

### ✅ What We're Doing Right

1. **Multi-Stage Build**
   - Separate stages for dependencies, building, and runtime
   - Final image only contains production files
   - Reduces image size from ~1GB to ~150MB

2. **Alpine Linux Base**
   - Minimal attack surface
   - Smaller image size
   - Faster downloads and deployments

3. **Non-Root User**
   - Application runs as user `nextjs` (UID 1001)
   - Enhanced security (principle of least privilege)
   - Prevents container breakout attacks

4. **Health Check**
   - Docker/Kubernetes can detect unhealthy containers
   - Automatic restarts on failure
   - Tests database connectivity

5. **Standalone Output**
   - Next.js standalone mode includes only necessary files
   - No build-time dependencies in production
   - Faster startup times

6. **Layer Caching**
   - Dependencies installed before copying source code
   - Rebuilds only changed layers
   - Faster subsequent builds

### 🔐 Security Considerations

1. **No Secrets in Image**
   - Environment variables passed at runtime
   - Use Azure Key Vault for secrets
   - Never commit `.env.local` to git

2. **Immutable Tags**
   - Don't rely on `:latest` in production
   - Use semantic versioning or git SHAs
   - Enables easy rollbacks

3. **Regular Updates**
   - Update base image regularly
   - Scan for vulnerabilities
   - Apply security patches

---

## Troubleshooting

### Build Fails

**Issue: `npm ci` fails**
```bash
# Solution: Clear Docker build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t sms-app:latest .
```

**Issue: Out of disk space**
```bash
# Clean up unused images
docker image prune -a

# Clean up everything (caution!)
docker system prune -a --volumes
```

### Container Exits Immediately

**Issue: Container stops right after starting**
```bash
# Check logs
docker logs sms-app

# Common causes:
# 1. Missing environment variables
# 2. Database connection failure
# 3. Port already in use

# Run with interactive terminal to debug
docker run -it --env-file .env.local sms-app:latest sh
```

### Health Check Fails

**Issue: Health check returns unhealthy**
```bash
# Check health endpoint manually
docker exec sms-app curl http://localhost:3000/api/health

# Check database connectivity
docker exec sms-app node -e "console.log(process.env.AZURE_POSTGRES_HOST)"

# View detailed health status
docker inspect sms-app | grep Health -A 20
```

### Cannot Connect to Container

**Issue: App not accessible on http://localhost:3000**
```bash
# Check if port is mapped correctly
docker ps

# Check if container is running
docker logs sms-app

# Check if port 3000 is already in use
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000
```

### Image Size Too Large

**Issue: Docker image is larger than expected**
```bash
# Analyze image layers
docker history sms-app:latest

# Identify large layers
docker history sms-app:latest --human --format "table {{.Size}}\t{{.CreatedBy}}"

# Common causes:
# 1. Not using .dockerignore
# 2. Copying node_modules
# 3. Including development dependencies
```

---

## Next Steps

After successfully building and pushing your image:

1. ✅ Create Kubernetes deployment manifests
2. ✅ Deploy to AKS cluster
3. ✅ Set up CI/CD pipeline
4. ✅ Configure monitoring and logging

See [KUBERNETES-GUIDE.md](./KUBERNETES-GUIDE.md) for deployment instructions.

---

## Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
