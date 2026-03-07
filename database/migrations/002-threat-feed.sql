-- =============================================================
-- Migration 002 — Threat Feed, Simulation Queue, Sync Jobs
-- Run: psql $DATABASE_URL -f database/migrations/002-threat-feed.sql
-- =============================================================

-- =============================================================
-- threat_feed
-- Cached enriched CVE records pulled from NVD + VulDB + KEV.
-- Separate from vulnerabilities (which are asset-linked findings).
-- This is the "live threat intelligence inbox".
-- =============================================================
CREATE TABLE IF NOT EXISTS threat_feed (
  feed_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id            TEXT NOT NULL,
  -- Source tracking
  sync_source       TEXT[],                 -- ['nvd', 'vuldb', 'kev']
  -- Core CVE data
  description       TEXT,
  cvss_v3           NUMERIC(4,1),
  cvss_v4           NUMERIC(4,1),
  cvss_vector       TEXT,
  cwe_ids           TEXT[],
  published_at      TIMESTAMPTZ,
  last_modified_at  TIMESTAMPTZ,
  vuln_status       TEXT,
  -- EPSS
  epss_score        NUMERIC(5,4),
  epss_percentile   NUMERIC(5,4),
  -- KEV
  kev_status        BOOLEAN DEFAULT FALSE,
  kev_date_added    DATE,
  kev_due_date      DATE,
  kev_ransomware    BOOLEAN DEFAULT FALSE,
  -- VulDB threat intel
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
  -- MITRE ATT&CK
  mitre_techniques  TEXT[],
  -- Composite priority (0-100)
  priority_score    INT DEFAULT 0,
  -- Raw JSON blobs for full data
  nvd_raw           JSONB,
  vuldb_raw         JSONB,
  -- Processing state
  simulation_queued BOOLEAN DEFAULT FALSE,
  linked_vuln_id    UUID REFERENCES vulnerabilities(vuln_id) ON DELETE SET NULL,
  -- Timestamps
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
-- Ordered queue of pending/running/completed simulation jobs.
-- Auto-simulation service reads this table to dispatch sandboxes.
-- =============================================================
CREATE TABLE IF NOT EXISTS simulation_queue (
  job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- What to simulate
  vuln_id         UUID REFERENCES vulnerabilities(vuln_id) ON DELETE CASCADE,
  cve_id          TEXT NOT NULL,
  module_id       TEXT NOT NULL,              -- matches ExploitModule.module_id
  target_host     TEXT NOT NULL,
  target_port     INT  DEFAULT 80,
  -- Ordering
  priority        INT  DEFAULT 50,            -- 0=highest, 100=lowest
  -- Status lifecycle
  status          TEXT CHECK (status IN ('pending','running','completed','failed','skipped')) DEFAULT 'pending',
  -- Results
  result_id       UUID REFERENCES exploit_results(result_id) ON DELETE SET NULL,
  sandbox_id      TEXT,
  error_msg       TEXT,
  -- Who/what triggered this
  triggered_by    TEXT DEFAULT 'auto-scheduler', -- 'auto-scheduler' | 'manual:<user>'
  dry_run         BOOLEAN DEFAULT FALSE,
  -- Timing
  scheduled_at    TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_simq_status   ON simulation_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_simq_vuln     ON simulation_queue(vuln_id);
CREATE INDEX IF NOT EXISTS idx_simq_cve      ON simulation_queue(cve_id);
CREATE INDEX IF NOT EXISTS idx_simq_sched    ON simulation_queue(scheduled_at DESC);

-- =============================================================
-- sync_jobs
-- Audit trail of every scheduled CVE / KEV / VulDB sync run.
-- =============================================================
CREATE TABLE IF NOT EXISTS sync_jobs (
  job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('cve_nvd','cve_vuldb','kev','full')),
  status          TEXT NOT NULL CHECK (status IN ('running','completed','failed')),
  -- Stats
  cves_fetched    INT DEFAULT 0,
  cves_new        INT DEFAULT 0,
  cves_updated    INT DEFAULT 0,
  sims_queued     INT DEFAULT 0,
  -- Error details
  error_msg       TEXT,
  -- Timing
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INT
);

CREATE INDEX IF NOT EXISTS idx_syncjob_type   ON sync_jobs(type);
CREATE INDEX IF NOT EXISTS idx_syncjob_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_syncjob_start  ON sync_jobs(started_at DESC);
