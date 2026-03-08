# Sentinel AI — Remaining Work

**Last updated:** 2026-03-08
**Status:** Active development

---

## Priority 1 — Critical ✅ COMPLETED

### 1.1 Apply DB Migration 002 ✅ DONE
Tables `threat_feed`, `simulation_queue`, `sync_jobs` all exist and are populated.
```bash
# Already applied — idempotent (IF NOT EXISTS)
psql "$DATABASE_URL" -f database/migrations/002-threat-feed.sql
```

---

### 1.2 Wire Frontend to Live Backend API ✅ DONE
All dashboard pages are fully wired to the live backend via `frontend/lib/api-client.ts` + `frontend/hooks/use-api.ts`.

| Page | API endpoint | Status |
|---|---|---|
| Dashboard KPIs | `GET /api/dashboard/stats` | ✅ Live |
| Dashboard compliance | `GET /api/dashboard/compliance` | ✅ Live |
| Dashboard activity | `GET /api/dashboard/activity` | ✅ Live |
| Dashboard assets | `GET /api/assets/stats` | ✅ Live |
| Vulnerabilities | `GET /api/vulnerabilities` | ✅ Live |
| Threat Intelligence | `GET /api/sync/threat-feed` + stats | ✅ Live |
| Exploit Lab | `GET /api/simulation/results` + stats | ✅ Live |
| Attack Graph | `POST /api/attack-graph/build-auto` | ✅ Live |
| Compliance | `GET /api/dashboard/compliance` | ✅ Live |
| Patch Automation | `GET /api/patches` + stats | ✅ Live |

All pages use `useApi()` with loading skeletons and error banners. Fallback data is shown if backend is unreachable.

---

### 1.3 Run First Live CVE Sync ✅ DONE
Database is populated. Live data as of 2026-03-07:
- **89** threat_feed entries (real CVEs: CVE-2024-21762, CVE-2024-3400, CVE-2024-27198, etc.)
- **91** vulnerabilities (CVSS 7.0+)
- **45** assets (16 servers, 7 containers, 7 cloud, 6 databases, 5 endpoints, 4 network devices)
- **8** patch records with real CVE/PR data
- **51** attack graph nodes, **260** edges, **9** MITRE tactics
- **3** compliance frameworks (ISO 27001: 68%, SOC 2: 71%, PCI-DSS: 73%)

To re-run sync:
```bash
curl -X POST http://localhost:8000/api/sync/all
# Or individual sources:
curl -X POST http://localhost:8000/api/sync/nvd -H "Content-Type: application/json" -d '{"hours_back": 24}'
curl -X POST http://localhost:8000/api/sync/kev -H "Content-Type: application/json" -d '{"days_back": 7}'
```

---

---

### 1.4 Frontend Hardcoded Data Replaced ✅ DONE

All hardcoded mock data removed and replaced with live API calls:

| Component | Was | Now |
|---|---|---|
| `recent-alerts.tsx` | Hardcoded 5 CVEs | `threatFeedApi.list({exploit: true, limit: 5})` |
| `exploit-timeline.tsx` | Static 6-step pipeline | Derived from `dashboardApi.activity()` real events |
| `page.tsx` integrations | 6 fake SIEM/cloud tools | `integrationsApi.status()` from `/api/integrations/status` |
| `compliance/page.tsx` | 8 hardcoded controls | `GET /api/dashboard/compliance/controls` from DB |
| `patch-automation/page.tsx` | 3 hardcoded CI tools | `integrationsApi.status()` (company services) |
| `lib/vuln-data.ts` | Fake CVE database | Deleted — all pages use `vulnsApi.list()` |

---

### 1.5 Infrastructure Scanner ✅ DONE

Full company infrastructure scanning pipeline built:

**Backend:** `backend/src/routes/infra-scan.ts`
- `POST /api/infra-scan/run` — scan all 7 company services
- `GET /api/infra-scan/:id` — poll scan result
- `GET /api/infra-scan/latest` — latest scan
- `GET /api/infra-scan/catalog` — full CVE catalog
- `GET /api/integrations/status` — real service status for dashboard

**Services scanned:** GitLab, WordPress, ERPNext, Keycloak, PostgreSQL, Grafana, Prometheus

**CVEs in catalog:** 16 CVEs total (3 KEV, 11 exploit_available), CVSS range 4.6–10.0

**Frontend:** `frontend/app/(dashboard)/infra-scan/page.tsx`
- Full 5-step pipeline display: Identify → Detect CVEs → Map → Attack Graph → Patches
- Per-service detail cards with CVE expansion
- Attack graph (nodes/edges/tactic kill chain)
- Prioritized patch recommendations

**Docker clones:** All 7 company services added to `docker-compose.yml` under `company-infra` profile:
```bash
docker compose --profile company-infra up -d
```

