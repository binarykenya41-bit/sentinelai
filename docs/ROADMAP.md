# SENTINEL AI — Build Roadmap & Todo List

> Full-stack completion plan based on the Technical Documentation
> Start Date: March 2026

---

## Current State

| Layer | Status |
|---|---|
| Frontend shell (routing, layout, sidebar, theme) | DONE |
| Page stubs (all 15 routes exist) | DONE |
| Mock data (vuln-data.ts) | DONE |
| Dashboard widgets (score, KPIs, timeline, alerts) | DONE |
| Environment variables (.env) | DONE |
| Documentation (docs/) | DONE |
| Supabase project connected | PENDING |
| Backend server | NOT STARTED |
| Database schema applied | NOT STARTED |
| Real data in UI | NOT STARTED |
| Exploit simulation engine | NOT STARTED |
| AI layer (Claude API) | NOT STARTED |
| Containers / deployment | NOT STARTED |

---

## PHASE 1 — Database & Supabase Foundation
> Goal: Live data layer connected to the frontend
> Duration: Week 1–2

### 1.1 Database Setup
- [ ] Create `database/client.ts` — Supabase JS client (reads from .env)
- [ ] Create `database/schema.sql` — all tables from docs/05-database-schema.md
- [ ] Run schema on Supabase dashboard
- [ ] Create `database/types.ts` — TypeScript types (supabase gen types)
- [ ] Create `database/seeds/` — seed data for development (50 vulns, 10 assets, 5 orgs)

### 1.2 Migrations
- [ ] `database/migrations/001_initial_schema.sql`
- [ ] `database/migrations/002_indexes.sql` (GIN indexes on TTP arrays)
- [ ] `database/migrations/003_rls_policies.sql` (Row Level Security per org)
- [ ] `database/migrations/004_audit_log_append_only.sql` (RLS: no UPDATE/DELETE)

### 1.3 Frontend — Connect to Supabase
- [ ] Install `@supabase/supabase-js` in `frontend/`
- [ ] Create `frontend/lib/supabase.ts` — browser client
- [ ] Replace mock data in `lib/vuln-data.ts` with real Supabase queries
- [ ] Add loading states + error boundaries to all data-fetching pages

---

## PHASE 2 — Frontend Pages (Real Data)
> Goal: All 15 pages fully functional with live Supabase data
> Duration: Week 2–4

### 2.1 Dashboard (`/`)
- [ ] Security posture score — calculate from open vulns + CVSS + EPSS
- [ ] KPI cards — real counts from DB (open vulns, critical, patched, assets)
- [ ] Exploit timeline — query exploit_results ordered by executed_at
- [ ] Recent alerts — live vulnerability feed with severity badges
- [ ] Real-time posture score updates via Supabase Realtime

### 2.2 Vulnerabilities (`/vulnerabilities`)
- [ ] Paginated CVE table with columns: CVE ID, CVSS, EPSS, KEV, Status, Assets
- [ ] Filters: severity, kev_only, status, date range, scan source
- [ ] Sort by CVSS / EPSS / detection date
- [ ] Bulk status update (mark as accepted risk, false positive)
- [ ] CVE detail page (`/vulnerabilities/[cve]`):
  - [ ] Full VulnRecord display
  - [ ] Affected assets list with criticality
  - [ ] MITRE ATT&CK technique tags
  - [ ] Exploit history for this CVE
  - [ ] Linked patch records
  - [ ] AI risk narrative (Claude API)

### 2.3 Exploit Lab (`/exploit-lab`)
- [ ] Simulation launcher form (select CVE + target asset)
- [ ] MFA confirmation modal for CVSS >= 9.0
- [ ] Active simulation progress feed (WebSocket / Supabase Realtime)
- [ ] Simulation history table with success/failure badge
- [ ] Kill-switch button (halt all active simulations)
- [ ] Simulation detail page (`/exploit-lab/[simId]`):
  - [ ] ExploitResult breakdown (stage by stage)
  - [ ] ATT&CK technique visualization
  - [ ] Confidence score gauge
  - [ ] Raw output log viewer
  - [ ] Link to auto-generated patch

### 2.4 Attack Graph (`/attack-graph`)
- [ ] Install D3.js or React Flow for graph rendering
- [ ] Render nodes (server, container, db, service, identity)
- [ ] Render edges (can_access, can_exploit, can_escalate, trusts)
- [ ] Color-code nodes by risk score
- [ ] Shortest path highlighting (attacker → critical asset)
- [ ] Attack Surface Reduction (ASR) metric delta display
- [ ] Node detail panel (`/attack-graph/[nodeId]`):
  - [ ] Node type, criticality, connected assets
  - [ ] Inbound/outbound edges
  - [ ] Risk propagation score
  - [ ] Linked vulnerabilities

### 2.5 Patch Automation (`/patch-automation`)
- [ ] Patch queue table (pending, running, passed, failed)
- [ ] CI/CD pipeline status per patch (live status badge)
- [ ] Re-simulation result column (exploit_failed / exploit_succeeded)
- [ ] Approve for merge button (Admin role)
- [ ] Patch detail page (`/patch-automation/[cve]`):
  - [ ] AI-generated diff viewer (syntax highlighted)
  - [ ] CI pipeline steps with pass/fail indicators
  - [ ] Re-simulation evidence log
  - [ ] GPG commit signature info
  - [ ] PR link to GitHub/GitLab

