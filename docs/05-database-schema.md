# 5. Database Schema

## Overview

| Store | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Primary relational data store |
| **Neo4j** | Attack graph topology |
| **Redis** | Caching (threat intel, session, graph traversal) |
| **S3 / Supabase Storage** | Binary artifacts (exploit logs, patch diffs, PDFs) |

---

## PostgreSQL Tables (Supabase)

### organizations
```sql
CREATE TABLE organizations (
  org_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  plan_tier     TEXT CHECK (plan_tier IN ('smb', 'mid-market', 'enterprise')),
  compliance_frameworks TEXT[],
  api_keys      TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### assets
```sql
CREATE TABLE assets (
  asset_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(org_id),
  type          TEXT CHECK (type IN ('server', 'container', 'service', 'database', 'cloud_resource')),
  hostname      TEXT,
  ip            TEXT[],
  tags          TEXT[],
  criticality   TEXT CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  last_scan_at  TIMESTAMPTZ
);
```

### vulnerabilities
```sql
CREATE TABLE vulnerabilities (
  vuln_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id            TEXT NOT NULL,
  cvss_v3           NUMERIC(4,1),
  cwe_ids           TEXT[],
  mitre_techniques  TEXT[],
  epss_score        NUMERIC(5,4),
  kev_status        BOOLEAN DEFAULT FALSE,
  affected_assets   UUID[],
  blast_radius      TEXT,
  scan_source       TEXT,
  detection_at      TIMESTAMPTZ DEFAULT NOW(),
  remediation_status TEXT CHECK (remediation_status IN ('open','in_progress','patched','verified'))
);
```

### exploit_results
```sql
CREATE TABLE exploit_results (
  result_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuln_id       UUID REFERENCES vulnerabilities(vuln_id),
  sandbox_id    TEXT,
  success       BOOLEAN,
  confidence    NUMERIC(3,2),
  technique     TEXT,        -- ATT&CK technique ID
  payload_hash  TEXT,        -- SHA-256
  output_log_ref TEXT,       -- S3 / Storage path
  duration_ms   INT,
  executed_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### patch_records
```sql
CREATE TABLE patch_records (
  patch_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuln_id       UUID REFERENCES vulnerabilities(vuln_id),
  branch_name   TEXT,        -- sentinel/fix/{cve}/{asset}/{ts}
  commit_sha    TEXT,
  pr_url        TEXT,
  ci_status     TEXT CHECK (ci_status IN ('pending','running','passed','failed')),
  resim_result  TEXT CHECK (resim_result IN ('pending','exploit_failed','exploit_succeeded')),
  merge_status  TEXT CHECK (merge_status IN ('open','approved','merged','blocked')),
  authored_by   TEXT DEFAULT 'sentinel-ai',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### compliance_reports
```sql
CREATE TABLE compliance_reports (
  report_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(org_id),
  framework       TEXT CHECK (framework IN ('iso27001','soc2','pcidss')),
  period_start    DATE,
  period_end      DATE,
  controls_mapped JSONB,
  evidence_refs   TEXT[],
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  pdf_ref         TEXT        -- S3 / Storage path
);
```

### audit_log (immutable)
```sql
CREATE TABLE audit_log (
  log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor         TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  payload       JSONB,
  hmac          TEXT,        -- HMAC chain for integrity
  logged_at     TIMESTAMPTZ DEFAULT NOW()
);
-- Append-only enforced via RLS policy (no UPDATE/DELETE)
```

---

## Redis Cache Keys

| Key Pattern | TTL | Content |
|---|---|---|
| `vuln:{cve_id}` | 1h | Enriched VulnRecord |
| `asset:{asset_id}` | 5min | Asset inventory |
| `graph:path:{from}:{to}` | 30s | Shortest path result |
| `epss:{cve_id}` | 24h | EPSS probability |
| `session:{user_id}` | 15min | Auth session |

---

## Supabase Setup (database/ folder)

The `database/` folder will contain:

```
database/
├── client.ts          Supabase JS client (uses .env credentials)
├── schema.sql         Full SQL schema (run once on new project)
├── migrations/        Incremental SQL migrations
├── seeds/             Sample data for development
└── types.ts           Generated TypeScript types (supabase gen types)
```
