# 🚀 Quick Start: Deploy Etude.AI to Kubernetes

**For:** Windows Development Environment  
**Time Required:** 30 minutes  
**Difficulty:** Intermediate

---

## Option 1: Local Kubernetes (Recommended for Testing)

### Install Minikube

```powershell
# Install via Chocolatey (run as Administrator)
choco install minikube kubernetes-cli

# Or download installer from: https://minikube.sigs.k8s.io/docs/start/

# Verify installation
minikube version
kubectl version --client
```

### Start Minikube

```powershell
# Start with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=50g

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### Build Docker Images

```powershell
# Set minikube's docker environment
minikube docker-env | Invoke-Expression

# Build AI Pipeline
cd "D:\Work\Etude.Ai\Etude.AI\AI Pipeline"
docker build -t etude-ai-pipeline:v1.0.0 .

# Build Backend
cd "D:\Work\Etude.Ai\Etude.AI\backend"
docker build -t etude-ai-backend:v1.0.0 .

# Verify images
docker images | Select-String "etude"
```

### Kubernetes Manifests (Already Configured)

✅ **Good news!** The manifests are already configured for local development:
- Image references updated to use local images
- `imagePullPolicy: IfNotPresent` already set
- All secrets synced with your `.env` file

**No manual updates needed!** Skip to deployment.

### Deploy to Minikube

```powershell
cd "D:\Work\Etude.Ai\Etude.AI"

# 1. Create namespace
kubectl apply -f k8s/00-namespace.yaml

# 2. Create secrets
kubectl apply -f k8s/01-secrets.yaml

# 3. Deploy infrastructure (this will take a few minutes)
kubectl apply -f k8s/02-infrastructure.yaml

# Wait for infrastructure to be ready (this may take 5-10 minutes)
kubectl wait --for=condition=ready pod -l tier=infrastructure -n etude-ai --timeout=600s

# Check status
kubectl get pods -n etude-ai

# 4. Deploy applications
kubectl apply -f k8s/03-ai-pipeline.yaml
kubectl apply -f k8s/04-backend.yaml

# Wait for apps to be ready
kubectl wait --for=condition=ready pod -l tier=application -n etude-ai --timeout=300s

# 5. Deploy monitoring (optional)
kubectl apply -f k8s/05-monitoring.yaml

# Check everything is running
kubectl get all -n etude-ai
```

### Access Your Services

```powershell
# Option A: Port Forward
kubectl port-forward svc/ai-pipeline 8000:80 -n etude-ai
# Access at: http://localhost:8000

# Option B: Minikube Service (opens in browser)
minikube service ai-pipeline -n etude-ai
minikube service backend -n etude-ai

# Option C: Get Minikube IP and NodePort
minikube ip
kubectl get svc -n etude-ai
# Access at: http://<minikube-ip>:<nodeport>
```

### Test Deployment

```powershell
# Get AI Pipeline URL
$AI_URL = "http://localhost:8000"  # Or minikube service URL

# Test health
Invoke-WebRequest -Uri "$AI_URL/health" -UseBasicParsing

# Test liveness
Invoke-WebRequest -Uri "$AI_URL/liveness" -UseBasicParsing

# Test readiness
Invoke-WebRequest -Uri "$AI_URL/readiness" -UseBasicParsing

# If all return 200, you're good!
```

---

## Option 2: Docker Desktop Kubernetes (Easier Setup)

### Enable Kubernetes in Docker Desktop

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"
5. Wait for Kubernetes to start (green indicator)

### Deploy

✅ **Note:** Images and secrets are already configured!

```powershell
cd "D:\Work\Etude.Ai\Etude.AI"

# Build images (Docker Desktop)
cd "AI Pipeline"
docker build -t etude-ai-pipeline:v1.0.0 .

cd ../backend
docker build -t etude-ai-backend:v1.0.0 .

# Deploy (go back to root)
cd ..
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-infrastructure.yaml

# Wait for infrastructure (5-10 minutes)
kubectl wait --for=condition=ready pod -l app=postgres -n etude-ai --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n etude-ai --timeout=300s

# Deploy applications
kubectl apply -f k8s/03-ai-pipeline.yaml
kubectl apply -f k8s/04-backend.yaml