### 2.6 Threat Intelligence (`/threat-intelligence`)
- [ ] TI feed table: CVE, source (NVD/MITRE/CISA/EPSS), last updated
- [ ] KEV filter (CISA Known Exploited toggle)
- [ ] EPSS probability sparkline per CVE
- [ ] MITRE ATT&CK technique tags
- [ ] Manual sync trigger button
- [ ] TI CVE detail page (`/threat-intelligence/[cve]`):
  - [ ] Full enriched VulnRecord
  - [ ] All source data (NVD + MITRE + CISA + EPSS + ExploitDB)
  - [ ] Attack chain modeling narrative (Claude API)

### 2.7 Compliance (`/compliance`)
- [ ] Framework selector: ISO 27001 / SOC 2 / PCI-DSS
- [ ] Controls table with: ID, name, status (compliant/partial/gap), evidence count
- [ ] Posture gauge per framework (% compliant)
- [ ] Evidence package download button
- [ ] Control detail page (`/compliance/[controlId]`):
  - [ ] Control description
  - [ ] Mapped vulnerabilities
  - [ ] Remediation actions taken
  - [ ] Auto-generated audit narrative (Claude API)

### 2.8 Reports (`/reports`)
- [ ] Report type selector: Executive / Technical / Compliance / Audit
- [ ] Date range picker
- [ ] Generate PDF button (trigger Claude API → PDF)
- [ ] Report history list with download links
- [ ] Report preview panel

### 2.9 Settings (`/settings`)
- [ ] Organization profile (name, plan tier)
- [ ] API key management (generate, revoke)
- [ ] Notification preferences
- [ ] Scan schedule configuration
- [ ] Compliance framework selection
- [ ] RBAC user management (invite, assign roles)
- [ ] Integrations panel (GitHub, GitLab, Slack, Jira)

---

## PHASE 3 — Backend API Server
> Goal: All API endpoints live, connected to database and AI
> Duration: Week 3–5

### 3.1 Server Setup (`backend/`)
- [ ] Initialize Node.js + Fastify (or Python FastAPI)
- [ ] `backend/src/server.ts` — entry point with CORS, auth middleware
- [ ] JWT auth middleware (validate Supabase JWTs)
- [ ] RBAC middleware (Casbin policy enforcement)
- [ ] Request logging + error handling
- [ ] Health check endpoint `GET /health`

### 3.2 REST Endpoints
- [ ] `GET/POST /vulnerabilities` — list + trigger scan
- [ ] `GET /vulnerabilities/:cve_id` — enriched record
- [ ] `POST /simulations` — start exploit simulation
- [ ] `GET /simulations/:id` — result + live status
- [ ] `DELETE /simulations/killswitch` — halt all
- [ ] `POST /patches` — generate + commit AI patch
- [ ] `GET /patches/:id` — record + CI status
- [ ] `GET /graph/shortest-path` — attack path query
- [ ] `GET /intel/cve/:cve_id` — enriched TI data
- [ ] `POST /intel/sync` — manual TI sync trigger
- [ ] `GET /compliance/:framework` — posture data
- [ ] `POST /compliance/report` — generate PDF report

### 3.3 WebSocket (`/v1/ws`)
- [ ] Simulation progress events
- [ ] Simulation complete events
- [ ] Posture score update events
- [ ] New vulnerability alert events

---

## PHASE 4 — Threat Intelligence Pipeline
> Goal: Live enriched CVE data from 6 sources
> Duration: Week 4–5

- [ ] `backend/intel/nvd.ts` — NVD REST API 2.0 (delta sync every 2h)
- [ ] `backend/intel/mitre.ts` — MITRE ATT&CK TAXII 2.1 adapter
- [ ] `backend/intel/cisa.ts` — CISA KEV catalog (daily sync)
- [ ] `backend/intel/epss.ts` — FIRST EPSS API (daily sync)
- [ ] `backend/intel/github.ts` — GitHub Security Advisory API
- [ ] `backend/intel/exploitdb.ts` — Exploit-DB CVE indexer
- [ ] ETL pipeline: INGEST → DEDUPLICATE → ENRICH → STORE → STREAM
- [ ] Kafka topic `vuln.enriched` for downstream consumers
- [ ] Redis cache layer (TTL per source)
- [ ] Add NVD/MITRE API keys to `.env`

---

## PHASE 5 — AI Layer (Claude API)
> Goal: All 5 AI features live across the platform
> Duration: Week 5–6

- [ ] `backend/ai/client.ts` — Anthropic SDK setup + retry logic
- [ ] `backend/ai/risk-reasoning.ts` — contextual vulnerability narrative
- [ ] `backend/ai/attack-scenario.ts` — multi-step attack chain modeling
- [ ] `backend/ai/patch-generation.ts` — code fix generation per language
- [ ] `backend/ai/compliance-mapping.ts` — control framework audit text
- [ ] `backend/ai/reporting.ts` — executive summary generation
- [ ] Validation pipeline: syntax check → Semgrep → confidence gate
- [ ] Add `ANTHROPIC_API_KEY` to `.env`
- [ ] Wire AI narratives into frontend detail pages
- [ ] Add `CLAUDE_API_KEY` to Settings → Integrations panel

