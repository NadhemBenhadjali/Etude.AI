<#
deploy-to-k8s.ps1

Production-shaped local deploy script for this repo:
- Builds local Docker images (backend, AI pipeline, gateway/frontend)
- Applies ALL k8s/*.yaml manifests in numeric order (skips *.template*)
- Waits for workloads to become ready
- Prints Ingress/Service endpoints

Assumptions:
- This script lives at the repo root
- k8s manifests live in ./k8s
- Docker Desktop Kubernetes (or another cluster that can see local Docker images)
#>

$ErrorActionPreference = "Stop"

# ----------------------------
# Config
# ----------------------------
$Namespace     = "etude-ai"
$K8sDir        = Join-Path $PSScriptRoot "k8s"

# Local image tags used by manifests (adjust if your YAML uses different names/tags)
$Images = @(
  @{
    Name = "etude-ai-backend"
    Tag  = "v1.0.0"
    Dockerfile = (Join-Path $PSScriptRoot "backend\Dockerfile")
    Context    = (Join-Path $PSScriptRoot "backend")
  },
  @{
    Name = "etude-ai-pipeline"
    Tag  = "v1.0.0"
    Dockerfile = (Join-Path $PSScriptRoot "AI Pipeline\Dockerfile")
    Context    = (Join-Path $PSScriptRoot "AI Pipeline")
  },
  @{
    Name = "etude-ai-gateway"
    Tag  = "v1.0.0"
    Dockerfile = (Join-Path $PSScriptRoot "gateway\Dockerfile")
    Context    = $PSScriptRoot   # gateway Dockerfile usually needs access to frontend/ and gateway/
  }
)

# ----------------------------
# Helpers
# ----------------------------
function Require-Command {
  param([Parameter(Mandatory=$true)][string]$Cmd)
  if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Cmd. Please install it and ensure it's in PATH."
  }
}

function Exec {
  param([Parameter(Mandatory=$true)][string]$Command)
  Write-Host "   > $Command" -ForegroundColor DarkGray
  Invoke-Expression $Command
}

function Apply-Yaml {
  param([Parameter(Mandatory=$true)][string]$Path)
  if (-not (Test-Path $Path)) { throw "YAML not found: $Path" }
  Exec "kubectl apply -f `"$Path`""
}

function Rollout-Status-IfExists {
  param(
    [Parameter(Mandatory=$true)][string]$Kind,
    [Parameter(Mandatory=$true)][string]$Name,
    [int]$TimeoutSec = 300
  )

  $exists = & kubectl get $Kind $Name -n $Namespace 2>$null
  if ($LASTEXITCODE -eq 0) {
    Exec "kubectl rollout status $Kind/$Name -n $Namespace --timeout=${TimeoutSec}s"
  }
}

# ----------------------------
# Checks
# ----------------------------
Write-Host "`n== Etude.ai Kubernetes Deploy ==" -ForegroundColor Cyan

Require-Command "docker"
Require-Command "kubectl"

Write-Host "`n1) Checking Kubernetes connectivity..." -ForegroundColor Yellow
Exec "kubectl cluster-info | Out-Null"
Write-Host "   ✅ Cluster reachable" -ForegroundColor Green

if (-not (Test-Path $K8sDir)) {
  throw "k8s directory not found at: $K8sDir"
}

# ----------------------------
# Build images
# ----------------------------
Write-Host "`n2) Building Docker images..." -ForegroundColor Yellow
foreach ($img in $Images) {
  $fullTag = "$($img.Name):$($img.Tag)"
  $df = $img.Dockerfile
  $ctx = $img.Context

  if (-not (Test-Path $df)) {
    throw "Dockerfile not found: $df"
  }
  if (-not (Test-Path $ctx)) {
    throw "Build context not found: $ctx"
  }

  Write-Host "   Building $fullTag" -ForegroundColor Cyan
  Exec "docker build -t $fullTag -f `"$df`" `"$ctx`""
}
Write-Host "   ✅ Images built" -ForegroundColor Green

# ----------------------------
# Apply manifests (in order)
# ----------------------------
Write-Host "`n3) Applying Kubernetes manifests..." -ForegroundColor Yellow

# Always apply in filename order: 00-..., 01-..., 02-..., etc.
$manifests = Get-ChildItem -Path $K8sDir -Filter "*.yaml" |
  Where-Object { $_.Name -notlike "*.template*" } |
  Sort-Object Name

if ($manifests.Count -eq 0) {
  throw "No YAML manifests found in $K8sDir"
}

# If secrets file is missing, fail fast with a helpful message (prod-safe behavior).
$secretsPath = Join-Path $K8sDir "01-secrets.yaml"
if (-not (Test-Path $secretsPath)) {
  $templatePath = Join-Path $K8sDir "01-secrets.yaml.template"
  if (Test-Path $templatePath) {
    throw "k8s/01-secrets.yaml is missing. Create it from 01-secrets.yaml.template (fill real values via secure process) before deploying."
  } else {
    throw "k8s/01-secrets.yaml is missing and no template exists. Cannot deploy."
  }
}

foreach ($m in $manifests) {
  Write-Host "   Applying $($m.Name)..." -ForegroundColor Cyan
  Apply-Yaml $m.FullName
}
Write-Host "   ✅ Manifests applied" -ForegroundColor Green

# ----------------------------
# Wait for readiness
# ----------------------------
Write-Host "`n4) Waiting for workloads to become ready..." -ForegroundColor Yellow

# Wait for all Deployments in the namespace to be available
Exec "kubectl wait --for=condition=available deployment --all -n $Namespace --timeout=600s"

# Rollout status for StatefulSets if any exist
$statefulsets = & kubectl get statefulset -n $Namespace -o name 2>$null
if ($LASTEXITCODE -eq 0 -and $statefulsets) {
  foreach ($ss in $statefulsets) {
    Exec "kubectl rollout status $ss -n $Namespace --timeout=600s"
  }
}

Write-Host "   ✅ Workloads ready" -ForegroundColor Green

# ----------------------------
# Print useful info
# ----------------------------
Write-Host "`n5) Deployment summary" -ForegroundColor Yellow

Write-Host "`n   Pods:" -ForegroundColor Cyan
Exec "kubectl get pods -n $Namespace -o wide"

Write-Host "`n   Services:" -ForegroundColor Cyan
Exec "kubectl get svc -n $Namespace"

Write-Host "`n   Ingress:" -ForegroundColor Cyan
& kubectl get ingress -n $Namespace 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "   (No Ingress found in namespace $Namespace)" -ForegroundColor DarkYellow
}

Write-Host "`nDone." -ForegroundColor Green

# Optional: show a helpful local access hint (especially for Docker Desktop)
Write-Host "`nIf you're using an Ingress controller (nginx), access the site via your ingress host." -ForegroundColor DarkCyan
Write-Host "If you don't have ingress-nginx installed yet, install it and re-apply 06-ingress.yaml." -ForegroundColor DarkCyan