# Access
kubectl port-forward svc/ai-pipeline 8000:80 -n etude-ai
```

---

## Option 3: Cloud Deployment (Production)

### Google Kubernetes Engine (GKE)

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Create cluster
gcloud container clusters create etude-ai-cluster \
  --num-nodes=3 \
  --machine-type=e2-standard-4 \
  --zone=us-central1-a \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=10

# Get credentials
gcloud container clusters get-credentials etude-ai-cluster --zone=us-central1-a

# Push images to GCR
docker tag etude-ai-pipeline:v1.0.0 gcr.io/YOUR-PROJECT-ID/etude-ai-pipeline:v1.0.0
docker tag etude-ai-backend:v1.0.0 gcr.io/YOUR-PROJECT-ID/etude-ai-backend:v1.0.0

docker push gcr.io/YOUR-PROJECT-ID/etude-ai-pipeline:v1.0.0
docker push gcr.io/YOUR-PROJECT-ID/etude-ai-backend:v1.0.0

# Update k8s manifests with GCR image paths
# Then deploy same as above
```

---

## Troubleshooting

### Pods Not Starting

```powershell
# Check pod status
kubectl get pods -n etude-ai

# Describe pod to see errors
kubectl describe pod <pod-name> -n etude-ai

# Check logs
kubectl logs <pod-name> -n etude-ai

# Check events
kubectl get events -n etude-ai --sort-by='.lastTimestamp'
```

### ImagePullBackOff Error

```powershell
# This means Kubernetes can't find the image

# For Minikube: Make sure you built images in minikube's docker
minikube docker-env | Invoke-Expression
docker images  # Should see your images

# For Docker Desktop: Images should be in local docker
docker images

# Verify imagePullPolicy is set (already configured in manifests)
# The manifests already have: imagePullPolicy: IfNotPresent
```

### Pending PersistentVolumeClaims

```powershell
# Check PVCs
kubectl get pvc -n etude-ai

# If Pending, you may need to install a storage provisioner
# For Minikube, this should work automatically

# For cloud, ensure storage class exists
kubectl get storageclass
```

### Service Not Accessible

```powershell
# Check service
kubectl get svc -n etude-ai

# Check endpoints
kubectl get endpoints -n etude-ai

# If no endpoints, pods aren't ready
kubectl get pods -n etude-ai
```

---

## Useful Commands

```powershell
# View everything in namespace
kubectl get all -n etude-ai

# Delete everything and start over
kubectl delete namespace etude-ai
# Then re-run all kubectl apply commands

# Shell into a pod
kubectl exec -it <pod-name> -n etude-ai -- /bin/sh

# View logs in real-time
kubectl logs -f <pod-name> -n etude-ai

# Scale deployment
kubectl scale deployment ai-pipeline --replicas=3 -n etude-ai

# Check resource usage
kubectl top pods -n etude-ai
kubectl top nodes

# Open Kubernetes dashboard (if enabled)
minikube dashboard
```

---

## Next Steps After Deployment

1. ✅ **Test all endpoints** - Health, API calls
2. ✅ **Check logs** - Ensure no errors
3. ✅ **Monitor metrics** - Prometheus/Grafana
4. ✅ **Test auto-scaling** - Generate load
5. ✅ **Set up ingress** - For external access
6. ✅ **Configure DNS** - Point domain to cluster
7. ✅ **Enable SSL/TLS** - Use cert-manager

---

## Estimated Costs

### Minikube (Local)
- **Cost:** $0 (Free)
- **Use case:** Development, testing

### Docker Desktop (Local)
- **Cost:** $0 (Free for personal use)
- **Use case:** Development, small testing

### GKE (Cloud)
- **Cost:** ~$200-400/month for 3-node cluster
- **Use case:** Production

### EKS (AWS) / AKS (Azure)
- **Cost:** Similar to GKE
- **Use case:** Production

---

## Support

If you encounter issues:

1. Check pod logs: `kubectl logs <pod-name> -n etude-ai`
2. Check events: `kubectl get events -n etude-ai`
3. Describe resource: `kubectl describe <resource> <name> -n etude-ai`
4. Review documentation: `cat k8s/README.md`

---

**Created:** December 14, 2025  
**Ready to deploy!** Follow the steps for your chosen option.

