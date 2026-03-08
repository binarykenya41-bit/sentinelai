# SENTINEL AI — Project Timeline

> Start Date: March 2026
> Last updated: 2026-03-07

---

## Timeline Overview

```
Week 1–2   ████████████████████  Phase 1:  Database & Supabase Foundation  ✅ COMPLETE
Week 2–4   ████████████████████  Phase 2:  Frontend Pages (real data)      ✅ COMPLETE
Week 3–5   ████████████████████  Phase 3:  Backend API Server              ✅ COMPLETE
Week 4–5   ████████████████████  Phase 4:  Threat Intelligence Pipeline    ✅ COMPLETE
Week 5–6   ████████████░░░░░░░░  Phase 5:  AI Layer (Claude API)           🔄 PARTIAL
Week 6–8   ████████████░░░░░░░░  Phase 6:  Exploit Simulation Engine       🔄 PARTIAL
Week 7–9   ████████████░░░░░░░░  Phase 7:  Patch Automation & CI/CD        🔄 PARTIAL
Week 8–9   ░░░░░░░░████████░░░░  Phase 8:  Attack Graph Engine             🔄 IN PROGRESS
Week 9–10  ░░░░░░░░░░████████░░  Phase 9:  Containers & Deployment         ✅ SCAFFOLDED
Week 10–11 ░░░░░░░░░░░░░░░░████  Phase 10: Security & Audit Polish         ⬜ PENDING
```

---

## Detailed Schedule

### Week 1–2 — Phase 1: Database & Supabase Foundation ✅ COMPLETE

- ✅ Supabase project live (`lpivheudrpyzjqkegxww.supabase.co`)
- ✅ Full schema applied — `organizations`, `assets`, `vulnerabilities`, `exploit_results`, `patch_records`, `compliance_reports`, `audit_log`, `integrations`, `infrastructure_nodes`
- ✅ Migration 002 applied — `threat_feed`, `simulation_queue`, `sync_jobs`
- ✅ TypeScript types generated (`database/types.ts`)
- ✅ Service-role Supabase client (`backend/src/lib/supabase.ts`)
- ✅ Dev seed data loaded — 45 assets, 91 vulns, 8 patches, compliance reports
- ✅ All indexes + unique constraints active

---

### Week 2–4 — Phase 2: Frontend Pages (Real Data) ✅ COMPLETE

- ✅ Next.js 16 app running at `http://localhost:3000`
- ✅ All pages wired to live backend API via `useApi()` + `api-client.ts`
- ✅ Loading skeletons + error banners on every page (graceful degradation)
- ✅ Dashboard — security score, KPI cards, activity feed, compliance bar, asset twin
- ✅ Vulnerabilities — paginated table, severity/KEV/EPSS filters, detail panel
- ✅ Threat Intelligence — KEV feed, MITRE technique trends, exploit maturity breakdown
- ✅ Exploit Lab — simulation history table, launch dialog, stats bar
- ✅ Attack Graph — node grid, edge table, tactic kill chain, detail panel
- ✅ Compliance — framework score cards (ISO 27001 / SOC 2 / PCI-DSS), controls table
- ✅ Patch Automation — patch list with CI/CD status, resim results, PR links
- ✅ Turbopack workspace root fix (`turbopack.root` in `next.config.mjs`)

---

### Week 3–5 — Phase 3: Backend API Server ✅ COMPLETE

