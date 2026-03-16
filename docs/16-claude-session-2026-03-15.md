# Session Notes — Claude Code, 2026-03-15

> **Author**: Claude Sonnet 4.6 (claude-sonnet-4-6)
> **Date**: 2026-03-15
> **Session type**: Full environment audit, dependency installation, and project walkthrough

---

## What This Session Covered

This was a full environment audit and bring-up session. Starting from a fresh clone state (no `node_modules` anywhere), the goal was to:
1. Explore and document the complete project structure
2. Create a `.env` file for local development
3. Install all dependencies (backend, frontend, cve-sync)
4. Build and start services
5. Document findings in this file

---

## Project State at Session Start

- **Branch**: `main`
- **Last commit**: `27effdd` — feat: industry demo system, CORS fix, hydration fix, full Render deploy config
- **node_modules**: Not installed in any service
- **`.env`**: Missing — only `.env.example` existed
- **Backend `dist/`**: Existed from a prior build (TypeScript compiled output was present)

---

## What Was Done

### 1. Created `.env` for local dev

Created `/workspaces/sentinelai/.env` from `.env.example` with:
- Backend configured to listen on port `8000`
- Frontend API URL pointing to `http://localhost:8000`
- Frontend dev URL at `http://localhost:3000`
- NVD and VulDB API keys pulled from `render.yaml` (demo keys already public in repo)
- Supabase fields left blank — must be filled in to connect to a real database

### 2. Installed all dependencies

Ran `npm install` in parallel for all three services:
```bash
cd backend  && npm install   # Fastify + Anthropic SDK + Supabase
cd frontend && npm install   # Next.js 16 + React 19 + Radix UI + Tailwind
cd cve-sync && npm install   # Fastify + node-cron + axios
```

### 3. Fixed proxy.js import bug

