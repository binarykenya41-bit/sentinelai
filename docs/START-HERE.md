# Sentinel AI — Complete Setup & Run Guide

Everything you need to start the frontend, backend, exploit simulation lab,
and all supporting services from a fresh clone.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Configure](#2-clone--configure)
3. [Database Setup](#3-database-setup)
4. [Start the Backend](#4-start-the-backend)
5. [Start the Frontend](#5-start-the-frontend)
6. [Start with Docker (full stack)](#6-start-with-docker-full-stack)
7. [Exploit Simulation Lab](#7-exploit-simulation-lab)
8. [Run Exploit Tests](#8-run-exploit-tests)
9. [API Quick Reference](#9-api-quick-reference)
10. [Ports & URLs at a Glance](#10-ports--urls-at-a-glance)
11. [Stopping Everything](#11-stopping-everything)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

Install the following before starting:

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| Docker Desktop | 24+ | https://docker.com |
| Git | any | https://git-scm.com |
| Python 3 | 3.9+ | https://python.org (for exploit scripts) |

Verify:
```bash
node --version    # v18+
npm --version     # 9+
docker --version  # 24+
python3 --version # 3.9+
```

---

## 2. Clone & Configure

### Clone the repo

```bash
git clone https://github.com/Alphaxide/sentinelai.git
cd sentinelai
```

### Set up environment variables

The project uses **per-package `.env` files** so each service can be deployed independently.

**Backend** — copy and fill in:
```bash
cp backend/.env backend/.env        # already exists, edit in place
```

Open `backend/.env` and set:
```env
# REQUIRED — get from console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-...

# Already filled in (Supabase project credentials)
SUPABASE_URL=https://lpivheudrpyzjqkegxww.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NVD_API_KEY=9276f8ff-2e38-4503-89fc-f38cdc88b743
VULDB_API_KEY=b9658d48154624beafb2599823cfbf88
```

**Frontend** — already configured:
```bash
# frontend/.env.local is ready — no changes needed for local dev
```

**Database** — already configured:
```bash
# database/.env has Supabase connection details
```

> **Security note:** `.env` files are gitignored. Never commit them.
> All example values live in `.env.example`.

---

## 3. Database Setup

The project uses **Supabase** (hosted PostgreSQL). The connection is pre-configured
in the `.env` files. You only need to run migrations once.

### Apply the schema

```bash
# Option A — psql direct (fastest)
psql "$DATABASE_URL" -f database/schema.sql

# Option B — Supabase dashboard
# Go to: https://supabase.com/dashboard → SQL Editor → paste database/schema.sql
```

### Apply migration 002 (threat feed, simulation queue, sync jobs)

```bash
psql "$DATABASE_URL" -f database/migrations/002-threat-feed.sql
```

### Load seed data (optional — 20 CVEs, assets, exploits)

```bash
psql "$DATABASE_URL" -f database/seeds/dev.sql
```

### Verify tables exist

```bash
psql "$DATABASE_URL" -c "\dt"
```

Expected tables:
```
organizations, assets, vulnerabilities, exploit_results, patch_records,
compliance_reports, audit_log, integrations, infrastructure_nodes,
threat_feed, simulation_queue, sync_jobs
```

---

## 4. Start the Backend

The backend is a **Fastify + TypeScript** server on port **8000**.

### Install dependencies

```bash
cd backend
npm install
```

### Run in development mode (hot reload)

```bash
npm run dev
```

You should see:
```
Server listening at http://0.0.0.0:8000
[SCHEDULER] Starting Sentinel AI background scheduler
[SCHEDULER] AUTO_SIM_ENABLED=false
[MITRE] Loading ATT&CK STIX bundle from GitHub...
[MITRE] Loaded 24771 STIX objects from GitHub
[SCHEDULER] MITRE cache warm: 703 techniques loaded
```

### Run in production mode

```bash
npm run build        # compiles TypeScript → dist/
npm run start        # runs dist/server.js
```

### Verify the backend is running

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "0.2.0",
  "services": {
    "ai": true,
    "nvd": true,
    "epss": true,
    "kev": true,
    "mitre_stix": true,
    "vuldb": true,
    "simulation": true,
    "cve_sync": true,
    "auto_simulation": false
  }
}
```

> `ai: false` means `ANTHROPIC_API_KEY` is not set. Add it to `backend/.env`.

### Backend environment variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_PORT` | `8000` | Server port |
| `ANTHROPIC_API_KEY` | — | Required for AI routes |
| `NVD_API_KEY` | set | Raises NVD rate limit |
| `VULDB_API_KEY` | set | VulDB threat intelligence |
| `AUTO_SIM_ENABLED` | `false` | Enable auto-simulation scheduler |
| `AUTO_SIM_DRY_RUN` | `true` | Dry-run mode (no live sandboxes) |
| `MAX_CONCURRENT_SIMS` | `2` | Sandbox concurrency limit |

---

## 5. Start the Frontend

The frontend is a **Next.js 14** app on port **3000**.

### Install dependencies

```bash
cd frontend
npm install
```

### Run in development mode

```bash
npm run dev
```

Open: **http://localhost:3000**

### Run in production mode

```bash
npm run build
npm run start
```

### Frontend environment variables (`frontend/.env.local`)

| Variable | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | set | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | set | Supabase public key |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

---

## 6. Start with Docker (Full Stack)

Run everything — frontend, backend, Postgres, Redis, Neo4j — in containers.

### Prerequisites

```bash
# Create a Docker network for the sandbox (done once)
docker network create sentinel-sandbox --internal 2>/dev/null || true
```

### Start core services

```bash
cd containers/docker
docker compose up -d
```

This starts:
- **Frontend** on http://localhost:3000
- **Backend** on http://localhost:8000
- **PostgreSQL** on localhost:5432
- **Redis** on localhost:6379
- **Neo4j** on http://localhost:7474 (browser), bolt://localhost:7687

### Start with network monitoring (Suricata, ntopng, Zabbix)

```bash
docker compose --profile network-monitoring up -d
```

Additional services:
- **ntopng** on http://localhost:3001
- **Zabbix** on http://localhost:8080

### View logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop all

```bash
docker compose down
```

---

## 7. Exploit Simulation Lab

The exploit lab uses intentionally vulnerable open source apps as targets.
All containers run on the **`sentinel-sandbox` internal network** — no external traffic.

### Start vulnerable targets

```bash
cd containers/docker
docker compose --profile vuln-targets up -d
```

This pulls and starts:

| Container | App | Port (host) | Internal IP | Vulnerabilities |
|---|---|---|---|---|
| `sentinel-dvwa` | DVWA | 8100 | 172.18.0.2 | SQLi, XSS, CSRF, Auth |
| `sentinel-juice-shop` | OWASP Juice Shop | 8101 | 172.18.0.3 | XSS, SSRF, Injection, JWT |
| `sentinel-webgoat` | WebGoat | 8102 | — | SQLi, XSS, XXE, Deserialization |
| `sentinel-log4shell` | Log4j 2.14.1 app | 8103 | 172.18.0.4 | **CVE-2021-44228** |
| `sentinel-spring4shell` | Spring Boot app | 8104 | — | **CVE-2022-22965** |
| `sentinel-metasploitable` | Metasploitable2 | 8105 | — | 20+ CVEs (distcc, ProFTPd, etc.) |
| `sentinel-bwapp` | bWAPP | 8106 | — | 700+ vulnerabilities |

### DVWA first-time setup

DVWA needs its database initialized on first run:

```bash
# Connect to DVWA container and set up MySQL
docker exec sentinel-dvwa bash -c "
mysql -u root dvwa -e \"
CREATE TABLE IF NOT EXISTS users (
  user_id int NOT NULL auto_increment,
  first_name varchar(15), last_name varchar(15),
  user varchar(15), password varchar(32),
  avatar varchar(70), last_login timestamp, failed_login int,
  PRIMARY KEY (user_id)
);
INSERT IGNORE INTO users VALUES
  (1,'admin','admin','admin',MD5('password'),'/hackable/users/admin.jpg',NOW(),0),
  (2,'Gordon','Brown','gordonb',MD5('abc123'),'/hackable/users/gordonb.jpg',NOW(),0),
  (3,'Hack','Me','1337',MD5('charley'),'/hackable/users/1337.jpg',NOW(),0),
  (4,'Pablo','Picasso','pablo',MD5('letmein'),'/hackable/users/pablo.jpg',NOW(),0),
  (5,'Bob','Smith','smithy',MD5('password'),'/hackable/users/smithy.jpg',NOW(),0);
\"
"

# Fix DVWA config
docker exec sentinel-dvwa bash -c "cat > /var/www/html/config/config.inc.php << 'PHP'
<?php
\$DBMS = 'MySQL';
\$_DVWA = array();
\$_DVWA[ 'db_server' ]   = '127.0.0.1';
\$_DVWA[ 'db_database' ] = 'dvwa';
\$_DVWA[ 'db_user' ]     = 'dvwa';
\$_DVWA[ 'db_password' ] = 'dvwa';
\$_DVWA[ 'db_port' ]     = '3306';
\$_DVWA[ 'recaptcha_public_key' ]  = '';
\$_DVWA[ 'recaptcha_private_key' ] = '';
\$_DVWA[ 'default_security_level' ] = 'low';
\$_DVWA[ 'default_phpids_level' ]   = 'disabled';
\$_DVWA[ 'default_phpids_verbose' ] = 'false';
?>
PHP
"

# Create dvwa DB user
docker exec sentinel-dvwa bash -c "
mysql -u root mysql -e \"
CREATE USER IF NOT EXISTS 'dvwa'@'%' IDENTIFIED BY 'dvwa';
GRANT ALL ON dvwa.* TO 'dvwa'@'%';
FLUSH PRIVILEGES;
\"
"
```

### Verify targets are live

```bash
# DVWA
curl -s http://172.18.0.2/login.php | grep -o "<title>.*</title>"
# → <title>Login :: Damn Vulnerable Web Application (DVWA) v1.10</title>

# Juice Shop
curl -s http://172.18.0.3:3000 | grep -o "<title>.*</title>"
# → <title>OWASP Juice Shop</title>

# Log4Shell
curl -s http://172.18.0.4:8080 -H "X-Api-Version: test"
# → Hello, world!
```

---

## 8. Run Exploit Tests

Install Python dependencies first:
```bash
pip3 install requests
```

### Run all tests (automated)

```bash
bash exploit-files/run-exploit-tests.sh
```

### Run individual exploit scripts

```bash
# SQL Injection — DVWA (CWE-89)
python3 exploit-files/tools/sqli/dvwa_sqli.py http://172.18.0.2

# Auth Bruteforce — DVWA (CWE-307)
python3 exploit-files/tools/auth/dvwa_bruteforce.py http://172.18.0.2

# XSS + CSP check — Juice Shop (CWE-79)
python3 exploit-files/tools/xss/juice_shop_xss.py http://172.18.0.3:3000

# Log4Shell — CVE-2021-44228 (CVSS 10.0)
python3 exploit-files/tools/rce/log4shell_exploit.py http://172.18.0.4:8080

# Spring4Shell — CVE-2022-22965 (CVSS 9.8)
python3 exploit-files/tools/rce/spring4shell_exploit.py http://172.18.0.5:8080

# SSRF — Juice Shop (CWE-918)
python3 exploit-files/tools/ssrf/juice_shop_ssrf.py http://172.18.0.3:3000
```

### Test results summary (confirmed)

| Exploit | Target | CVE/CWE | Result |
|---|---|---|---|
| SQLi UNION attack | DVWA | CWE-89 | **VULNERABLE** |
| Auth bruteforce | DVWA | CWE-307 | **VULNERABLE** — 5/5 accounts cracked |
| XSS / missing CSP | Juice Shop | CWE-79 | **VULNERABLE** |
| Log4Shell JNDI | Log4j 2.14.1 | CVE-2021-44228 | **PAYLOAD DELIVERED** |
| Spring4Shell RCE | Spring Boot | CVE-2022-22965 | Pending image |
| SSRF | Juice Shop | CWE-918 | Partial |

Full results: `docs/12-exploit-test-results.md`

### Trigger simulation via API

```bash
# Queue a simulation for a CVE
curl -X POST http://localhost:8000/api/simulation/run \
  -H "Content-Type: application/json" \
  -d '{
    "cve_id": "CVE-2021-44228",
    "target_host": "172.18.0.4",
    "target_port": 8080,
    "module_id": "rce-log4shell",
    "dry_run": false
  }'

# Check simulation queue
curl http://localhost:8000/api/sync/queue

# Emergency stop all running simulations
curl -X DELETE http://localhost:8000/api/sync/queue/emergency-stop
```

---

## 9. API Quick Reference

All routes are prefixed with `http://localhost:8000`.

### Health & Status
```
GET  /health                          — service status
GET  /api/sync/status                 — scheduler last-run times
```

### Threat Intelligence
```
GET  /api/intel/cve/:id               — raw NVD data
GET  /api/intel/cve/:id/enriched      — NVD + EPSS + KEV + MITRE + VulDB
GET  /api/intel/epss/:cveId           — EPSS exploit probability
GET  /api/intel/epss/top              — top CVEs by EPSS score
GET  /api/intel/kev                   — CISA KEV catalog (1500+ entries)
GET  /api/intel/mitre/tactics         — all 14 MITRE ATT&CK tactics
GET  /api/intel/cves/search?keyword=  — search NVD
POST /api/intel/vuldb/cve/:id         — VulDB threat intel
```

### CVE Sync (pulls live data from NVD / KEV / VulDB)
```
POST /api/sync/nvd                    — sync NVD (last 24h CRITICAL+HIGH)
POST /api/sync/kev                    — sync CISA KEV
POST /api/sync/vuldb                  — sync VulDB
POST /api/sync/all                    — full sync (all sources)
GET  /api/sync/threat-feed            — stored threat feed
GET  /api/sync/threat-feed/stats      — feed statistics
```

### Exploit Simulation
```
POST /api/simulation/run              — run a simulation
GET  /api/simulation/:id              — simulation result
GET  /api/sync/queue                  — simulation queue
POST /api/sync/queue/build            — scan vulns and build queue
POST /api/sync/queue/dispatch         — run pending queue jobs
DELETE /api/sync/queue/emergency-stop — kill all sandboxes
```

### AI Layer (requires ANTHROPIC_API_KEY with credits)
```
POST /api/ai/risk                     — contextual CVE risk analysis
POST /api/ai/patch                    — generate secure code patch
POST /api/ai/attack-model             — multi-step attack chain
POST /api/ai/compliance               — ISO 27001 / SOC 2 / PCI-DSS mapping
POST /api/ai/executive-report         — board-ready security report
```

### Attack Graph
```
POST /api/attack-graph/build          — build CVE attack graph
POST /api/attack-graph/build-from-vuln — graph from DB vulnerabilities
GET  /api/attack-graph/matrix         — full ATT&CK matrix
GET  /api/attack-graph/chain?ids=     — attack chain for technique IDs
```

---

## 10. Ports & URLs at a Glance

| Service | URL | Notes |
|---|---|---|
| **Frontend** | http://localhost:3000 | Next.js dashboard |
| **Backend API** | http://localhost:8000 | Fastify REST API |
| **PostgreSQL** | localhost:5432 | Local only (Supabase in prod) |
| **Redis** | localhost:6379 | Cache |
| **Neo4j Browser** | http://localhost:7474 | Attack graph DB |
| **Neo4j Bolt** | bolt://localhost:7687 | API connection |
| **Zabbix** | http://localhost:8080 | Network monitoring |
| | | |
| **DVWA** | http://localhost:8100 | SQLi / XSS target |
| **Juice Shop** | http://localhost:8101 | XSS / SSRF target |
| **WebGoat** | http://localhost:8102 | Java vuln training |
| **Log4Shell** | http://localhost:8103 | CVE-2021-44228 target |
| **Spring4Shell** | http://localhost:8104 | CVE-2022-22965 target |
| **Metasploitable** | http://localhost:8105 | Classic multi-CVE target |
| **bWAPP** | http://localhost:8106 | 700+ vuln training |

Default credentials:

| App | Username | Password |
|---|---|---|
| DVWA | `admin` | `password` |
| Juice Shop | register any email | — |
| WebGoat | register any email | — |
| Neo4j | `neo4j` | `sentineldev` |

---

## 11. Stopping Everything

```bash
# Stop backend (Ctrl+C if running in terminal, or:)
kill $(lsof -ti:8000)

# Stop frontend
kill $(lsof -ti:3000)

# Stop all Docker services
cd containers/docker
docker compose down

# Stop only vulnerable targets
docker compose --profile vuln-targets down

# Stop everything including volumes (WARNING: deletes data)
docker compose down -v
```

---

## 12. Troubleshooting

### Backend won't start — "Missing SUPABASE_URL"
```bash
# Run from backend/ directory so dotenv picks up backend/.env
cd backend && npm run dev
# OR pass env file explicitly:
node --env-file=.env --import tsx/esm src/server.ts
```

### Frontend can't reach backend — CORS error
Check `backend/.env`:
```env
BACKEND_CORS_ORIGINS=http://localhost:3000
```

### DVWA redirects to setup.php
The database needs initialization — run the DVWA setup commands in [section 7](#7-exploit-simulation-lab).

### Log4Shell container not responding
```bash
# Check the container is on the sandbox network
docker network inspect docker_sentinel-sandbox
# Pull logs
docker logs sentinel-log4shell
```

### Simulation API returns "AUTO_SIM_ENABLED=false"
```bash
# Enable in backend/.env
AUTO_SIM_ENABLED=true
AUTO_SIM_DRY_RUN=true   # keep true for safe testing
```

### node-cron / tsx not found
```bash
cd backend && npm install
```

### "credit balance too low" from AI routes
Add credits at **console.anthropic.com → Plans & Billing**.
All other routes (intel, simulation, sync) work without Anthropic credits.

---

## Project Structure

```
sentinelai/
├── frontend/               Next.js 14 dashboard
│   ├── app/(dashboard)/    All pages (vulnerabilities, exploits, compliance...)
│   ├── components/         Shared UI components
│   └── .env.local          Frontend env vars
│
├── backend/                Fastify + TypeScript API
│   ├── src/
│   │   ├── server.ts       Entry point
│   │   ├── routes/         API route handlers
│   │   ├── services/       Scheduler, CVE sync, auto-simulation
│   │   ├── simulation/     Exploit engine + sandbox + modules
│   │   ├── intel/          NVD, EPSS, KEV, MITRE, VulDB, enrichment
│   │   └── ai/             Claude AI layer (risk, patch, attack model)
│   └── .env                Backend env vars
│
├── database/               Supabase schema + migrations + seeds
│   ├── schema.sql          Full table definitions
│   ├── migrations/         002-threat-feed.sql
│   └── seeds/dev.sql       20 CVEs, 10 assets, exploit results
│
├── exploit-files/          Exploit simulation scripts
│   ├── tools/sqli/         SQL injection exploits
│   ├── tools/xss/          XSS exploits
│   ├── tools/rce/          RCE exploits (Log4Shell, Spring4Shell)
│   ├── tools/auth/         Auth bruteforce
│   ├── tools/ssrf/         SSRF exploits
│   └── run-exploit-tests.sh Full test runner
│
├── containers/docker/      Docker Compose stack
│   ├── docker-compose.yml  All services + vuln targets
│   ├── Dockerfile.backend  Backend image
│   ├── Dockerfile.frontend Frontend image
│   └── Dockerfile.sandbox  Kali Linux exploit sandbox
│
└── docs/                   All documentation
    ├── START-HERE.md        ← This file
    ├── 00-getting-started.md
    ├── 07-exploit-simulation.md
    └── 12-exploit-test-results.md
```
