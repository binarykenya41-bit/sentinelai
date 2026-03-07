-- =============================================================
-- Sentinel AI — Full Database Schema
-- Store: Supabase (PostgreSQL)
-- Run once on a fresh Supabase project via the SQL editor
-- or: psql $DATABASE_URL -f database/schema.sql
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- organizations
-- =============================================================
CREATE TABLE IF NOT EXISTS organizations (
  org_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  plan_tier            TEXT CHECK (plan_tier IN ('smb', 'mid-market', 'enterprise')),
  compliance_frameworks TEXT[],
  api_keys             TEXT[],
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- assets
-- Live inventory of all infrastructure nodes (digital twin)
-- =============================================================
CREATE TABLE IF NOT EXISTS assets (
  asset_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  type          TEXT CHECK (type IN ('server', 'container', 'service', 'database', 'cloud_resource', 'network_device', 'endpoint')),
  hostname      TEXT,
  ip            TEXT[],
  tags          TEXT[],
  criticality   TEXT CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  -- Digital twin node attributes
  os_version    TEXT,
  installed_apps JSONB,        -- [{ name, version }]
  open_ports    INT[],
  patch_status  TEXT CHECK (patch_status IN ('current', 'behind', 'unknown')),
  last_patch_date DATE,
  -- Integration source
  source        TEXT,          -- e.g. 'aws', 'ivanti', 'jamf', 'manual'
  external_id   TEXT,          -- ID in the external system
  last_scan_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- =============================================================
-- vulnerabilities
-- =============================================================
CREATE TABLE IF NOT EXISTS vulnerabilities (
  vuln_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id             TEXT NOT NULL,
  cvss_v3            NUMERIC(4,1),
  cwe_ids            TEXT[],
  mitre_techniques   TEXT[],
  epss_score         NUMERIC(5,4),
  kev_status         BOOLEAN DEFAULT FALSE,
  affected_assets    UUID[],
  blast_radius       TEXT,
  scan_source        TEXT,      -- 'nessus', 'trivy', 'grype', 'manual', etc.
  detection_at       TIMESTAMPTZ DEFAULT NOW(),
  remediation_status TEXT CHECK (remediation_status IN ('open', 'in_progress', 'patched', 'verified'))
);

CREATE INDEX IF NOT EXISTS idx_vuln_cve ON vulnerabilities(cve_id);
CREATE INDEX IF NOT EXISTS idx_vuln_status ON vulnerabilities(remediation_status);
CREATE INDEX IF NOT EXISTS idx_vuln_kev ON vulnerabilities(kev_status);

-- =============================================================
-- exploit_results
-- Results from sandboxed exploit simulations
-- =============================================================
CREATE TABLE IF NOT EXISTS exploit_results (
  result_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuln_id        UUID REFERENCES vulnerabilities(vuln_id) ON DELETE CASCADE,
  sandbox_id     TEXT,
  success        BOOLEAN,
  confidence     NUMERIC(3,2),    -- 0.00–1.00
  technique      TEXT,            -- MITRE ATT&CK technique ID (e.g. T1190)
  payload_hash   TEXT,            -- SHA-256 of payload
  output_log_ref TEXT,            -- S3 / Supabase Storage path
  duration_ms    INT,
  executed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exploit_vuln ON exploit_results(vuln_id);

-- =============================================================
-- patch_records
-- AI-generated patches and their CI/CD pipeline state
-- =============================================================
CREATE TABLE IF NOT EXISTS patch_records (
  patch_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuln_id       UUID REFERENCES vulnerabilities(vuln_id) ON DELETE CASCADE,
  branch_name   TEXT,      -- e.g. sentinel/fix/{cve}/{asset}/{ts}
  commit_sha    TEXT,
  pr_url        TEXT,
  ci_status     TEXT CHECK (ci_status IN ('pending', 'running', 'passed', 'failed')),
  resim_result  TEXT CHECK (resim_result IN ('pending', 'exploit_failed', 'exploit_succeeded')),
  merge_status  TEXT CHECK (merge_status IN ('open', 'approved', 'merged', 'blocked')),
  authored_by   TEXT DEFAULT 'sentinel-ai',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patch_vuln ON patch_records(vuln_id);
CREATE INDEX IF NOT EXISTS idx_patch_ci ON patch_records(ci_status);

-- =============================================================
-- compliance_reports
-- =============================================================
CREATE TABLE IF NOT EXISTS compliance_reports (
  report_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  framework       TEXT CHECK (framework IN ('iso27001', 'soc2', 'pcidss')),
  period_start    DATE,
  period_end      DATE,
  controls_mapped JSONB,       -- { controlId: { status, evidence[] } }
  evidence_refs   TEXT[],
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  pdf_ref         TEXT         -- S3 / Supabase Storage path
);

CREATE INDEX IF NOT EXISTS idx_compliance_org ON compliance_reports(org_id);

-- =============================================================
-- audit_log  (immutable — no UPDATE or DELETE allowed)
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor         TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  payload       JSONB,
  hmac          TEXT,           -- HMAC chain for tamper detection
  logged_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce append-only via Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow INSERT for authenticated service role
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (true);

-- Block all updates and deletes (no policy = deny)

-- =============================================================
-- integrations
-- Stores connection config for external platforms
-- =============================================================
CREATE TABLE IF NOT EXISTS integrations (
  integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  category       TEXT NOT NULL,   -- 'codebase', 'network', 'devops', 'cloud', 'endpoint', 'monitoring', 'database'
  tool_id        TEXT NOT NULL,   -- e.g. 'github', 'aws', 'splunk'
  name           TEXT NOT NULL,
  status         TEXT CHECK (status IN ('connected', 'disconnected', 'pending', 'error')) DEFAULT 'disconnected',
  config         JSONB,           -- Encrypted/masked connection settings
  last_sync_at   TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_integrations_category ON integrations(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_org_tool ON integrations(org_id, tool_id);

-- =============================================================
-- infrastructure_nodes
-- Manual asset entries from the infrastructure input form
-- =============================================================
CREATE TABLE IF NOT EXISTS infrastructure_nodes (
  node_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  -- General
  name           TEXT NOT NULL,
  type           TEXT CHECK (type IN ('cloud', 'network_device', 'endpoint', 'application')),
  environment    TEXT CHECK (environment IN ('production', 'staging', 'development')),
  description    TEXT,
  -- Network
  ip_address     TEXT,
  hostname       TEXT,
  mac_address    TEXT,
  network_segment TEXT,
  open_ports     TEXT,           -- comma-separated
  protocols      TEXT[],
  -- System
  os_name        TEXT,
  os_version     TEXT,
  installed_apps JSONB,
  container_platform TEXT,
  -- Security
  firewall_present BOOLEAN,
  endpoint_agent TEXT,
  antivirus_edr  TEXT,
  auth_type      TEXT,
  encryption_protocols TEXT[],
  -- Patch & Vuln
  patch_status   TEXT CHECK (patch_status IN ('current', 'behind', 'unknown')),
  last_patch_date DATE,
  known_cves     TEXT[],
  cvss_scores    JSONB,          -- { cve_id: score }
  -- Integration
  external_tool  TEXT,
  api_endpoint   TEXT,
  log_source     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infra_nodes_org ON infrastructure_nodes(org_id);

-- =============================================================
-- custom_integration_categories
-- User-defined integration categories with platform mapping
-- =============================================================
CREATE TABLE IF NOT EXISTS custom_integration_categories (
  category_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  icon_key       TEXT DEFAULT 'plug',
  platform_url   TEXT,
  platform_type  TEXT CHECK (platform_type IN ('rest_api', 'webhook', 'agent', 'syslog', 'sdk', 'other')),
  auth_type      TEXT,
  -- JSON schema for custom config fields: [{ key, label, type, placeholder, required }]
  config_schema  JSONB DEFAULT '[]',
  -- Field mapping: { source_field: sentinel_field }
  field_mapping  JSONB DEFAULT '{}',
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_org ON custom_integration_categories(org_id);

-- =============================================================
-- threat_feed  (see migrations/002-threat-feed.sql for full detail)
-- =============================================================
CREATE TABLE IF NOT EXISTS threat_feed (
  feed_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id            TEXT NOT NULL,
  sync_source       TEXT[],
  description       TEXT,
  cvss_v3           NUMERIC(4,1),
  cvss_v4           NUMERIC(4,1),
  cvss_vector       TEXT,
  cwe_ids           TEXT[],
  published_at      TIMESTAMPTZ,
  last_modified_at  TIMESTAMPTZ,
  vuln_status       TEXT,
  epss_score        NUMERIC(5,4),
  epss_percentile   NUMERIC(5,4),
  kev_status        BOOLEAN DEFAULT FALSE,
  kev_date_added    DATE,
  kev_due_date      DATE,
  kev_ransomware    BOOLEAN DEFAULT FALSE,
  vuldb_id          INT,
  vuldb_risk_score  INT,
  exploit_available BOOLEAN DEFAULT FALSE,
  exploit_maturity  TEXT CHECK (exploit_maturity IN ('unproven','poc','functional','weaponized')),
  exploit_price     TEXT,
  patch_available   BOOLEAN DEFAULT FALSE,
  countermeasure    TEXT,
  vendor            TEXT,
  product           TEXT,
  vuln_class        TEXT,
  mitre_techniques  TEXT[],
  priority_score    INT DEFAULT 0,
  nvd_raw           JSONB,
  vuldb_raw         JSONB,
  simulation_queued BOOLEAN DEFAULT FALSE,
  linked_vuln_id    UUID REFERENCES vulnerabilities(vuln_id) ON DELETE SET NULL,
  synced_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cve_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_cve      ON threat_feed(cve_id);
CREATE INDEX IF NOT EXISTS idx_feed_cvss     ON threat_feed(cvss_v3 DESC);
CREATE INDEX IF NOT EXISTS idx_feed_priority ON threat_feed(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_kev      ON threat_feed(kev_status);
CREATE INDEX IF NOT EXISTS idx_feed_exploit  ON threat_feed(exploit_available);
CREATE INDEX IF NOT EXISTS idx_feed_synced   ON threat_feed(synced_at DESC);

-- =============================================================
-- simulation_queue
-- =============================================================
CREATE TABLE IF NOT EXISTS simulation_queue (
  job_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuln_id       UUID REFERENCES vulnerabilities(vuln_id) ON DELETE CASCADE,
  cve_id        TEXT NOT NULL,
  module_id     TEXT NOT NULL,
  target_host   TEXT NOT NULL,
  target_port   INT  DEFAULT 80,
  priority      INT  DEFAULT 50,
  status        TEXT CHECK (status IN ('pending','running','completed','failed','skipped')) DEFAULT 'pending',
  result_id     UUID REFERENCES exploit_results(result_id) ON DELETE SET NULL,
  sandbox_id    TEXT,
  error_msg     TEXT,
  triggered_by  TEXT DEFAULT 'auto-scheduler',
  dry_run       BOOLEAN DEFAULT FALSE,
  scheduled_at  TIMESTAMPTZ DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_simq_status ON simulation_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_simq_vuln   ON simulation_queue(vuln_id);
CREATE INDEX IF NOT EXISTS idx_simq_cve    ON simulation_queue(cve_id);

-- =============================================================
-- sync_jobs
-- =============================================================
CREATE TABLE IF NOT EXISTS sync_jobs (
  job_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN ('cve_nvd','cve_vuldb','kev','full')),
  status        TEXT NOT NULL CHECK (status IN ('running','completed','failed')),
  cves_fetched  INT DEFAULT 0,
  cves_new      INT DEFAULT 0,
  cves_updated  INT DEFAULT 0,
  sims_queued   INT DEFAULT 0,
  error_msg     TEXT,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  duration_ms   INT
);

CREATE INDEX IF NOT EXISTS idx_syncjob_type  ON sync_jobs(type);
CREATE INDEX IF NOT EXISTS idx_syncjob_start ON sync_jobs(started_at DESC);
