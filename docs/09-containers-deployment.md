# 9. Containers & Deployment

## Overview

Sentinel AI is containerized with Docker and orchestrated with Kubernetes. All services are Helm-packaged for deployment to any cloud provider.

---

## containers/ Folder Structure

```
containers/
├── docker/
│   ├── Dockerfile.frontend          Next.js production image
│   ├── Dockerfile.backend           Backend API server image
│   ├── Dockerfile.scanner           Scan engine image
│   ├── Dockerfile.sandbox           Exploit simulation sandbox
│   └── docker-compose.yml           Local development stack
├── kubernetes/
│   ├── namespace.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml                 HPA on CPU/memory
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── ingress.yaml                 Kong ingress controller
│   ├── network-policies.yaml        Zero-trust network rules
│   └── secrets.yaml                 Sealed secrets (never commit plain)
└── helm/
    ├── Chart.yaml
    ├── values.yaml
    ├── values.production.yaml
    └── templates/
```

---

## Local Development with Docker Compose

```yaml
# containers/docker/docker-compose.yml
services:
  frontend:
    build: ../../frontend
    ports: ["3000:3000"]
    env_file: ../../.env

  backend:
    build: ../../backend
    ports: ["8000:8000"]
    env_file: ../../.env
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: sentinelai
      POSTGRES_PASSWORD: ${SUPABASE_DB_PASSWORD}
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  neo4j:
    image: neo4j:5
    ports: ["7687:7687", "7474:7474"]
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
```

```bash
# Start local stack
cd containers/docker
docker compose up -d
```

---

## Kubernetes Deployment

```bash
# Deploy to cluster
kubectl apply -f containers/kubernetes/namespace.yaml
helm install sentinelai containers/helm \
  -f containers/helm/values.production.yaml \
  --namespace sentinelai
```

---

## Scaling Tiers

| Tier | Assets | Worker Pods | CPU | RAM |
|---|---|---|---|---|
| SMB | < 500 | 4 | 8 cores | 32 GB |
| Mid-Market | 500–5K | 16 | 32 cores | 128 GB |
| Enterprise | 5K–100K+ | 64+ | 128+ cores | 512 GB+ |

Exploit Worker pods scale via HPA based on **Kafka queue depth** metrics from Prometheus.

---

## Frontend Docker Image

```dockerfile
# containers/docker/Dockerfile.frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```
