# Sentinel AI — Live Infrastructure Cloning & Authorized Attack Simulation

**Classification:** Internal Architecture Proposal
**Scope:** Authorized red team simulation against production-equivalent environments
**Model:** Organization provides credentials and scope — Sentinel AI replicates the attack surface, simulates adversary behavior, and reports findings.

> **Legal basis:** All simulation runs under a signed Rules of Engagement (RoE) agreement.
> Sentinel AI never touches production systems directly. It builds a replica environment
> and attacks that. Real credentials are used only to enumerate scope — never exploited live.

---

## 1. The Problem We're Solving

When Netflix, M-Pesa, or Visa want to know:
- *"Can an attacker get from our public API to our card processing backend?"*
- *"What happens if our Log4j dependency is exploited in the auth service?"*
- *"Does our WAF catch this SQLi variant before it hits the DB?"*

Traditional pen tests answer these questions manually, slowly, and expensively — once a year. Sentinel AI answers them continuously, at scale, against a live replica of their actual infrastructure.

---

## 2. How It Works — High Level

```
Organization provides:               Sentinel AI does:
┌─────────────────────┐             ┌──────────────────────────────────────┐
│ • API credentials   │────────────▶│ 1. ENUMERATE  — map all assets       │
│ • Cloud IAM role    │             │ 2. CLONE      — replica environment   │
│ • Network CIDR      │             │ 3. SIMULATE   — attack the clone      │
│ • Scope document    │             │ 4. REPORT     — findings + AI triage  │
│ • RoE agreement     │             └──────────────────────────────────────┘
└─────────────────────┘
```

---

## 3. Architecture

### 3.1 Phase 1 — Asset Discovery & Enumeration

When an organization connects their cloud account, Sentinel AI enumerates:

**AWS Integration**
```
Credentials: IAM Role (read-only) via AssumeRole or OIDC
Enumerates:
  - EC2 instances (region, VPC, SG, AMI, running services)
  - RDS databases (engine, version, publicly accessible?)
  - S3 buckets (ACL, versioning, public access block)
  - Lambda functions (runtime, env vars scan for secrets)
  - EKS clusters (node groups, RBAC configs)
  - API Gateway endpoints (methods, auth type)
  - CloudTrail (audit gaps)
  - SecurityHub findings (existing CVEs)
```

**GCP Integration** *(already built in `backend/src/integrations/gcp/`)*
```
Credentials: Service Account JSON (viewer role)
Enumerates:
  - Compute VMs → synced to assets table
  - Cloud SQL, GKE, Cloud Functions
  - Security Command Center findings
  - Cloud Logging for auth/admin events
```

**Azure Integration** *(to build)*
```
Credentials: Service Principal (Reader role)
Enumerates:
  - Virtual Machines, AKS, App Services
  - Azure SQL, Cosmos DB
  - Microsoft Defender for Cloud alerts
```

**API Surface (e.g. M-Pesa Daraja, Netflix API, Visa Developer)**
```
Credentials: API key or OAuth2 client_credentials token (read scope only)
Enumerates:
  - All API endpoints via OpenAPI spec or crawling
  - Auth mechanisms (API key, JWT, mTLS, OAuth)
  - Rate limiting headers
  - Response headers (CORS, CSP, HSTS, X-Frame-Options)
  - Error message verbosity (stack traces, version disclosure)
```

---

### 3.2 Phase 2 — Infrastructure Cloning

Sentinel AI does NOT attack the real system. It builds a **production-equivalent replica**:

```
Real Infrastructure                 Sentinel AI Replica (Docker / K8s)
──────────────────                  ──────────────────────────────────
Netflix Auth Service    ──clone──▶  node:18 + same deps + same config
  (Node.js 18, express             (pulled from SBoM or Dockerfile)
   Log4j in Java sidecar)
                        ──clone──▶  log4j-vulnerable-app:2.14.1
                                    (same version as production)

M-Pesa API Gateway      ──clone──▶  nginx:1.18 + PHP 7.4 (from job ads
  (Nginx + PHP backend)            / Shodan headers / disclosed version)

Visa Payment Processor  ──clone──▶  Java 11 + Spring Boot 2.6.x
  (Spring Boot + Tomcat)           (from CVE advisories + version headers)
```

