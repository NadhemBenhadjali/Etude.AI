# Neo4j Connection Failure - Diagnosis and Solution

## Problem Summary

**Error**: DNS resolution failure when connecting to Neo4j database
```
Failed to DNS resolve address e0b7856e.databases.neo4j.io:7687: [Errno -2] Name or service not known
```

**Impact**: The `/summary` endpoint (and likely other endpoints) fail with HTTP 500 error because they cannot fetch data from the Neo4j knowledge graph.

## Root Cause

The application cannot resolve the hostname `e0b7856e.databases.neo4j.io` to an IP address. This indicates one of:

1. **No Internet Connection**: The container/server has no internet access
2. **DNS Configuration Issue**: DNS servers are not configured or unreachable  
3. **Firewall Blocking**: Network firewall is blocking DNS queries or Neo4j connection
4. **Neo4j Service Down**: The Neo4j Aura database instance is offline or deleted
5. **Environment Configuration**: Wrong Neo4j URI in environment variables

## Immediate Solutions

### Solution 1: Check Internet Connectivity
```bash
# Test DNS resolution
nslookup e0b7856e.databases.neo4j.io

# Test connectivity to Neo4j
ping e0b7856e.databases.neo4j.io

# Test Neo4j port
telnet e0b7856e.databases.neo4j.io 7687
```

### Solution 2: Verify Environment Variables
Check your `.env` file or environment configuration:

```bash
# Show current Neo4j configuration
echo $NEO4J_URI
echo $NEO4J_USER
echo $NEO4J_PASSWORD
```

Expected format:
```
NEO4J_URI=neo4j+s://e0b7856e.databases.neo4j.io:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
```

### Solution 3: Check Neo4j Aura Console
1. Log into https://console.neo4j.io/
2. Verify your database instance is running
3. Check the connection details match your `.env` file
4. Ensure your IP is whitelisted (if IP restrictions are enabled)

### Solution 4: Docker Network Issues (if running in Docker)
If running in Docker, ensure the container has network access:

```bash
# Check if container can resolve DNS
docker exec <container_name> nslookup e0b7856e.databases.neo4j.io

# Check if container can reach internet
docker exec <container_name> ping -c 3 8.8.8.8

# Restart with proper DNS
docker run --dns 8.8.8.8 --dns 8.8.4.4 ...
```

Or update `docker-compose.yml`:
```yaml
services:
  ai-pipeline:
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

### Solution 5: Use Local Neo4j (Development)
For local development, use a local Neo4j instance:

```bash
# Using Docker
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:latest
```

Then update `.env`:
```
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

## What I Fixed in the Code

### 1. Enhanced Error Handling
Updated `app/crew/knowledge_graph.py` to:
- Properly detect DNS and connection errors
- Raise specific `Neo4jConnectionError` exceptions
- Provide detailed error context for debugging

### 2. Circuit Breaker Integration
Added circuit breaker protection to prevent cascading failures:
- After 5 consecutive failures, circuit opens
- Requests fail fast for 30 seconds
- Prevents overwhelming the failing service
- Better user experience with faster error responses

### 3. Better Error Messages
The API now returns proper error messages:
```json
{
  "error": "Neo4jConnectionError",
  "message": "Failed to connect to Neo4j database: DNS resolution failed",
  "details": {
    "topic": "الحواس",
    "error": "Failed to DNS resolve address...",
    "uri": "neo4j+s://e0b7856e.databases.neo4j.io:7687"
  }
}
```

## Monitoring & Debugging

### Check Health Endpoint
```bash
curl http://localhost:8000/health
```

Expected response when Neo4j is down:
```json
{
  "status": "degraded",
  "dependencies": {
    "neo4j": "down: Failed to DNS resolve...",
    "redis": "up",
    "qdrant": "up"
  }
}
```

### Check Circuit Breaker Status
```bash
curl http://localhost:8000/circuit-breakers
```

Shows current circuit breaker states:
```json
{
  "neo4j": {
    "state": "open",
    "failure_count": 5,
    "last_failure_time": 1702736793.487
  }
}
```

### Check Prometheus Metrics
```bash
curl http://localhost:8000/metrics | grep circuit_breaker
```

## Kubernetes Considerations

If deployed to Kubernetes, check:

### 1. DNS Resolution in Pod
```bash
kubectl exec -it <pod-name> -- nslookup e0b7856e.databases.neo4j.io
```

### 2. Network Policies
Ensure Network Policies allow egress to external services:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-pipeline-egress
spec:
  podSelector:
    matchLabels:
      app: ai-pipeline
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector: {}
  - to:
    - podSelector: {}
  - ports:  # Allow external Neo4j
    - protocol: TCP
      port: 7687
  - ports:  # Allow DNS
    - protocol: UDP
      port: 53
```

### 3. CoreDNS Issues
Check CoreDNS logs:
```bash
kubectl logs -n kube-system -l k8s-app=kube-dns
```

## Testing the Fix

After resolving the connection issue, test:

```bash
# Test summary endpoint
curl -X POST http://localhost:8000/summary \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-123" \
  -d '{"module": "الحواس"}'

# Should return 200 with lesson summary JSON
```

## Prevention

### 1. Add Health Checks to Kubernetes
```yaml
livenessProbe:
  httpGet:
    path: /liveness
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /readiness
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 2. Set Up Monitoring Alerts
Configure Prometheus alerts for Neo4j connectivity:
```yaml
- alert: Neo4jCircuitBreakerOpen
  expr: circuit_breaker_state{service="neo4j"} == 1
  for: 1m
  annotations:
    summary: "Neo4j circuit breaker is OPEN"
    description: "Neo4j connection failures detected"
```

### 3. Add Connection Retry Logic
Already implemented with `@retry` decorator and circuit breaker.

## Files Modified

1. ✅ `app/crew/knowledge_graph.py` - Added circuit breaker protection and better error handling
2. ✅ `app/exceptions.py` - Already has `Neo4jConnectionError` exception
3. ✅ `app/app.py` - Already has exception handlers that return 503 for connection errors

## Next Steps

1. **Identify the root cause** using the diagnostic commands above
2. **Fix the network/configuration issue**
3. **Restart the application**
4. **Verify health endpoints show all services "up"**
5. **Test the summary endpoint**

## Quick Reference

| Error Type | Status Code | Retry? |
|------------|-------------|--------|
| DNS resolution failure | 503 | Yes (circuit breaker) |
| Neo4j auth failure | 503 | No |
| Topic not found | 404 | No |
| Circuit breaker open | 503 | Yes (after 30s) |
| Network timeout | 503 | Yes (3 retries) |

---

**Last Updated**: 2025-12-16
**Status**: Circuit breaker and enhanced error handling implemented ✅