`backend/src/routes/proxy.js` had a stale `import { Router } from 'fastify'` — Fastify does not export `Router` (it's not Express). This crashed the entire server on startup. Removed the unused import.

### 4. Built the backend

```bash
cd backend && npm run build
```
`tsc` full build has 5 pre-existing type errors (non-blocking for dev mode):
- `src/integrations/gcp/scc.ts` — GCP Security Command Center API type mismatch
- `src/routes/github.ts` — Octokit enum mismatch (`"closed"` vs `"fixed"`)
- `src/server.ts` — missing type declaration for `proxy.js` (it's `.js` not `.ts`)

These don't affect `npm run dev` (uses `tsx` which does transpile-only, no type checking).

### 5. Started all services

Started in the background:
```bash
# Backend (port 8000)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev

# CVE Sync worker (port 8001)
cd cve-sync && npm run dev
```

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────────┐
│                      SENTINEL AI                             │
├──────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16, React 19)          :3000              │
│    ├── 20+ security module pages                             │
│    ├── Radix UI / shadcn components                          │
│    ├── Tailwind CSS 4 dark theme                             │
│    └── lib/api-client.ts → typed fetch to backend            │
├──────────────────────────────────────────────────────────────┤
│  Backend (Fastify, TypeScript)            :8000              │
│    ├── 31 route modules (/api/*)                             │
│    ├── Claude AI integration (Anthropic SDK)                 │
│    ├── Supabase PostgreSQL client                            │
│    ├── Redis cache (ioredis)                                 │
│    └── Exploit sandbox engine                                │
├──────────────────────────────────────────────────────────────┤
│  CVE Sync Worker (Fastify + node-cron)    :8001              │
│    ├── NVD: every hour                                       │
│    ├── CISA KEV: every 6 hours                               │
│    └── Full sync: daily at 02:00 UTC                         │
├──────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                      (external)         │
│  Redis                                    :6379 / managed    │
└──────────────────────────────────────────────────────────────┘
```

---

## Environment Variables — What's Required

| Variable | Required for | Notes |
|---|---|---|
| `SUPABASE_URL` | Backend, CVE Sync | Get from Supabase project settings |
| `SUPABASE_ANON_KEY` | Frontend | Public key, safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Keep secret, full DB access |
| `DATABASE_URL` | Migrations | `postgresql://postgres:...` |
| `ANTHROPIC_API_KEY` | AI features | `sk-ant-...` from console.anthropic.com |
| `NVD_API_KEY` | CVE sync | Free from nvd.nist.gov |
| `REDIS_URL` | Backend caching | `redis://localhost:6379` for local |
| `GITHUBTOKEN` | GitHub integration | PAT with repo scope |
| `CLOUDFLARETOKEN` | Cloudflare integration | API token |

Supabase and Anthropic API key are the minimum needed for the platform to function beyond UI demo mode.

---

## Service Start Commands (Quick Reference)

```bash
# All at once
bash start.sh

# Individually
cd backend  && npm run dev   # port 8000
cd frontend && npm run dev   # port 3000
cd cve-sync && npm run dev   # port 8001

# Production builds
cd backend  && npm run build && npm start
cd frontend && npm run build && npm start
cd cve-sync && npm run build && npm start
```

---

## API Health Check

```bash
curl http://localhost:8000/health
# → {"status":"ok","ts":"2026-03-15T...","version":"0.2.0"}
```

---

## Key Files to Know

| File | Purpose |
|---|---|
| `backend/src/server.ts` | Fastify entry point, all routes registered here |
| `backend/src/routes/ai.ts` | Claude AI endpoints |
| `backend/src/routes/simulation.ts` | Exploit sandbox engine |
| `backend/src/routes/dashboard.ts` | KPIs, posture score, activity feed |
| `frontend/app/(dashboard)/page.tsx` | Main dashboard page |
| `frontend/lib/api-client.ts` | Typed API client used across all pages |
| `frontend/lib/industry-context.tsx` | Industry context provider (fintech, healthcare, etc.) |
| `database/schema.sql` | Full PostgreSQL schema |
| `database/seeds/dev.sql` | Seed data for local development |
| `containers/docker/docker-compose.yml` | Full stack + 7 vulnerable service containers |
| `render.yaml` | Production deploy config (4 services) |
| `.env` | Local env (created this session) |

---

## Confirmed Working API Endpoints (Smoke Test)

All tested on 2026-03-15 against local backend at `http://localhost:8000`.

| Endpoint | Status | Notes |
|---|---|---|
| `GET /health` | ✅ 200 | `{"status":"ok","version":"0.2.0"}` |
| `GET /api/vulnerabilities` | ✅ 200 | Returns 12 CVEs with CVSS/EPSS/KEV data |
| `GET /api/assets` | ✅ 200 | Returns 10 assets |
| `GET /api/simulation/results` | ✅ 200 | Returns exploit simulation results |
| `GET /api/dashboard/stats` | ✅ 200 | Security score 27, vuln/asset summary |
| `GET /api/intel/kev` | ✅ 200 | Returns 1542 CISA KEV entries (live!) |

**Actual route paths** (not what the README implied):
- Dashboard: `/api/dashboard/stats`, `/api/dashboard/compliance`, `/api/dashboard/activity`
- Intel: `/api/intel/cve/:id`, `/api/intel/epss/:cveId`, `/api/intel/kev`, `/api/intel/kev/recent`, `/api/intel/mitre/techniques`, `/api/intel/vuldb/recent`

---

## Notes & Observations

- **Demo mode works without Supabase**: Most routes return realistic mock/generated data when DB is not connected. The platform is usable for UI demos without any credentials.
- **Redis is optional**: Backend gracefully handles Redis being absent (caching is skipped, no crash).
- **Vulnerable containers are for testing only**: The docker-compose includes intentionally vulnerable services (GitLab 16, WordPress 6.1, ERPNext, Keycloak, PostgreSQL 15, Grafana 8.3, Prometheus 2.5). Only start these in isolated network environments.
- **Exploit files contain real PoC scripts**: `exploit-files/tools/` contains working exploit scripts for the above CVEs. These are educational/testing tools for the platform's simulation feature.
- **TypeScript strict mode**: Backend uses `"type": "module"` (ESM). All imports need `.js` extensions even for `.ts` files.
- **Frontend uses Next.js App Router**: All pages live under `frontend/app/`. The `(dashboard)` folder is a route group (doesn't appear in URL).

---

## Deployment Path

For production on Render:
1. Push to `main`
2. Render auto-deploys all 4 services from `render.yaml`
3. Set secret env vars in Render dashboard (Supabase keys, Anthropic key)
4. Run DB migrations: `psql $DATABASE_URL < database/schema.sql`

See `docs/08-render-deployment.md` for the full guide.

---

## Docker Compose (Full Stack)

To run the entire platform locally including vulnerable targets:
```bash
cd containers/docker
docker-compose up -d

# Services:
# sentinelai-frontend    → http://localhost:3000
# sentinelai-backend     → http://localhost:8000
# vulnerable-gitlab      → http://localhost:8200
# vulnerable-wordpress   → http://localhost:8201
# vulnerable-erpnext     → http://localhost:8202
# vulnerable-keycloak    → http://localhost:8203
# vulnerable-postgres    → localhost:8204
# vulnerable-grafana     → http://localhost:8205
# vulnerable-prometheus  → http://localhost:8206
```

---

*Session completed by Claude Sonnet 4.6 on 2026-03-15.*