**Clone sources (all passive / non-invasive):**
| Source | What it reveals |
|---|---|
| `X-Powered-By` response header | Framework + version |
| `Server:` header | Web server version |
| GitHub / job postings | Tech stack, dependencies |
| Shodan / Censys | Open ports, TLS cert, banner |
| NPM/Maven SBoM (if provided) | Exact dependency tree |
| Docker Hub (public images) | Base image layers |
| CVE advisories naming the org | Specific versions |

---

### 3.3 Phase 3 — Attack Simulation

Against the cloned replica, Sentinel AI runs the full attack pipeline:

```
┌─────────────────────────────────────────────────────────┐
│                  ATTACK SIMULATION PIPELINE              │
│                                                         │
│  CVE Intel         Attack Graph        Simulation       │
│  ──────────        ────────────        ──────────       │
│  NVD lookup   ──▶  Build graph    ──▶  Select module    │
│  EPSS score        (MITRE ATT&CK)      Run sandbox      │
│  KEV check         Kill chain          Log result       │
│  VulDB exploit     Blast radius        Store in DB      │
│                                                         │
│  AI Layer                                               │
│  ────────                                               │
│  Risk reasoning ──▶ Patch suggestion ──▶ Report         │
└─────────────────────────────────────────────────────────┘
```

**Simulation modules targeting real CVE patterns:**

| Target | CVE | Attack Vector | Module |
|---|---|---|---|
| Netflix API (Java sidecar) | CVE-2021-44228 | JNDI in User-Agent | `rce-log4shell` |
| Netflix Spring service | CVE-2022-22965 | ClassLoader binding | `rce-spring4shell` |
| M-Pesa PHP gateway | CWE-89 | SQLi in payment params | `web-sqli-basic` |
| M-Pesa login | CWE-307 | Credential stuffing | `auth-bruteforce` |
| Visa web portal | CWE-79 | Stored XSS in cardholder name | `web-xss-reflected` |
| Visa API | CWE-918 | SSRF to internal payment bus | `web-ssrf-probe` |
| Any Node.js service | CVE-2021-23337 | Prototype pollution | (to build) |
| Any npm dependency | CWE-1035 | Supply chain vuln | `sca-dependency-check` |

---

### 3.4 Phase 4 — Reporting

Sentinel AI generates three report layers automatically:

1. **Technical report** — every finding with CVE, CVSS, exploit method, affected component, reproduction steps
2. **Risk-prioritized summary** — AI-ranked by blast radius, likelihood, and business impact
3. **Executive report** — board-ready: financial exposure estimate, compliance gaps, remediation ROI

---

## 4. Proposal for Netflix, M-Pesa, Visa

### What the client provides (Scope Package)

```yaml
# scope.yaml — client fills this in
organization: "M-Pesa (Safaricom)"
engagement_type: "authorized_red_team"
roe_signed: true
roe_document: "s3://sentinelai-roe/mpesa-2026-03.pdf"

credentials:
  daraja_api:
    consumer_key: "xxxx"
    consumer_secret: "xxxx"
    environment: "sandbox"        # never production direct
    scope: "read"

  aws_role_arn: "arn:aws:iam::123456789:role/SentinelAIReadOnly"
  aws_regions: ["af-south-1", "eu-west-1"]

scope:
  domains:
    - "api.safaricom.co.ke"
    - "*.mpesa.safaricom.co.ke"
  ip_ranges:
    - "196.201.214.0/24"
  exclude:
    - "production-db.internal"     # always excluded
    - "*.payment-processor.mpesa"  # client can exclude anything

out_of_scope:
  - "Any live transaction processing"
  - "Customer PII databases"
  - "Core banking systems"
```

