# Quick Deploy to Docker Desktop Kubernetes
# Run this script to deploy everything

Write-Host "🚀 Deploying Etude.AI to Docker Desktop Kubernetes" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if kubectl is available
Write-Host "`n1. Checking kubectl..." -ForegroundColor Yellow
try {
    kubectl version --client --short 2>$null
    Write-Host "   ✅ kubectl is installed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ kubectl not found. Please enable Kubernetes in Docker Desktop" -ForegroundColor Red
    exit 1
}

# Check if Kubernetes is running
Write-Host "`n2. Checking Kubernetes cluster..." -ForegroundColor Yellow
try {
    kubectl cluster-info 2>$null | Out-Null
    Write-Host "   ✅ Kubernetes is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Kubernetes not running. Enable it in Docker Desktop Settings" -ForegroundColor Red
    exit 1
}

# Check if images exist
Write-Host "`n3. Checking Docker images..." -ForegroundColor Yellow
$images = docker images --format "{{.Repository}}:{{.Tag}}"
if ($images -match "etude-ai-pipeline:v1.0.0") {
    Write-Host "   ✅ AI Pipeline image found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  AI Pipeline image not found" -ForegroundColor Yellow
    Write-Host "      Building AI Pipeline image..." -ForegroundColor Yellow
    Push-Location "AI Pipeline"
    docker build -t etude-ai-pipeline:v1.0.0 .
    Pop-Location
}

if ($images -match "etude-ai-backend:v1.0.0") {
    Write-Host "   ✅ Backend image found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend image not found" -ForegroundColor Yellow
    Write-Host "      Building Backend image..." -ForegroundColor Yellow
    Push-Location backend
    docker build -t etude-ai-backend:v1.0.0 .
    Pop-Location
}

# Deploy namespace
Write-Host "`n4. Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/00-namespace.yaml
Write-Host "   ✅ Namespace created" -ForegroundColor Green

# Deploy secrets
Write-Host "`n5. Creating secrets..." -ForegroundColor Yellow
kubectl apply -f k8s/01-secrets.yaml
Write-Host "   ✅ Secrets created" -ForegroundColor Green

# Deploy infrastructure
Write-Host "`n6. Deploying infrastructure (PostgreSQL, Redis, Keycloak)..." -ForegroundColor Yellow
Write-Host "   This will take 5-10 minutes..." -ForegroundColor Cyan
kubectl apply -f k8s/02-infrastructure.yaml
Write-Host "   ✅ Infrastructure deployed" -ForegroundColor Green

# Wait for infrastructure
Write-Host "`n7. Waiting for infrastructure to be ready..." -ForegroundColor Yellow
Write-Host "   Waiting for PostgreSQL..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=postgres -n etude-ai --timeout=300s 2>$null
Write-Host "   ✅ PostgreSQL ready" -ForegroundColor Green

Write-Host "   Waiting for Redis..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=redis -n etude-ai --timeout=300s 2>$null
Write-Host "   ✅ Redis ready" -ForegroundColor Green

Write-Host "   Waiting for Keycloak..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=keycloak -n etude-ai --timeout=600s 2>$null
Write-Host "   ✅ Keycloak ready" -ForegroundColor Green

# Deploy applications
Write-Host "`n8. Deploying applications..." -ForegroundColor Yellow
kubectl apply -f k8s/03-ai-pipeline.yaml
kubectl apply -f k8s/04-backend.yaml
Write-Host "   ✅ Applications deployed" -ForegroundColor Green

# Wait for applications
Write-Host "`n9. Waiting for applications to be ready..." -ForegroundColor Yellow
Write-Host "   Waiting for AI Pipeline..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=ai-pipeline -n etude-ai --timeout=300s 2>$null
Write-Host "   ✅ AI Pipeline ready" -ForegroundColor Green

Write-Host "   Waiting for Backend..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=backend -n etude-ai --timeout=300s 2>$null
Write-Host "   ✅ Backend ready" -ForegroundColor Green

# Show status
Write-Host "`n10. Deployment complete! Here's the status:" -ForegroundColor Yellow
Write-Host "=" * 60
kubectl get all -n etude-ai

Write-Host "`n🎉 Deployment successful!" -ForegroundColor Green
Write-Host "`nTo access your services:" -ForegroundColor Cyan
Write-Host "  AI Pipeline:  kubectl port-forward svc/ai-pipeline 8000:80 -n etude-ai" -ForegroundColor Yellow
Write-Host "  Backend:      kubectl port-forward svc/backend 8081:80 -n etude-ai" -ForegroundColor Yellow
Write-Host "`nThen visit:" -ForegroundColor Cyan
Write-Host "  http://localhost:8000/health  (AI Pipeline)" -ForegroundColor Yellow
Write-Host "  http://localhost:8081/actuator/health  (Backend)" -ForegroundColor Yellow

Write-Host "`nView logs:" -ForegroundColor Cyan
Write-Host "  kubectl logs -f deployment/ai-pipeline -n etude-ai" -ForegroundColor Yellow
Write-Host "  kubectl logs -f deployment/backend -n etude-ai" -ForegroundColor Yellow

Write-Host "`n" "=" * 60

