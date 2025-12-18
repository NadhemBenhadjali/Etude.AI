# Kubernetes Deployment Guide for Etude.AI
**Next:** Create Kubernetes manifest files
**Status:** Ready for deployment  
**Created:** December 14, 2025  

---

- [Production Best Practices](https://learnk8s.io/production-best-practices)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## 🔗 Additional Resources

---

```
kubectl top nodes
# Top nodes

kubectl top pods -n etude-ai
# Top pods (resource usage)

kubectl port-forward <pod-name> <local-port>:<pod-port> -n etude-ai
# Port forward

kubectl exec -it <pod-name> -n etude-ai -- <command>
# Execute command in pod

kubectl logs -f <pod-name> -n etude-ai
# Get pod logs in real-time

kubectl get pods -n etude-ai -w
# Watch pods

kubectl apply -f k8s/ -n etude-ai
# Apply all manifests in directory

kubectl delete namespace etude-ai
# Delete everything

kubectl describe <resource-type> <resource-name> -n etude-ai
# Describe resource

kubectl get all -n etude-ai
# Get everything in namespace
```bash

## 📚 Useful Commands Cheat Sheet

---

7. **Disaster Recovery** - Test backup/restore procedures
6. **Performance Testing** - Load test your cluster
5. **Implement CI/CD** - Automate deployments
4. **Set up Alerts** - Configure AlertManager
3. **Configure Monitoring** - Set up Grafana dashboards
2. **Set up SSL/TLS** - Use cert-manager for Let's Encrypt certificates
1. **Configure DNS** - Point your domain to ingress

After basic deployment:

## 🎯 Next Steps

---

```
  --max-nodes=10
  --min-nodes=2 \
  --enable-autoscaling \
gcloud container clusters update etude-ai-cluster \
# Enable cluster autoscaler (GKE example)
```bash
### 3. Cluster Autoscaler

- Use VPA to right-size automatically
- Set accurate resource requests to avoid over-provisioning
### 2. Resource Requests

- Use spot/preemptible instances for non-critical workloads
- Separate workloads by resource requirements
### 1. Use Node Pools

## 📈 Cost Optimization

---

```
kubectl apply -k k8s/overlays/prod
# Deploy to production
```bash

```
│   └── prod/      # Production overrides
│   ├── staging/   # Staging overrides
│   ├── dev/       # Development overrides
├── overlays/
├── base/           # Base configuration
k8s/
```

### Use Kustomize for Environment-Specific Config

```
kubectl apply -f k8s/ -n etude-ai-prod
kubectl create namespace etude-ai-prod
# Production

kubectl apply -f k8s/ -n etude-ai-staging
kubectl create namespace etude-ai-staging
# Staging

kubectl apply -f k8s/ -n etude-ai-dev
kubectl create namespace etude-ai-dev
# Development
```bash

### Namespaces per Environment

## 🌍 Multi-Environment Setup

---

```
  psql -U postgres etude_ai < backup.sql
kubectl exec -i deployment/postgres -n etude-ai -- \
# Restore PostgreSQL

  neo4j-admin load --from=/backups/neo4j-backup.dump
kubectl exec -it deployment/neo4j -n etude-ai -- \
kubectl cp ./backups/neo4j-backup.dump etude-ai/neo4j-pod:/backups/
# Restore Neo4j
```bash

### Restore

```
kubectl cp etude-ai/neo4j-pod:/backups/neo4j-backup.dump ./backups/
# Copy backup from pod

  pg_dump -U postgres etude_ai > backup.sql
kubectl exec -it deployment/postgres -n etude-ai -- \
# Backup PostgreSQL

  neo4j-admin dump --to=/backups/neo4j-backup.dump
kubectl exec -it deployment/neo4j -n etude-ai -- \
# Backup Neo4j
```bash

### Backup

## 💾 Backup & Recovery

---

```
kubectl apply -f k8s/vpa.yaml
# Create VPA

kubectl apply -f https://github.com/kubernetes/autoscaler/releases/download/vertical-pod-autoscaler-0.13.0/vpa-v0.13.0.yaml
# Install VPA (if not installed)
```bash

### Vertical Pod Autoscaler (VPA)

```
kubectl get hpa -n etude-ai
# Check HPA status

  -n etude-ai
  --max=10 \
  --min=2 \
  --cpu-percent=70 \
kubectl autoscale deployment backend \
# Create HPA for Backend

  -n etude-ai
  --max=10 \
  --min=2 \
  --cpu-percent=70 \
kubectl autoscale deployment ai-pipeline \
# Create HPA for AI Pipeline
```bash

### Horizontal Pod Autoscaler (HPA)

## 📊 Auto-Scaling

---

```
# Don't use default service account for applications
# Use service accounts with minimal permissions
```bash
### 4. RBAC

```
    cpu: "2000m"
    memory: "2Gi"
  limits:
    cpu: "500m"
    memory: "512Mi"
  requests:
resources:
# Always set resource requests and limits
```yaml
### 3. Resource Limits

```
kubectl apply -f k8s/network-policies.yaml
# Apply network policies to restrict traffic
```bash
### 2. Network Policies

```
kubectl create secret generic my-secret --from-literal=key=value
# Always use Kubernetes secrets
# Never hardcode passwords in YAML files
```bash
### 1. Use Secrets for Sensitive Data

## 🔐 Security Best Practices

---

```
kubectl exec -it deployment/ai-pipeline -n etude-ai -- nc -zv neo4j 7687
# Test connection from app pod

kubectl logs -l app=redis -n etude-ai
kubectl logs -l app=postgres -n etude-ai
kubectl logs -l app=neo4j -n etude-ai
# Check database logs

kubectl get pods -l tier=infrastructure -n etude-ai
# Check if database pods are running
```bash

### Database Connection Issues

```
  -- curl http://ai-pipeline/health
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n etude-ai \
# Test from another pod

kubectl get endpoints -n etude-ai
# Check endpoints

kubectl get svc -n etude-ai
# Check service
```bash

### Service Not Accessible

```
kubectl exec -it <pod-name> -n etude-ai -- /bin/sh
# Interactive shell into pod

kubectl logs <pod-name> -n etude-ai --previous
# Check previous logs (if pod restarted)

kubectl logs <pod-name> -n etude-ai
# Check logs

kubectl describe pod <pod-name> -n etude-ai
# Describe pod to see events
```bash

### Pod Not Starting

## 🐛 Troubleshooting

---

```
kubectl rollout restart deployment/backend -n etude-ai
# Restart Backend

kubectl rollout restart deployment/ai-pipeline -n etude-ai
# Restart AI Pipeline
```bash

### Restart Deployments

```
kubectl rollout history deployment/ai-pipeline -n etude-ai
# View rollout history

kubectl rollout undo deployment/ai-pipeline --to-revision=2 -n etude-ai
# Rollback to specific revision

kubectl rollout undo deployment/ai-pipeline -n etude-ai
# Rollback AI Pipeline
```bash

### Rollback Deployments

```
kubectl rollout status deployment/backend -n etude-ai
kubectl rollout status deployment/ai-pipeline -n etude-ai
# Check rollout status

  -n etude-ai
  backend=your-registry/etude-ai-backend:v1.1.0 \
kubectl set image deployment/backend \
# Update Backend image

  -n etude-ai
  ai-pipeline=your-registry/etude-ai-pipeline:v1.1.0 \
kubectl set image deployment/ai-pipeline \
# Update AI Pipeline image
```bash

### Update Deployments

```
kubectl get deployments -n etude-ai
# Check status

kubectl scale deployment backend --replicas=3 -n etude-ai
# Scale Backend

kubectl scale deployment ai-pipeline --replicas=3 -n etude-ai
# Scale AI Pipeline
```bash

### Scale Deployments

## 🔧 Common Operations

---

```
# Login: admin / admin (change on first login)

kubectl port-forward svc/grafana 3000:80 -n etude-ai
# Access Grafana

kubectl apply -f k8s/05-monitoring.yaml
# Deploy Prometheus and Grafana
```bash

### Deploy Monitoring Stack

```
kubectl logs --tail=100 deployment/ai-pipeline -n etude-ai
# Last 100 lines

kubectl logs -f -l tier=application -n etude-ai
# All pods with label

kubectl logs -f deployment/backend -n etude-ai
# Backend logs

kubectl logs -f deployment/ai-pipeline -n etude-ai
# AI Pipeline logs
```bash

### View Logs

```
kubectl get events -n etude-ai --sort-by='.lastTimestamp'
# Check events

kubectl get pods -n etude-ai
# Check all pods

kubectl exec -it deployment/backend -n etude-ai -- curl localhost:8080/actuator/health
kubectl exec -it deployment/ai-pipeline -n etude-ai -- curl localhost:8000/health
# Health checks
```bash

### Check Health

## 🔍 Monitoring & Observability

---

```
# https://api.yourdomain.com - Backend
# https://ai.yourdomain.com - AI Pipeline
# Access at:

kubectl get ingress -n etude-ai
# Get ingress address

kubectl apply -f k8s/06-ingress.yaml
# Deploy ingress
```bash
#### Option C: Ingress (Production)

```
# Access using the EXTERNAL-IP shown

kubectl get svc -n etude-ai
# Get external IPs
```bash
#### Option B: Load Balancer (Cloud)

```
# http://localhost:8081 - Backend
# http://localhost:8000 - AI Pipeline
# Access at:

kubectl port-forward svc/backend 8081:80 -n etude-ai
# Backend

kubectl port-forward svc/ai-pipeline 8000:80 -n etude-ai
# AI Pipeline
```bash
#### Option A: Port Forward (Development)

### Step 6: Access Your Applications

---

```
kubectl logs -f deployment/backend -n etude-ai
kubectl logs -f deployment/ai-pipeline -n etude-ai
# Check logs

kubectl get pods -n etude-ai
kubectl get deployments -n etude-ai
# Check deployment status

kubectl apply -f k8s/04-backend.yaml
# Deploy Backend

kubectl apply -f k8s/03-ai-pipeline.yaml
# Deploy AI Pipeline
```bash

### Step 5: Deploy Applications

---

- Keycloak (authentication)
- Qdrant (vector database)
- PostgreSQL (user data)
- Redis (cache and session storage)
- Neo4j (graph database)
**What gets deployed:**

```
kubectl get pods -n etude-ai
# Check status

kubectl wait --for=condition=ready pod -l tier=infrastructure -n etude-ai --timeout=600s
# Wait for everything to be ready

kubectl apply -f k8s/02-infrastructure.yaml
# Deploy databases and services
```bash

### Step 4: Deploy Infrastructure

---

```
kubectl apply -f k8s/01-secrets.yaml
# Or use the secrets.yaml file (after editing with your values)

  --namespace=etude-ai
  --from-literal=sentry-dsn-backend="your-java-sentry-dsn" \
  --from-literal=sentry-dsn="your-python-sentry-dsn" \
  --from-literal=qdrant-api-key="your-qdrant-api-key" \
  --from-literal=llm-api-key="your-llm-api-key" \
  --from-literal=keycloak-password="your-keycloak-password" \
  --from-literal=postgres-password="your-postgres-password" \
  --from-literal=neo4j-password="your-neo4j-password" \
kubectl create secret generic etude-ai-secrets \
# Create secrets from .env file
```bash

### Step 3: Create Secrets

---

```
# Replace 'your-registry' with your actual registry
# Update image references in k8s/*.yaml files

docker push your-registry/etude-ai-backend:v1.0.0
docker build -t your-registry/etude-ai-backend:v1.0.0 .
cd ../backend
# Build Backend image

docker push your-registry/etude-ai-pipeline:v1.0.0
docker build -t your-registry/etude-ai-pipeline:v1.0.0 .
cd "AI Pipeline"
# Build AI Pipeline image
```bash

### Step 2: Build and Push Docker Images

---

```
gcloud container clusters get-credentials etude-ai-cluster --zone=us-central1-a
# Get credentials

  --zone=us-central1-a
  --machine-type=e2-standard-4 \
  --num-nodes=3 \
gcloud container clusters create etude-ai-cluster \
# Create GKE cluster
```bash
#### Option C: Cloud (GKE Example)

```
sudo cat /etc/rancher/k3s/k3s.yaml > ~/.kube/config
# Get kubeconfig

curl -sfL https://get.k3s.io | sh -
# Install k3s (Linux/WSL)
```bash
#### Option B: Local Development (k3s - Lightweight)

```
minikube addons enable metrics-server
# Enable metrics-server

minikube addons enable ingress
# Enable ingress addon

minikube start --cpus=4 --memory=8192 --disk-size=50g
# Start minikube

choco install minikube
# Windows (PowerShell as Admin)
# Install minikube
```bash
#### Option A: Local Development (Minikube)

### Step 1: Prepare Your Cluster

## 🚀 Step-by-Step Deployment

---

```
└── README.md                   # This file
├── 06-ingress.yaml             # Ingress controller
├── 05-monitoring.yaml          # Prometheus, Grafana
├── 04-backend.yaml             # Java Spring Boot backend
├── 03-ai-pipeline.yaml         # Python AI Pipeline deployment
├── 02-infrastructure.yaml      # Neo4j, Redis, PostgreSQL, Qdrant, Keycloak
├── 01-secrets.yaml             # Secrets (API keys, passwords)
├── 00-namespace.yaml           # Namespace for all resources
k8s/
```

## 📁 Kubernetes Files Structure

---

```
kubectl get all -n etude-ai
# 8. Check status

kubectl apply -f k8s/06-ingress.yaml
# 7. Deploy ingress (optional)

kubectl apply -f k8s/05-monitoring.yaml
# 6. Deploy monitoring (optional)

kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/03-ai-pipeline.yaml
# 5. Deploy applications

kubectl wait --for=condition=ready pod -l app=postgres -n etude-ai --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n etude-ai --timeout=300s
kubectl wait --for=condition=ready pod -l app=neo4j -n etude-ai --timeout=300s
# 4. Wait for infrastructure to be ready

kubectl apply -f k8s/02-infrastructure.yaml
# 3. Deploy infrastructure (databases)

kubectl apply -f k8s/01-secrets.yaml
# 2. Create secrets

kubectl apply -f k8s/00-namespace.yaml
# 1. Create namespace
```bash

### Deploy Everything in 5 Minutes

- Access to container registry (Docker Hub, GCR, ECR, etc.)
- Docker images built for AI Pipeline and Backend
- kubectl installed and configured
- Kubernetes cluster (local: minikube/k3s, cloud: GKE/EKS/AKS)
### Prerequisites

## 🎯 Quick Start

---

**Status:** Production-Ready Kubernetes Configuration
**Date:** December 14, 2025  


