# Sentinel AI — Remaining Work

**Last updated:** 2026-03-07
**Status:** Active development

---

## Priority 1 — Critical (blocks usability)

### 1.1 Apply DB Migration 002
**What:** `database/migrations/002-threat-feed.sql` has not been run against the live Supabase project.
**Impact:** `/api/sync/threat-feed`, `/api/sync/queue`, `/api/sync/nvd` all return 500 errors.
**Fix:**
```bash
psql "$DATABASE_URL" -f database/migrations/002-threat-feed.sql
```
**Effort:** 5 minutes

---

### 1.2 Wire Frontend to Live Backend API
**What:** All dashboard pages use hardcoded mock data from `frontend/lib/vuln-data.ts`. No page makes a real API call to `localhost:8000`.
**Impact:** The UI shows nothing real — vulnerabilities, threat feed, exploit results are all fake.
**Pages that need wiring:**
- `/vulnerabilities` → `GET /api/sync/threat-feed`
- `/threat-intelligence` → `GET /api/intel/cve/:id/enriched`
- `/exploit-lab` → `GET /api/simulation/:id`, `POST /api/simulation/run`
- `/attack-graph` → `POST /api/attack-graph/build`
- `/compliance` → `POST /api/ai/compliance`
- `/reports` → `POST /api/ai/executive-report`
- `/patch-automation` → `POST /api/ai/patch`
- Dashboard KPIs → `GET /api/sync/threat-feed/stats`

**Effort:** 3–5 days

---

### 1.3 Run First Live CVE Sync
**What:** The `threat_feed` table is empty. No CVE data has been pulled from NVD, KEV, or VulDB yet.
**Fix:**
```bash
# Trigger full sync manually
curl -X POST http://localhost:8000/api/sync/all
# Or trigger individual sources
curl -X POST http://localhost:8000/api/sync/nvd
curl -X POST http://localhost:8000/api/sync/kev
```
**Effort:** 10 minutes (then runs automatically on cron schedule)

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
**What:** The simulation engine writes to `exploit_results` table, but the frontend doesn't display these real results — it shows mock data.
**Fix:** Wire `/exploit-lab` page to read from `GET /api/simulation/results`.
**Effort:** 1 day

---

## Summary Table

| Item | Priority | Effort | Blocks |
|---|---|---|---|
| Apply DB migration 002 | Critical | 5 min | Sync routes |
| Wire frontend to API | Critical | 3–5 days | All real data |
| Run first CVE sync | Critical | 10 min | Threat feed data |
| Anthropic credits | High | 2 min | All AI routes |
| Log4Shell DNS callback | High | 30 min | RCE confirmation |
| Spring4Shell test | High | 15 min | CVE-2022-22965 |
| SSRF full exploit | High | 1 hr | SSRF test |
| Neo4j graph seed | Medium | 2 days | Attack graph |
| Network monitoring | Medium | 1 day | Suricata/ntopng |
| Metasploitable exploits | Medium | 2 days | More CVE coverage |
| Frontend auth | Medium | 2 days | Multi-user access |
| Exploit results in UI | Medium | 1 day | Real sim results |
