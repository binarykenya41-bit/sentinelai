# SENTINEL AI — Project Timeline

> Start Date: March 2026
> Based on ROADMAP.md phase plan

---

## Timeline Overview

```
Week 1–2   ████████████████████  Phase 1:  Database & Supabase Foundation  ✅ COMPLETE
Week 2–4   ░░████████████░░░░░░  Phase 2:  Frontend Pages (real data)
Week 3–5   ░░░░██░░░░░░░░░░░░░░  Phase 3:  Backend API Server               🔄 IN PROGRESS
Week 4–5   ░░░░░░████████░░░░░░  Phase 4:  Threat Intelligence Pipeline
Week 5–6   ░░░░░░░░████████░░░░  Phase 5:  AI Layer (Claude API)
Week 6–8   ░░░░░░░░░░████████░░  Phase 6:  Exploit Simulation Engine
Week 7–9   ░░░░░░░░░░░░████████  Phase 7:  Patch Automation & CI/CD
Week 8–9   ░░░░░░░░░░░░░░██████  Phase 8:  Attack Graph Engine
Week 9–10  ░░░░░░░░░░░░░░░░████  Phase 9:  Containers & Deployment
Week 10–11 ░░░░░░░░░░░░░░░░░░██  Phase 10: Security & Audit Polish
```

---

## Detailed Schedule

 
### Week 1–2 — Phase 1: Database & Supabase Foundation ✅ COMPLETE
**Goal:** Live data layer connected to the frontend

- ✅ Create Supabase JS client (`database/client.ts`)
- ✅ Apply full schema from `docs/05-database-schema.md` (`database/schema.sql`)
- ✅ Generate TypeScript types (`database/types.ts`)
- ✅ Seed development data (`database/seeds/dev.sql` — orgs, assets, vulns, integrations, audit log)
- ✅ Write migrations: initial schema, indexes, RLS policies, audit log (`database/migrate.mjs`)
- ⬜ Connect frontend to Supabase (`frontend/lib/supabase.ts`) — pending
- ⬜ Replace mock data in `lib/vuln-data.ts` with live queries — pending

---

### Week 2–4 — Phase 2: Frontend Pages (Real Data)
**Goal:** All 15 pages functional with live Supabase data

- Dashboard: real security posture score, KPIs, exploit timeline, alerts
- Vulnerabilities: paginated CVE table, filters, bulk status updates
- Exploit Lab: simulation launcher, live progress feed, history table
- Attack Graph: D3.js/React Flow graph with nodes, edges, risk coloring
- Patch Automation: patch queue, CI/CD status, approve-for-merge
- Threat Intelligence: TI feed table, KEV filter, EPSS sparklines
- Compliance: framework selector, controls table, posture gauge
- Reports: type selector, date picker, PDF generation
- Settings: org profile, API keys, RBAC user management, integrations

---

### Week 3–5 — Phase 3: Backend API Server 🔄 IN PROGRESS
**Goal:** All API endpoints live, connected to database and AI

- ✅ Initialize Node.js Fastify server (`backend/src/server.ts`)
- ✅ GitHub integration: CI/CD (Actions, PRs, commit status), code scanning alerts, Dependabot SCA, webhook handler (`backend/src/integrations/github/`)
- ✅ Cloudflare integration: DNS zones + exposure analysis, WAF rules + posture, firewall event logs (`backend/src/integrations/cloudflare/`)
- ✅ GCP integration: Compute Engine VM inventory + asset sync, Cloud Logging (admin/firewall/auth/GKE), Security Command Center findings (`backend/src/integrations/gcp/`)
- ✅ Integrations CRUD REST API (`backend/src/routes/integrations.ts`)
- ⬜ JWT auth middleware (Supabase JWTs)
- ⬜ RBAC middleware (Casbin policy enforcement)
- ⬜ REST endpoints: vulnerabilities, simulations, patches, graph, intel, compliance
- ⬜ WebSocket `/v1/ws`: simulation progress, posture updates, new vuln alerts

---

### Week 4–5 — Phase 4: Threat Intelligence Pipeline
**Goal:** Live enriched CVE data from 6 external sources

- NVD REST API 2.0 adapter (delta sync every 2h)
- MITRE ATT&CK TAXII 2.1 adapter
- CISA KEV catalog (daily sync)
- FIRST EPSS API (daily sync)
- GitHub Security Advisory API
- Exploit-DB CVE indexer
- ETL pipeline: INGEST → DEDUPLICATE → ENRICH → STORE → STREAM
- Kafka topic `vuln.enriched` for downstream consumers
- Redis cache layer (TTL per source)