### What Sentinel AI delivers

```
Week 1 — Discovery & Clone
  ├── Full asset inventory (all services, versions, CVE exposure)
  ├── Attack graph (which paths lead to critical assets)
  └── Clone environment standing up

Week 2 — Simulation Runs
  ├── Automated CVE simulation (all matching modules)
  ├── Manual red team scenarios (AI-suggested attack chains)
  └── Results stored in real-time dashboard

Week 3 — Reports & Remediation
  ├── Technical findings report (per CVE, CVSS, PoC)
  ├── Executive summary (risk score, financial exposure)
  └── Patch recommendations (AI-generated, specific to their codebase)
```

---

## 5. Specific Scenarios

### Netflix
```
Attack surface:
  - Public API: api.netflix.com (REST + GraphQL)
  - CDN: *.nflxvideo.net
  - Auth service: login.netflix.com
  - Microservices: Java (Spring Boot), Node.js, Python

Sentinel AI simulates:
  1. Log4Shell in Java auth sidecar via User-Agent header
  2. Spring4Shell via Spring MVC form binding
  3. JWT algorithm confusion (none/RS256→HS256 swap)
  4. GraphQL introspection → data exfiltration chain
  5. SCA: Dependabot-equivalent scan of Node.js deps

Clone method:
  - Shodan shows Netflix uses Java 11 + nginx/1.19
  - Job postings confirm Spring Boot 2.6.x
  - Public CVE advisories name specific versions
```

### M-Pesa (Safaricom)
```
Attack surface:
  - Daraja API: sandbox.safaricom.co.ke (OAuth2 + REST)
  - USSD backend: PHP + MySQL (industry standard for USSD)
  - Web portal: PHP/Apache (from response headers)
  - Mobile backend: Java (from Android APK analysis)

Sentinel AI simulates:
  1. SQLi in STK Push callback URL parameter
  2. Auth bruteforce on Daraja OAuth endpoint
  3. SSRF via callback URL to internal payment bus
  4. XML injection in SOAP-based core banking API
  5. IDOR on transaction reference number (sequential IDs)

Clone method:
  - Daraja sandbox is publicly accessible (no clone needed for API tests)
  - USSD backend cloned as DVWA-equivalent PHP app
  - Core banking simulated as mock SOAP endpoint
```

### Visa
```
Attack surface:
  - Developer API: developer.visa.com (REST + mTLS)
  - Cybersource gateway: secureacceptance.cybersource.com
  - 3DS2 authentication service
  - Cardholder web portal: PHP/Java

Sentinel AI simulates:
  1. mTLS certificate bypass via header injection
  2. XSS in cardholder name field → session hijack
  3. SSRF to internal payment authorization bus
  4. Race condition on concurrent transaction requests
  5. PCI-DSS scope creep: which services store PANs unencrypted

Clone method:
  - Visa Developer sandbox is public (test credentials available)
  - Cybersource test environment provided by client
  - 3DS2 simulated via stripe-mock equivalent
```

---

## 6. Technical Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SENTINEL AI PLATFORM                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  ENUMERATION │  │    CLONE     │  │    SIMULATION         │  │
│  │  ENGINE      │  │   FACTORY    │  │    ORCHESTRATOR       │  │
│  │              │  │              │  │                       │  │
│  │  AWS SDK     │  │  Dockerfile  │  │  Simulation Queue     │  │
│  │  GCP Client  │  │  generator   │  │  Sandbox Manager      │  │
│  │  Azure SDK   │  │              │  │  Module Catalog       │  │
│  │  Shodan API  │  │  docker-     │  │  Result Collector     │  │
│  │  API crawler │  │  compose     │  │                       │  │
│  │              │  │  builder     │  │  MAX_CONCURRENT: 10   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                       │              │
│         ▼                 ▼                       ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    SUPABASE DATABASE                     │    │
│  │   assets  |  vulnerabilities  |  threat_feed            │    │
│  │   simulation_queue  |  exploit_results  |  audit_log    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     AI LAYER (Claude)                    │    │
│  │   Risk Reasoning  |  Attack Modeling  |  Patch Gen      │    │
│  │   Compliance Map  |  Executive Report                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. New Components to Build