- ✅ Fastify backend running at `http://localhost:8000`
- ✅ Health endpoint: `GET /health` — all services reporting `ok`
- ✅ `GET /api/dashboard/stats` — security score, vuln counts, asset totals, sim stats
- ✅ `GET /api/dashboard/compliance` — live from `compliance_reports` table
- ✅ `GET /api/dashboard/activity` — live from `audit_log` table
- ✅ `GET|PATCH /api/assets` + `/api/assets/stats` + `/api/assets/:id`
- ✅ `GET|PATCH /api/vulnerabilities` + `/api/vulnerabilities/stats` + `/:id/status`
- ✅ `GET /api/patches` + `/api/patches/stats` + `/:id`
- ✅ `GET /api/simulation/results` + `/api/simulation/stats`
- ✅ `POST /api/simulation/run`
- ✅ `POST /api/attack-graph/build-auto` — 51 nodes, 260 edges, 9 tactics
- ✅ `GET|POST /api/sync/threat-feed` + `/stats` + `/nvd` + `/kev` + `/vuldb` + `/all`
- ✅ GitHub, Cloudflare, GCP integration routes
- ✅ CORS configured for `localhost:3000`
- ✅ Background scheduler (NVD every 6h, KEV daily, VulDB every 12h)
- ⬜ JWT auth middleware (Supabase JWTs)
- ⬜ WebSocket `/v1/ws` for live simulation progress

---

### Week 4–5 — Phase 4: Threat Intelligence Pipeline ✅ COMPLETE

- ✅ NVD API v2 adapter (`backend/src/intel/nvd.ts`) — `fetchCveById`, `searchCves`
- ✅ FIRST EPSS adapter (`backend/src/intel/epss.ts`) — single, batch, top
- ✅ CISA KEV catalog (`backend/src/intel/kev.ts`) — in-memory cache, 6h TTL
- ✅ MITRE ATT&CK adapter (`backend/src/intel/mitre.ts`) — STIX bundle (703 techniques), TAXII fallback
- ✅ VulDB adapter (`backend/src/intel/vuldb.ts`) — exploit maturity, ATT&CK mapping
- ✅ CVE enrichment pipeline (`backend/src/intel/enrichment.ts`) — merges all sources into `EnrichedCve` with `priority_score`
- ✅ Attack graph builder (`backend/src/intel/attack-graph.ts`)
- ✅ CVE sync service (`backend/src/services/cve-sync.ts`) — full + per-source sync
- ✅ Live data: **89 threat_feed entries**, 91 vulnerabilities synced from NVD + KEV
- ✅ Automatic upsert with deduplication by `cve_id`

---

### Week 5–6 — Phase 5: AI Layer (Claude API) 🔄 PARTIAL

- ✅ Anthropic SDK wired (`backend/src/ai/client.ts`) — model: `claude-sonnet-4-6`
- ✅ Risk reasoning engine (`backend/src/ai/risk-reasoning.ts`)
- ✅ Patch generation (`backend/src/ai/patch-generation.ts`)
- ✅ Attack chain modeling (`backend/src/ai/attack-modeling.ts`)
- ✅ Compliance mapping (`backend/src/ai/compliance-mapping.ts`)
- ✅ Executive reporting (`backend/src/ai/executive-reporting.ts`)
- ✅ All routes registered at `/api/ai/*`
- ⬜ **Blocked: Anthropic API credits exhausted** — add credits at console.anthropic.com → Plans & Billing

---

### Week 6–8 — Phase 6: Exploit Simulation Engine 🔄 PARTIAL

- ✅ Exploit module catalog (`backend/src/simulation/modules.ts`) — 9 modules (sqli, xss, ssrf, auth, port-scan, log4shell, spring4shell, sca, dirty-pipe)
- ✅ Docker sandbox lifecycle (`backend/src/simulation/sandbox.ts`) — `--network sentinel-sandbox`, `--cap-drop ALL`, CPU/mem limits
- ✅ Simulation orchestrator (`backend/src/simulation/engine.ts`)
- ✅ Auto-simulation scheduler (`backend/src/services/auto-simulation.ts`)
- ✅ Exploit scripts: SQLi, XSS, SSRF, brute-force, Log4Shell, Spring4Shell, dirty-pipe, SCA
- ✅ Vulnerable targets: DVWA, Juice Shop, Log4Shell-vulnerable app (`exploit-files/`)
- ✅ Log4Shell: JNDI payload delivery confirmed (HTTP 200, headers captured)
- ⬜ Log4Shell full RCE: needs interactsh DNS callback server
- ⬜ Spring4Shell: container image pull pending
- ⬜ SSRF: needs JWT flow fix in `juice_shop_ssrf.py`
- ⬜ `exploit_results` table empty — run at least one live simulation