---

### Week 5–6 — Phase 5: AI Layer (Claude API)
**Goal:** All 5 AI features live across the platform

- Anthropic SDK setup with retry logic (`backend/ai/client.ts`)
- Risk reasoning — contextual vulnerability narratives
- Attack scenario — multi-step attack chain modeling
- Patch generation — code fix generation per language (CWE-guided)
- Compliance mapping — control framework audit text
- Executive reporting — board-level business risk summaries
- Validation pipeline: syntax check → Semgrep → confidence gate (>= 0.75)

---

### Week 6–8 — Phase 6: Exploit Simulation Engine
**Goal:** Controlled sandbox exploit execution

- Firecracker + gVisor sandbox base configs
- Metasploit module wrapper scripts
- Exploit-DB PoC script indexer (by CVE)
- Multi-stage exploit chain runner
- ExploitResult recorder with confidence calibration
- Kill-switch API (< 500ms halt)
- MFA enforcement for CVSS >= 9.0
- Full isolation validation tests

---

### Week 7–9 — Phase 7: Patch Automation & CI/CD
**Goal:** AI patches automatically committed and re-tested

- GitHub branch + commit + PR automation
- GitLab equivalent integration
- GPG signing for all Sentinel AI commits
- GitHub Actions workflow template for CI validation
- Re-simulation trigger after CI passes
- Merge approval webhook handler
- `patch-failed` label + block on exploit re-success
- Failure context feedback loop back to Claude

---

### Week 8–9 — Phase 8: Attack Graph Engine
**Goal:** Live Neo4j graph with risk path analysis

- Neo4j node + edge schema (`database/graph/schema.cypher`)
- Asset inventory → graph node ingestion
- Dijkstra A* shortest path to critical assets
- PageRank risk propagation scoring
- Graph weight update when exploit confirmed (theoretical → 1.0)
- ASR delta calculation post-remediation
- Connect graph data to `/attack-graph` frontend page

---

### Week 9–10 — Phase 9: Containers & Deployment
**Goal:** Production-ready containerized deployment

- Dockerfiles for frontend and backend
- Docker Compose for full local dev stack
- Kubernetes manifests (`containers/kubernetes/`)
- Helm chart with values files (`containers/helm/`)
- HPA configs for Scan Engine + Exploit Worker pods
- Network policies (zero-trust between services)
- Sealed secrets for production credentials
- CI/CD pipeline for auto-deploy on main branch merge

---

### Week 10–11 — Phase 10: Security & Audit Polish
**Goal:** Production hardened, audit-ready

- Immutable audit log with HMAC chaining
- Merkle tree root publication every 15 minutes
- Evidence package auto-generation (ZIP on verify)
- mTLS between all services (Vault-backed PKI)
- RBAC full enforcement across all API endpoints
- MFA integration (TOTP)
- Rate limiting on all endpoints (Kong gateway)
- Penetration test of the platform itself
- Load testing (k6) at Enterprise tier sizing

---

## Milestones

| Milestone | Week | Deliverable |
|---|---|---|
| M1 — Data Layer Live | End of Week 2 | ✅ Database schema, types, client, seeds, migrations complete |
| M2 — Full UI | End of Week 4 | All 15 pages functional with live data |
| M3 — Backend Live | End of Week 5 | REST + WebSocket API fully operational |
| M4 — TI Pipeline | End of Week 5 | 6 threat intel sources ingesting continuously |
| M5 — AI Features | End of Week 6 | Claude API integrated across all 5 use cases |
| M6 — Exploit Engine | End of Week 8 | Isolated exploit simulation working end-to-end |
| M7 — Auto Patching | End of Week 9 | AI patches committed to CI/CD and re-verified |
| M8 — Attack Graph | End of Week 9 | Neo4j risk graph live with shortest-path queries |
| M9 — Containers | End of Week 10 | Full K8s deployment running in staging |
| M10 — Production | End of Week 11 | Platform hardened, pen-tested, and audit-ready |

---

## Priority Order

1. **Phase 1** — without a data layer, nothing else works
2. **Phase 2** — real UI validates the full UX before backend investment
3. **Phase 3 + 4** — backend and TI pipeline feed the frontend
4. **Phase 5** — AI layer is the core differentiator, build early
5. **Phase 6–8** — simulation, patching, graph (parallel if team size allows)
6. **Phase 9–10** — containerize and harden last

---

## Total Estimated Items

~120 tasks across 10 phases over 11 weeks.