---

## PHASE 6 — Exploit Simulation Engine
> Goal: Controlled sandbox exploit execution
> Duration: Week 6–8

- [ ] `exploit-files/sandbox/` — Firecracker + gVisor base configs
- [ ] Metasploit module wrapper scripts
- [ ] Exploit-DB PoC script indexer (by CVE)
- [ ] Sandbox provisioning API (POST /simulations triggers this)
- [ ] Multi-stage exploit chain runner
- [ ] ExploitResult recorder (confidence calibration)
- [ ] Kill-switch API (<500ms halt)
- [ ] MFA enforcement for CVSS >= 9.0
- [ ] Full isolation validation tests

---

## PHASE 7 — Patch Automation & CI/CD
> Goal: AI patches automatically committed and re-tested
> Duration: Week 7–9

- [ ] `backend/patch/github.ts` — create branch + commit + PR
- [ ] `backend/patch/gitlab.ts` — GitLab equivalent
- [ ] GPG signing for all Sentinel AI commits
- [ ] GitHub Actions workflow template for CI validation
- [ ] Re-simulation trigger after CI passes
- [ ] Merge approval webhook handler
- [ ] `patch-failed` label + block on exploit re-success
- [ ] New remediation cycle with failure context fed back to Claude

---

## PHASE 8 — Attack Graph Engine
> Goal: Live Neo4j graph with risk path analysis
> Duration: Week 8–9

- [ ] `database/graph/schema.cypher` — Neo4j node + edge schema
- [ ] `backend/graph/ingest.ts` — asset inventory → graph nodes
- [ ] `backend/graph/shortest-path.ts` — Dijkstra A* to critical assets
- [ ] `backend/graph/risk-propagation.ts` — PageRank risk scoring
- [ ] Graph weight update when exploit confirmed (theoretical → 1.0)
- [ ] ASR delta calculation post-remediation
- [ ] Connect Neo4j graph data to `/attack-graph` frontend page

---

## PHASE 9 — Containers & Deployment
> Goal: Production-ready containerized deployment
> Duration: Week 9–10

- [ ] `containers/docker/Dockerfile.frontend`
- [ ] `containers/docker/Dockerfile.backend`
- [ ] `containers/docker/docker-compose.yml` (full local dev stack)
- [ ] `containers/kubernetes/` — all K8s manifests
- [ ] `containers/helm/` — Helm chart with values files
- [ ] HPA configs (Scan Engine + Exploit Worker pods)
- [ ] Network policies (zero-trust between services)
- [ ] Sealed secrets for production credentials
- [ ] CI/CD pipeline for auto-deploy on main branch merge

---

## PHASE 10 — Security, Audit & Polish
> Goal: Production hardened, audit-ready
> Duration: Week 10–11

- [ ] Immutable audit log with HMAC chaining
- [ ] Merkle tree root publication every 15 minutes
- [ ] Evidence package auto-generation (ZIP on verify)
- [ ] mTLS between all services (Vault-backed PKI)
- [ ] RBAC full enforcement across all API endpoints
- [ ] MFA integration (TOTP)
- [ ] Rate limiting on all endpoints (Kong gateway)
- [ ] Penetration test of the platform itself
- [ ] Load testing (k6) at Enterprise tier sizing

---

## Timeline Summary

```
Week 1–2   ████████░░░░░░░░░░░░  Phase 1: Database & Supabase
Week 2–4   ░░████████████░░░░░░  Phase 2: Frontend Pages (real data)
Week 3–5   ░░░░████████████░░░░  Phase 3: Backend API Server
Week 4–5   ░░░░░░████████░░░░░░  Phase 4: Threat Intelligence Pipeline
Week 5–6   ░░░░░░░░████████░░░░  Phase 5: AI Layer (Claude API)
Week 6–8   ░░░░░░░░░░████████░░  Phase 6: Exploit Simulation Engine
Week 7–9   ░░░░░░░░░░░░████████  Phase 7: Patch Automation & CI/CD
Week 8–9   ░░░░░░░░░░░░░░██████  Phase 8: Attack Graph Engine
Week 9–10  ░░░░░░░░░░░░░░░░████  Phase 9: Containers & Deployment
Week 10–11 ░░░░░░░░░░░░░░░░░░██  Phase 10: Security & Audit Polish
```

---

## Priority Order (What to Build Next)

1. **Phase 1 first** — without data, nothing else works
2. **Phase 2** — frontend with real data validates the full UX
3. **Phase 3 + 4** — backend + TI pipeline feeds the frontend
4. **Phase 5** — AI layer is the core differentiator, build early
5. **Phase 6–8** — simulation, patching, graph (parallel if team allows)
6. **Phase 9–10** — containerize + harden last

---

## Total Estimated Items: ~120 tasks across 10 phases
