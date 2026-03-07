# Sentinel AI — Complete Getting Started Guide

> Full stack security platform: AI-powered vulnerability management, exploit simulation, threat intelligence, and network monitoring.
> Everything runs on **localhost** via Docker Compose.

---

## Table of Contents

1. [What Was Built](#1-what-was-built)
2. [Architecture Overview](#2-architecture-overview)
3. [Prerequisites](#3-prerequisites)
4. [Clone Open Source Dependencies](#4-clone-open-source-dependencies)
5. [Environment Setup](#5-environment-setup)
6. [Database Setup](#6-database-setup)
7. [Seed Data](#7-seed-data)
8. [Run Frontend (Dev)](#8-run-frontend-dev)
9. [Run Backend (Dev)](#9-run-backend-dev)
10. [Deploy Full Stack in Containers](#10-deploy-full-stack-in-containers)
11. [Network Monitoring Stack](#11-network-monitoring-stack)
12. [API Reference Quick-Start](#12-api-reference-quick-start)
13. [Verify Everything Works](#13-verify-everything-works)
14. [Ports Reference](#14-ports-reference)
15. [What Is Not Yet Covered](#15-what-is-not-yet-covered)

---

## 1. What Was Built

### Backend (`backend/`)

| Layer | Files | Status |
|---|---|---|
| **Server** | `src/server.ts` — Fastify + CORS, port 8000 | ✅ |
| **AI Layer** | `src/ai/` — risk-reasoning, patch-generation, attack-modeling, compliance-mapping, executive-reporting | ✅ |
| **CVE Intel** | `src/intel/nvd.ts` — NVD API v2 | ✅ |
| **EPSS** | `src/intel/epss.ts` — FIRST EPSS probability scores | ✅ |
| **CISA KEV** | `src/intel/kev.ts` — Known Exploited Vulnerabilities catalog | ✅ |
| **MITRE ATT&CK** | `src/intel/mitre.ts` — TAXII 2.1, CWE→technique mapping | ✅ |
| **CVE Enrichment** | `src/intel/enrichment.ts` — NVD + EPSS + KEV + MITRE merged | ✅ |
| **Simulation Engine** | `src/simulation/engine.ts` — Docker sandbox orchestrator | ✅ |
| **Sandbox Manager** | `src/simulation/sandbox.ts` — lifecycle, kill switch | ✅ |
| **Exploit Modules** | `src/simulation/modules.ts` — 9 modules (SQLi, XSS, SSRF, auth, port-scan, Log4Shell, Spring4Shell, SCA, DirtyPipe) | ✅ |
| **Network Monitoring** | `src/integrations/network/monitor.ts` — ntopng, Suricata, Zabbix | ✅ |
| **GitHub Integration** | `src/integrations/github/` — CI/CD, code scanning, Dependabot, webhooks | ✅ |
| **Cloudflare Integration** | `src/integrations/cloudflare/` — WAF, DNS, security logs | ✅ |
| **GCP Integration** | `src/integrations/gcp/` — Compute, Logging, Security Command Center | ✅ |

### API Routes

| Prefix | Description |
|---|---|
| `GET /health` | Server health + feature flags |
| `POST /api/ai/*` | AI risk analysis, patch generation, attack modeling, compliance, executive reports |
| `GET /api/intel/cve/*` | CVE lookup + enrichment (NVD + EPSS + KEV + MITRE) |
| `GET /api/intel/epss/*` | EPSS exploit probability scores |
| `GET /api/intel/kev/*` | CISA Known Exploited Vulnerabilities |
| `GET/POST /api/intel/mitre/*` | MITRE ATT&CK techniques |
| `POST /api/simulation/run` | Launch exploit simulation |
| `DELETE /api/simulation/kill-all` | Emergency kill switch |
| `GET /api/simulation/results` | Historical simulation results |
| `GET /api/network/posture` | Aggregated network security posture |
| `GET /api/network/alerts` | Suricata IDS alerts |
| `GET /api/network/flows` | ntopng live traffic flows |
| `GET /api/network/problems` | Zabbix infrastructure problems |
| `POST /api/attack-graph/build` | Build CVE→technique→tactic attack graph |
| `GET /api/attack-graph/matrix` | Full ATT&CK technique matrix |
| `POST /api/intel/vuldb/batch-exploit-status` | VulDB exploit availability for CVE list |
| `GET /api/intel/vuldb/exploitable` | CVEs with active exploit code |
| `GET /api/intel/vuldb/recent` | Latest VulDB threat feed |
| `GET /api/intel/mitre/tactics` | All MITRE ATT&CK tactics |
| `GET /api/github/:owner/:repo/*` | GitHub security + CI/CD data |
| `GET /api/cloudflare/*` | Cloudflare WAF + DNS + logs |
| `GET /api/gcp/*` | GCP compute + logging + SCC |
| `CRUD /api/integrations/*` | Integration connection management |

### Frontend (`frontend/`)

Next.js 16 + React 19 + Tailwind + shadcn/ui. All pages in `frontend/app/(dashboard)/`:

| Page | Route |
|---|---|
| Dashboard | `/` |
| Vulnerabilities | `/vulnerabilities`, `/vulnerabilities/[cve]` |
| Threat Intelligence | `/threat-intelligence`, `/threat-intelligence/[cve]` |
| Exploit Lab | `/exploit-lab`, `/exploit-lab/[simId]` |
| Attack Graph | `/attack-graph`, `/attack-graph/[nodeId]` |
| Patch Automation | `/patch-automation`, `/patch-automation/[cve]` |
| Compliance | `/compliance`, `/compliance/[controlId]` |
| Network Security | `/network-security`, `/network-security/[id]` |
| Assets / Infrastructure | `/assets`, `/infrastructure` |
| Code Scanning | `/code-scanning` |
| Cloud Security | `/cloud-security` |
| Container Security | `/container-security` |
| Identity & Access | `/identity-access` |
| Incident Response | `/incident-response` |
| Red Team | `/red-team` |
| Risk Management | `/risk-management` |
| Reports | `/reports` |
| Integrations | `/integrations`, `/integrations/[category]` |
| Settings | `/settings` |

### Containers (`containers/`)

| File | Purpose |
|---|---|
| `docker/Dockerfile.backend` | Node 20 multi-stage, non-root, healthcheck |
| `docker/Dockerfile.frontend` | Next.js standalone output, non-root |
| `docker/Dockerfile.scanner` | Trivy + Grype + Semgrep + OWASP Dependency-Check |
| `docker/Dockerfile.sandbox` | Kali Linux — nmap, sqlmap, nikto, metasploit, hydra, pwntools |
| `docker/docker-compose.yml` | Full local stack |
| `kubernetes/` | Namespace, Deployments, Services, HPA, Ingress, NetworkPolicies |

### Exploit Simulation Tools (`exploit-files/tools/`)

| Script | CVE / Category | Description |
|---|---|---|
| `sqli/union_test.py` | CWE-89 | SQL injection UNION probe |
| `xss/reflected_scan.py` | CWE-79 | Reflected XSS detection |
| `ssrf/probe.py` | CWE-918 | SSRF internal network probe |
| `auth/brute.py` | CWE-307 | Credential brute-force simulation |
| `rce/log4shell_probe.py` | CVE-2021-44228 | Log4Shell JNDI detection |
| `rce/spring4shell_probe.py` | CVE-2022-22965 | Spring4Shell data binding probe |
| `lpe/dirty_pipe_check.sh` | CVE-2022-0847 | DirtyPipe kernel version check |
| `sca/dependency-check.sh` | SCA | OWASP Dependency-Check wrapper |

### Network Monitoring

| Tool | Role | Integration |
|---|---|---|
| **Suricata** | IDS/IPS — signature-based alert engine | `/api/network/alerts` reads EVE JSON log |
| **ntopng** | Real-time flow analysis + anomaly scoring | `/api/network/flows` via REST API |
| **Zabbix** | Infrastructure health + problem tracking | `/api/network/problems` via JSON-RPC |

---

## 2. Architecture Overview

```
Browser (localhost:3000)
        │
        ▼
  Next.js Frontend
        │  REST calls to localhost:8000
        ▼
  Fastify Backend (port 8000)
   ├── /api/ai/*          ──► Anthropic Claude API (cloud)
   ├── /api/intel/*       ──► NVD / EPSS / KEV / MITRE (cloud, public)
   ├── /api/simulation/*  ──► Docker sandbox containers
   ├── /api/network/*     ──► Suricata + ntopng + Zabbix (localhost)
   ├── /api/github/*      ──► GitHub API (cloud)
   ├── /api/cloudflare/*  ──► Cloudflare API (cloud)
   ├── /api/gcp/*         ──► GCP APIs (cloud)
   └── /api/integrations  ──► Supabase DB
        │
        ├── PostgreSQL (localhost:5432 or Supabase cloud)
        ├── Redis        (localhost:6379)
        └── Neo4j        (localhost:7687)

Simulation Sandbox (Docker):
  sentinelai/sandbox ─── isolated --internal network ──► target (sandbox only)
```

---

## 3. Prerequisites

Install the following on your machine:

```bash
# Node.js 20+
node --version   # must be >= 20.0.0
npm --version    # must be >= 9.0.0

# Docker + Docker Compose v2
docker --version              # must be >= 24.0.0
docker compose version        # must be >= 2.20.0

# Git
git --version

# Optional: psql client (for manual DB access)
psql --version
```

---

## 4. Clone Open Source Dependencies

### A. Clone the Sentinel AI repository

```bash
git clone https://github.com/your-org/sentinelai.git
cd sentinelai
```

### B. Frontend — open source UI libraries (already in package.json)

```bash
# shadcn/ui component library — installed via CLI
cd frontend
npx shadcn@latest add --all   # installs all configured components
```

If you want to clone shadcn/ui source to customize:

```bash
git clone https://github.com/shadcn-ui/ui.git ../shadcn-ui-src
```

### C. Backend — open source scanner tools (used inside Dockerfile.scanner)

These are fetched automatically during `docker build`. To inspect their source:

```bash
# Trivy — container & filesystem vulnerability scanner
git clone https://github.com/aquasecurity/trivy.git ../trivy

# Grype — container image vulnerability scanner
git clone https://github.com/anchore/grype.git ../grype

# Semgrep — SAST static analysis
git clone https://github.com/semgrep/semgrep.git ../semgrep

# OWASP Dependency-Check — SCA for JVM/Node/Python
git clone https://github.com/jeremylong/DependencyCheck.git ../DependencyCheck
```

### D. Network monitoring — open source tools

```bash
# Suricata IDS/IPS (runs in Docker — no manual clone needed)
# Image: jasonish/suricata:latest
# Source: https://github.com/OISF/suricata

# ntopng — network traffic analysis (community edition)
# Image: ntop/ntopng:stable
# Docs: https://www.ntop.org/guides/ntopng/

# Zabbix — infrastructure monitoring
# Image: zabbix/zabbix-server-pgsql:alpine-latest
# Source: https://github.com/zabbix/zabbix
```

### E. Exploit simulation — Metasploit Framework

```bash
# Metasploit is installed inside Dockerfile.sandbox via apt
# To use its Ruby source directly:
git clone https://github.com/rapid7/metasploit-framework.git ../metasploit-framework

# sqlmap (also in sandbox image)
git clone https://github.com/sqlmapproject/sqlmap.git ../sqlmap
```

### F. MITRE ATT&CK data (consumed via TAXII API — no clone needed)

```bash
# ATT&CK STIX data available if you want to run a local TAXII server:
git clone https://github.com/mitre-attack/attack-stix-data.git ../attack-stix-data
```

---

## 5. Environment Setup

```bash
# Copy the environment template
cp .env.example .env
```

Edit `.env` with your values. Minimum required for local dev:

```env
# ── Supabase (use local postgres if you don't have a Supabase account) ──────
SUPABASE_URL=http://localhost:54321          # or your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_DB_PASSWORD=sentineldev

DATABASE_URL=postgresql://postgres:sentineldev@localhost:5432/sentinelai

# ── Frontend ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ── Backend ──────────────────────────────────────────────────────────────────
BACKEND_PORT=8000
BACKEND_SECRET_KEY=local-dev-secret
BACKEND_CORS_ORIGINS=http://localhost:3000

# ── AI Layer (get free key at console.anthropic.com) ─────────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ── NVD (optional — get free key at nvd.nist.gov/developers) ─────────────────
NVD_API_KEY=

# ── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Sandbox Docker network ───────────────────────────────────────────────────
SANDBOX_NETWORK=sentinel-sandbox

# ── Network monitoring (only if using --profile network-monitoring) ──────────
NTOPNG_URL=http://localhost:3001
NTOPNG_USER=admin
NTOPNG_PASS=admin
ZABBIX_URL=http://localhost:8080/api_jsonrpc.php
ZABBIX_USER=Admin
ZABBIX_PASS=zabbix
SURICATA_EVE_LOG=/var/log/suricata/eve.json

# ── GitHub (optional) ────────────────────────────────────────────────────────
GITHUBTOKEN=github_pat_...
GITHUB_WEBHOOK_SECRET=

# ── Cloudflare (optional) ────────────────────────────────────────────────────
CLOUDFLARETOKEN=

# ── GCP (optional) ───────────────────────────────────────────────────────────
GCP_PROJECT_ID=
```

---

## 6. Database Setup

### Option A — Use local PostgreSQL via Docker Compose (recommended for dev)

```bash
# Start just the database services
cd containers/docker
docker compose up -d postgres redis neo4j

# Wait ~10 seconds for postgres to be ready, then apply schema
docker exec -i sentinelai-postgres-1 psql -U postgres -d sentinelai \
  < ../../database/schema.sql

# Verify
docker exec -it sentinelai-postgres-1 psql -U postgres -d sentinelai \
  -c "\dt"
```

### Option B — Use Supabase cloud (production)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and service role key into `.env`
3. Run the schema in the Supabase SQL editor:

```bash
# Copy schema.sql content → paste into Supabase SQL editor → Run
cat database/schema.sql
```

### Option C — Use Supabase CLI (local Supabase stack)

```bash
npm install -g supabase
supabase start          # starts local postgres + auth + studio on port 54321
supabase db push        # apply migrations

# Dashboard available at:
open http://localhost:54323
```

### Database Tables Created

| Table | Purpose |
|---|---|
| `organizations` | Multi-tenant org registry |
| `assets` | Infrastructure inventory (digital twin) |
| `vulnerabilities` | CVE records with EPSS, KEV, MITRE data |
| `exploit_results` | Sandbox simulation results |
| `patch_records` | AI-generated patch + CI/CD state |
| `compliance_reports` | ISO 27001 / SOC 2 / PCI-DSS reports |
| `audit_log` | Append-only tamper-evident event log |
| `integrations` | External tool connection configs |
| `infrastructure_nodes` | Manual network/endpoint entries |
| `custom_integration_categories` | User-defined integration types |

---

## 7. Seed Data

Load realistic demo data into your local database:

```bash
# Option A — psql directly
psql $DATABASE_URL -f database/seeds/dev.sql

# Option B — via Docker postgres container
docker exec -i sentinelai-postgres-1 psql -U postgres -d sentinelai \
  < database/seeds/dev.sql
```

**What the seed creates:**

| Table | Records |
|---|---|
| `organizations` | 1 — "Sentinel Demo Org" (enterprise, all frameworks) |
| `assets` | 5 — prod server, auth container, DB, S3 bucket, dev endpoint |
| `vulnerabilities` | 5 — mix of critical (KEV), high, medium, patched |
| `integrations` | 6 — GitHub, GitLab, AWS, Supabase, Neo4j, Redis |
| `audit_log` | 3 — simulation start, patch PR creation, integration connect |

**Verify seed:**

```bash
psql $DATABASE_URL -c "SELECT name, plan_tier FROM organizations;"
psql $DATABASE_URL -c "SELECT hostname, criticality, patch_status FROM assets;"
psql $DATABASE_URL -c "SELECT cve_id, cvss_v3, kev_status, remediation_status FROM vulnerabilities;"
```

---

## 8. Run Frontend (Dev)

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server with hot reload
npm run dev
# → http://localhost:3000

# Build for production
npm run build
npm run start
```

**Frontend tech stack:**
- Next.js 16, React 19, TypeScript
- Tailwind CSS v4
- shadcn/ui (Radix UI primitives)
- Recharts (dashboards/charts)
- lucide-react (icons)

---

## 9. Run Backend (Dev)

```bash
cd backend

# Install dependencies (first time only)
npm install

# Start with hot reload (tsx watch)
npm run dev
# → http://localhost:8000

# Type check only
npm run typecheck

# Build for production
npm run build
npm run start
```

**Test the backend is alive:**

```bash
curl http://localhost:8000/health
# {
#   "status": "ok",
#   "ts": "...",
#   "version": "0.2.0",
#   "services": { "ai": true, "nvd": true, "epss": true, "kev": true, "mitre": true, "simulation": true }
# }
```

---

## 10. Deploy Full Stack in Containers

### Start the complete local stack

```bash
cd containers/docker

# Build all images + start services
docker compose up -d --build

# Services started:
#   frontend   → http://localhost:3000
#   backend    → http://localhost:8000
#   postgres   → localhost:5432
#   redis      → localhost:6379
#   neo4j      → http://localhost:7474 (browser), bolt://localhost:7687
```

### Apply schema and seed after first start

```bash
# Wait for postgres to be ready (~10s)
docker compose exec postgres psql -U postgres -d sentinelai -f /dev/stdin < ../../database/schema.sql
docker compose exec postgres psql -U postgres -d sentinelai -f /dev/stdin < ../../database/seeds/dev.sql
```

### Build and test the sandbox image

```bash
cd containers/docker

# Build the sandbox image (takes ~5 min — installs Kali + tools)
docker build -f Dockerfile.sandbox ../../ -t sentinelai/sandbox:latest

# Test the sandbox runs correctly
docker run --rm \
  --network sentinel-sandbox \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --memory 512m --cpu-quota 50000 \
  -e SANDBOX_TARGET_HOST=scanme.nmap.org \
  -e SANDBOX_TARGET_PORT=80 \
  -e SENTINEL_SIM_ID=test-001 \
  -e SENTINEL_MODULE=network-port-scan \
  sentinelai/sandbox:latest \
  nmap -sV -p 22,80,443 scanme.nmap.org

# Create the isolated sandbox network (done automatically by engine.ts)
docker network create --driver bridge --internal sentinel-sandbox
```

### Build the scanner image

```bash
docker build -f Dockerfile.scanner ../../ -t sentinelai/scanner:latest

# Run a Trivy scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  sentinelai/scanner:latest trivy image sentinelai/backend:latest

# Run Semgrep SAST
docker run --rm -v $(pwd)/../../backend:/src \
  sentinelai/scanner:latest semgrep --config=auto /src
```

### Common Docker Compose commands

```bash
# View logs for all services
docker compose logs -f

# View logs for one service
docker compose logs -f backend

# Restart a single service
docker compose restart backend

# Stop everything (keep volumes)
docker compose down

# Stop everything + delete volumes (clean slate)
docker compose down -v

# Pull latest images
docker compose pull

# Scale backend to 3 replicas
docker compose up -d --scale backend=3
```

---

## 11. Network Monitoring Stack

Network monitoring services are in a separate Docker Compose profile to keep the core stack lightweight.

### Start network monitoring services

```bash
cd containers/docker

# Start Suricata + ntopng + Zabbix
docker compose --profile network-monitoring up -d

# Services:
#   suricata   → syslog / EVE JSON at /var/log/suricata/eve.json
#   ntopng     → http://localhost:3001  (admin / admin)
#   zabbix-web → http://localhost:8080  (Admin / zabbix)
```

### Configure Suricata rules

```bash
# Download latest Emerging Threats rules
docker compose exec suricata suricata-update

# Reload rules without restart
docker compose exec suricata suricatasc -c reload-rules
```

### Configure Zabbix

1. Open http://localhost:8080 → login as `Admin` / `zabbix`
2. Configuration → Hosts → Create host
3. Add your local assets (e.g., `postgres` container at `10.0.0.1:10050`)
4. Import template: Configuration → Templates → Import → choose Zabbix built-in `Linux by Zabbix agent`

### Query network posture from backend

```bash
# Aggregated score from all three tools
curl http://localhost:8000/api/network/posture

# Suricata IDS alerts (last 100)
curl http://localhost:8000/api/network/alerts

# ntopng top flows
curl http://localhost:8000/api/network/flows?limit=20

# Zabbix high/disaster problems
curl http://localhost:8000/api/network/problems?min_severity=4
```

---

## 12. API Reference Quick-Start

### Enrich a CVE (NVD + EPSS + KEV + MITRE + VulDB)

```bash
curl http://localhost:8000/api/intel/cve/CVE-2021-44228/enriched | jq .
```

### Search CVEs by keyword

```bash
curl "http://localhost:8000/api/intel/cves/search?keyword=log4j&severity=CRITICAL&limit=5" | jq .
```

### Get CISA KEV entries from last 30 days

```bash
curl http://localhost:8000/api/intel/kev/recent?days=30 | jq .
```

### Map CWEs to MITRE ATT&CK techniques

```bash
curl -X POST http://localhost:8000/api/intel/mitre/map-cwe \
  -H "Content-Type: application/json" \
  -d '{"cwe_ids": ["CWE-89", "CWE-79", "CWE-918"]}' | jq .
```

### AI risk analysis

```bash
curl -X POST http://localhost:8000/api/ai/risk \
  -H "Content-Type: application/json" \
  -d '{
    "vuln": {
      "cve_id": "CVE-2021-44228",
      "cvss_v3": 10.0,
      "epss_score": 0.975,
      "kev_status": true,
      "cwe_ids": ["CWE-502"],
      "mitre_techniques": ["T1190"]
    },
    "asset": {
      "type": "server",
      "hostname": "api-prod-01",
      "criticality": "critical"
    },
    "graph": {
      "inbound_paths": 12,
      "distance_from_edge": 1
    }
  }' | jq .
```

### Build an attack graph from CVEs (STIX + VulDB)

```bash
curl -X POST http://localhost:8000/api/attack-graph/build \
  -H "Content-Type: application/json" \
  -d '{
    "cve_ids": ["CVE-2021-44228", "CVE-2022-22965", "CVE-2022-0847"],
    "asset_ids": [
      {"id": "a1b2c3d4-0000-0000-0001-000000000001", "hostname": "api-prod-01", "type": "server"}
    ]
  }' | jq '{nodes: (.nodes | length), edges: (.edges | length), tactic_flow: .tactic_flow}'
```

### VulDB exploit status for CVE list

```bash
curl -X POST http://localhost:8000/api/intel/vuldb/batch-exploit-status \
  -H "Content-Type: application/json" \
  -d '{"cve_ids": ["CVE-2021-44228", "CVE-2022-22965"]}' | jq .
```

### Latest threat feed from VulDB

```bash
curl http://localhost:8000/api/intel/vuldb/recent?limit=5 | jq '.[].title'
```

### Run exploit simulation (dry run — no container launched)

```bash
curl -X POST http://localhost:8000/api/simulation/run \
  -H "Content-Type: application/json" \
  -d '{
    "vuln_id": "b1b2c3d4-0000-0000-0002-000000000001",
    "cve_id": "CVE-2021-44228",
    "module_id": "rce-log4shell",
    "target_host": "10.0.1.10",
    "operator_id": "admin@sentinel.io",
    "dry_run": true
  }' | jq .
```

### Generate executive security report

```bash
curl -X POST http://localhost:8000/api/ai/executive-report \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "Sentinel Demo Org",
    "period": "Q1 2026",
    "posture": {
      "total_vulnerabilities": 247,
      "critical": 5,
      "high": 28,
      "medium": 89,
      "low": 125,
      "kev_count": 3,
      "avg_time_to_remediate_days": 12,
      "patch_coverage_pct": 78,
      "exploit_success_rate": 0.34,
      "assets_at_risk": 14,
      "top_cves": ["CVE-2021-44228", "CVE-2022-22965", "CVE-2022-0847"]
    }
  }' | jq .
```

---

## 13. Verify Everything Works

Run through this checklist after first setup:

```bash
# 1. Backend health
curl http://localhost:8000/health

# 2. Database connectivity (seed data)
curl "http://localhost:8000/api/integrations?org_id=a1b2c3d4-0000-0000-0000-000000000001"

# 3. CVE intel (no API key needed)
curl http://localhost:8000/api/intel/cve/CVE-2021-44228/enriched | jq '.cve_id,.epss_score,.kev.is_kev'

# 4. MITRE ATT&CK (no API key needed — TAXII cache warms on first call, ~30s)
curl http://localhost:8000/api/intel/mitre/techniques/T1190 | jq '.name,.tactic_phases'

# 5. AI layer (requires ANTHROPIC_API_KEY)
curl -X POST http://localhost:8000/api/ai/patch \
  -H "Content-Type: application/json" \
  -d '{"cve_id":"CVE-2021-44228","cwe_ids":["CWE-502"],"language":"java","affected_code":"logger.info(userInput);"}'

# 6. Simulation (dry run — no ANTHROPIC_API_KEY needed)
curl -X POST http://localhost:8000/api/simulation/run \
  -H "Content-Type: application/json" \
  -d '{"vuln_id":"b1b2c3d4-0000-0000-0002-000000000001","target_host":"127.0.0.1","operator_id":"test","dry_run":true}'

# 7. Exploit module catalog
curl http://localhost:8000/api/simulation/modules | jq 'length'

# 8. Frontend renders
curl -s http://localhost:3000 | grep -o "<title>.*</title>"

# 9. Neo4j browser
open http://localhost:7474

# 10. Zabbix dashboard (if network-monitoring profile active)
open http://localhost:8080
```

---

## 14. Ports Reference

| Port | Service | URL |
|---|---|---|
| `3000` | Frontend (Next.js) | http://localhost:3000 |
| `8000` | Backend (Fastify API) | http://localhost:8000 |
| `5432` | PostgreSQL | `psql postgresql://postgres:sentineldev@localhost:5432/sentinelai` |
| `6379` | Redis | `redis-cli -h localhost` |
| `7474` | Neo4j Browser | http://localhost:7474 |
| `7687` | Neo4j Bolt | `bolt://localhost:7687` |
| `3001` | ntopng Web UI | http://localhost:3001 (admin/admin) |
| `8080` | Zabbix Web UI | http://localhost:8080 (Admin/zabbix) |
| `10051` | Zabbix Server (trapper) | — |
| `54321` | Supabase local API | http://localhost:54321 (if using Supabase CLI) |
| `54323` | Supabase Studio | http://localhost:54323 |

---

## 15. What Is Not Yet Covered

The following items are designed (see `docs/`) but not yet implemented:

| Feature | Docs Reference | Status |
|---|---|---|
| Temporal.io workflow engine (Scan→Simulate→Patch→Verify lifecycle) | `docs/04-backend-guide.md` | Planned |
| Kafka message queue for async job processing | `docs/04-backend-guide.md` | Planned |
| Neo4j attack graph queries (shortest path, risk propagation) | `docs/02-architecture.md` | Planned |
| AWS integration (EC2, GuardDuty, Inspector) | `docs/11-infrastructure-integration.md` | Planned |
| Azure integration (Defender, Sentinel SIEM) | `docs/11-infrastructure-integration.md` | Planned |
| GitLab + Bitbucket CI/CD integration | `docs/11-infrastructure-integration.md` | Planned |
| Nessus / Qualys scan import | `docs/04-backend-guide.md` | Planned |
| Auth layer (JWT + MFA enforcement for CVSS ≥ 9.0 simulations) | `docs/07-exploit-simulation.md` | Planned |
| Firecracker micro-VM sandbox (production hardening) | `docs/07-exploit-simulation.md` | Planned — Docker sandbox used today |
| PDF report generation + Supabase Storage upload | `docs/05-database-schema.md` | Planned |
| Helm chart for Kubernetes production deployment | `containers/helm/` | Scaffolded |

---

## Network Monitoring Coverage Summary

| Area | Tool | Coverage |
|---|---|---|
| Intrusion detection (signature-based) | Suricata | `/api/network/alerts` |
| Live traffic flow analysis | ntopng | `/api/network/flows`, `/api/network/interfaces` |
| Infrastructure health + alerting | Zabbix | `/api/network/problems` |
| WAF / Edge security | Cloudflare | `/api/cloudflare/*` |
| Cloud audit logging | GCP Cloud Logging | `/api/gcp/logging` |
| Git-level security | GitHub Advanced Security | `/api/github/:owner/:repo/code-scanning` |
| Container image scanning | Trivy / Grype | `Dockerfile.scanner` |
| SAST | Semgrep | `Dockerfile.scanner` |
| SCA | OWASP Dependency-Check + Grype | `exploit-files/tools/sca/` |
| CVE intelligence (exploit probability) | NVD + EPSS + CISA KEV | `/api/intel/*` |
| Attacker technique mapping | MITRE ATT&CK TAXII | `/api/intel/mitre/*` |
| AI threat scenario | Claude claude-sonnet-4-6 | `/api/ai/attack-model` |