**Exploit scripts:**
- `exploit-files/tools/gitlab/cve_2023_7028.py` — Account takeover PoC
- `exploit-files/tools/grafana/cve_2021_43798.py` — Arbitrary file read PoC
- `exploit-files/tools/keycloak/cve_2024_1132.py` — OAuth2 redirect_uri bypass
- `exploit-files/tools/wordpress/wp_enum.py` — User enum + CVE detection
- `exploit-files/tools/postgresql/pg_auth_check.py` — Auth + CVE-2024-0985 check
- `exploit-files/tools/erpnext/cve_2024_25136.py` — SQL injection detection
- `exploit-files/tools/prometheus/cve_2019_3826.py` — XSS + metrics exposure

---

## Priority 2 — High (core features incomplete)

### 2.1 AI Routes — Anthropic Credits
**What:** All `/api/ai/*` routes return `credit balance too low`. The API key is valid and wired correctly.
**Fix:** Add credits at **console.anthropic.com → Plans & Billing**
**Impact blocks:** Risk analysis, patch generation, attack modeling, compliance mapping, executive reports
**Effort:** 2 minutes + billing

---

### 2.2 Log4Shell Full RCE Confirmation
**What:** Payload delivery is confirmed (JNDI headers reach Log4j logger, HTTP 200 returned). Full RCE requires a DNS/LDAP callback server to receive the outbound JNDI lookup.
**Fix:** Set up interactsh (free, open source):
```bash
# Install interactsh
go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest
# Start listener — get a callback URL like abc123.oast.pro
interactsh-client
# Re-run exploit with your callback URL
python3 exploit-files/tools/rce/log4shell_exploit.py http://172.18.0.4:8080
# Replace CALLBACK in the script with your interactsh host
```
**Effort:** 30 minutes

---

### 2.3 Spring4Shell Target
**What:** `sentinel-spring4shell` container image pull is pending. Exploit script `tools/rce/spring4shell_exploit.py` is written and ready.
**Fix:**
```bash
docker compose --profile vuln-targets up -d spring4shell-target
python3 exploit-files/tools/rce/spring4shell_exploit.py http://localhost:8104
```
**Effort:** 15 minutes

---

### 2.4 SSRF Full Exploit
**What:** Juice Shop SSRF requires an authenticated session with a profile image URL submission. Registration worked but the `/profile/image/url` endpoint needs a confirmed JWT flow.
**Fix:** Update `tools/ssrf/juice_shop_ssrf.py` to retry with fresh JWT after registration.
**Effort:** 1 hour

---

### 2.5 Neo4j Attack Graph Seed Data
**What:** Neo4j is in docker-compose and the schema is defined, but no nodes or edges have been loaded. The attack graph routes (`/api/attack-graph/*`) build graphs from in-memory MITRE data but don't persist to Neo4j.
**What's needed:**
- Neo4j driver wired into the attack graph service
- Node/edge insertion when `buildCveAttackGraph()` runs
- Frontend attack graph page reads from Neo4j via backend
**Effort:** 2 days

---

## Priority 3 — Medium (enhancements)

### 3.1 Network Monitoring Live Capture
**What:** Suricata, ntopng, and Zabbix routes are built but require host-network Docker access to capture real traffic from network interfaces. In Codespaces/VM environments this needs elevated permissions.
**Blocker:** `--network host` and `cap_add: NET_ADMIN` required
**Effort:** 1 day (infra setup dependent)

---

### 3.2 Metasploitable + bWAPP Tests
**What:** Containers defined in docker-compose but no exploit scripts written for them yet.
**Metasploitable CVEs to target:**
- CVE-2004-2687 (distcc RCE, port 3632)
- CVE-2010-1938 (ProFTPd mod_copy)
- Unreal IRCd backdoor (port 6667)
- MySQL no-auth root (port 3306)
**Effort:** 2 days

---

### 3.3 Frontend Authentication
**What:** No login/auth system exists. Any user who opens `localhost:3000` has full access.
**Fix options:**
- Supabase Auth (email + magic link)
- Simple JWT via `/api/auth/login` backend route
**Effort:** 2 days

---

### 3.4 Exploit Results Stored Back to DB
**What:** The simulation engine writes to `exploit_results` table, but the frontend exploit lab page reads from `/api/simulation/results` which is already wired. Results will show once real simulations run.
**Fix:** Run at least one live simulation to populate the `exploit_results` table.
**Effort:** 30 minutes

---

## Summary Table

| Item | Priority | Effort | Status |
|---|---|---|---|
| Apply DB migration 002 | Critical | 5 min | ✅ Done |
| Wire frontend to API | Critical | — | ✅ Done |
| Run first CVE sync | Critical | 10 min | ✅ Done |
| Anthropic credits | High | 2 min | ⏳ Pending billing |
| Log4Shell DNS callback | High | 30 min | ⏳ Pending |
| Spring4Shell test | High | 15 min | ⏳ Pending |
| SSRF full exploit | High | 1 hr | ⏳ Pending |
| Neo4j graph seed | Medium | 2 days | ⏳ Pending |
| Network monitoring | Medium | 1 day | ⏳ Pending |
| Metasploitable exploits | Medium | 2 days | ⏳ Pending |
| Frontend auth | Medium | 2 days | ⏳ Pending |
| Exploit results in UI | Medium | 30 min | ⏳ Pending (needs 1 live sim) |