The following do not exist yet and need to be built for live-infra simulation:

### 7.1 Enumeration Engine (`backend/src/integrations/aws/`)
- AWS SDK: list EC2, RDS, S3, Lambda, EKS, API Gateway
- Passive recon: Shodan, Censys, crt.sh (TLS certs), SecurityTrails (DNS)
- APK/IPA analysis for mobile backend discovery (M-Pesa Android)

### 7.2 Clone Factory (`backend/src/services/clone-factory.ts`)
- Takes enumeration results → generates a `docker-compose.clone.yml`
- Selects closest public image to match detected versions
- Configures ports, networks, and environment to mirror real app behavior

### 7.3 Engagement Manager (`backend/src/services/engagement.ts`)
- Stores RoE documents, scope definitions, engagement periods
- Enforces scope — blocks any simulation target not in approved list
- Audit trail: every action signed with engagement ID

### 7.4 Scope Enforcer (middleware)
- Every simulation request checked against `engagement.scope`
- Real production IPs/domains always blocked at the network layer
- CIDR watchlist: never allow 0.0.0.0/0 or public IPs as targets

### 7.5 New Exploit Modules
| Module | Target | CVE |
|---|---|---|
| `jwt-confusion` | Any JWT auth | CVE-2022-21449 |
| `xml-injection` | SOAP APIs | CWE-611 |
| `graphql-introspection` | GraphQL APIs | CWE-200 |
| `idor-sequential` | REST APIs | CWE-639 |
| `race-condition` | Payment endpoints | CWE-362 |
| `prototype-pollution` | Node.js services | CVE-2021-23337 |
| `subdomain-takeover` | DNS/CDN | CWE-350 |
| `sca-npm` | Node.js deps | CVE by package |
| `sca-maven` | Java deps | CVE by artifact |
| `ussd-injection` | USSD gateways | CWE-77 |

---

## 8. What This Is NOT

To be explicit about scope and legality:

| This IS | This IS NOT |
|---|---|
| Attacking a clone of Netflix's tech stack | Attacking netflix.com |
| Simulating Log4Shell against our replica | Exploiting live Netflix servers |
| Using M-Pesa sandbox credentials | Touching live M-Pesa transactions |
| Enumerating assets with read-only IAM role | Modifying or deleting cloud resources |
| Generating a report of vulnerabilities | Exfiltrating real customer data |
| Authorized engagement with signed RoE | Unauthorized access (illegal) |

---

## 9. Legal & Compliance Requirements

Before any live-infra engagement:

1. **Signed Rules of Engagement (RoE)** — defines scope, timeline, emergency contacts, halt conditions
2. **Penetration Testing Agreement** — liability, data handling, disclosure timeline
3. **NDA** — between Sentinel AI and the client organization
4. **Regulatory check** — PCI-DSS, SWIFT CSP, CBK (Central Bank of Kenya for M-Pesa) all require pen test authorization documentation
5. **Bug Bounty alignment** — if the org has a bug bounty, confirm this engagement is separate and doesn't conflict

---

## 10. Revenue Model Proposal

| Tier | Offering | Price (estimate) |
|---|---|---|
| **Starter** | API surface scan + automated CVE report | $2,000 / engagement |
| **Standard** | Full enumeration + clone + simulation + report | $15,000 / engagement |
| **Enterprise** | Continuous monitoring + monthly red team cycles | $50,000 / year |
| **Custom** | Netflix / Visa scale — dedicated cluster, custom modules | Negotiated |