---

### Week 7–9 — Phase 7: Patch Automation & CI/CD 🔄 PARTIAL

- ✅ Patch records table seeded — 8 patches with real CVE/branch/PR data
- ✅ Patch list + stats API endpoints live
- ✅ Frontend patch automation page reads real patch records
- ⬜ GitHub branch + commit + PR automation (blocked by Anthropic credits — patch generation needed)
- ⬜ Re-simulation trigger after CI passes
- ⬜ GPG signing for Sentinel AI commits

---

### Week 8–9 — Phase 8: Attack Graph Engine 🔄 IN PROGRESS

- ✅ In-memory graph builder from CVE + MITRE data — 51 nodes, 260 edges, 9 tactics
- ✅ Attack graph API + frontend page live
- ✅ Tactic kill-chain display (Reconnaissance → Initial Access → … → Impact)
- ⬜ Neo4j persistence — no nodes/edges loaded into Neo4j yet
- ⬜ Dijkstra shortest-path to critical assets
- ⬜ PageRank risk propagation
- ⬜ Graph weight updates when exploit confirmed

---

### Week 9–10 — Phase 9: Containers & Deployment ✅ SCAFFOLDED

- ✅ `docker/Dockerfile.backend` — Node 20 multi-stage, non-root, healthcheck
- ✅ `docker/Dockerfile.frontend` — Next.js standalone, non-root
- ✅ `docker/Dockerfile.scanner` — Trivy + Grype + Semgrep + OWASP DC
- ✅ `docker/Dockerfile.sandbox` — Kali Linux exploit sandbox
- ✅ `docker/docker-compose.yml` — frontend, backend, postgres, redis, neo4j, scanner
- ✅ `kubernetes/` — namespace, deployment/service/HPA, ingress, network-policies
- ⬜ Helm chart
- ⬜ Sealed secrets for production credentials
- ⬜ CI/CD auto-deploy pipeline

---

### Week 10–11 — Phase 10: Security & Audit Polish ⬜ PENDING

- ⬜ Immutable audit log with HMAC chaining
- ⬜ Frontend authentication (Supabase Auth or JWT)
- ⬜ RBAC enforcement across all API endpoints
- ⬜ Rate limiting
- ⬜ mTLS between services
- ⬜ Platform penetration test
- ⬜ Load testing (k6)

---

## Milestones

| Milestone | Deliverable | Status |
|---|---|---|
| M1 — Data Layer Live | Database schema, types, client, seeds, migrations | ✅ Done |
| M2 — Full UI | All pages functional with live data, frontend on port 3000 | ✅ Done |
| M3 — Backend Live | REST API fully operational on port 8000 | ✅ Done |
| M4 — TI Pipeline | NVD + KEV + EPSS + MITRE + VulDB ingesting | ✅ Done |
| M5 — AI Features | Claude API integrated (blocked on credits) | 🔄 Partial |
| M6 — Exploit Engine | Exploit simulation working end-to-end | 🔄 Partial |
| M7 — Auto Patching | AI patches committed to CI/CD and re-verified | ⬜ Pending |
| M8 — Attack Graph | Neo4j risk graph live with shortest-path queries | 🔄 In progress |
| M9 — Containers | Full K8s deployment running in staging | ⬜ Pending |
| M10 — Production | Platform hardened, pen-tested, audit-ready | ⬜ Pending |

---

## Live Services (as of 2026-03-07)

| Service | URL | Status |
|---|---|---|
| Frontend | http://localhost:3000 | ✅ Running |
| Backend | http://localhost:8000 | ✅ Running |
| Backend health | http://localhost:8000/health | ✅ ok |
| Supabase | lpivheudrpyzjqkegxww.supabase.co | ✅ Connected |

## To restart services

```bash
# Backend
cd /workspaces/sentinelai/backend
node dist/server.js &

# Frontend
cd /workspaces/sentinelai/frontend
npm run dev &
```
