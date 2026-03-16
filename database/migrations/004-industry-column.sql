-- =============================================================
-- Sentinel AI — Migration 004: Industry Column + Governance Seed Data
-- Adds `industry` column to all module tables so data can be
-- scoped per industry context (logistics, fintech, healthcare, ecommerce).
-- =============================================================

-- Add industry column to all module tables
ALTER TABLE incidents          ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE risks               ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE devsecops_pipelines ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE cloud_findings      ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE code_findings       ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE container_scans     ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE dark_web_findings   ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE edr_alerts          ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE malware_samples     ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE zero_days           ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE phishing_campaigns  ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE red_team_campaigns  ADD COLUMN IF NOT EXISTS industry TEXT;

-- Indexes for industry-filtered queries
CREATE INDEX IF NOT EXISTS idx_incidents_industry          ON incidents(industry);
CREATE INDEX IF NOT EXISTS idx_risks_industry               ON risks(industry);
CREATE INDEX IF NOT EXISTS idx_devsecops_industry           ON devsecops_pipelines(industry);
CREATE INDEX IF NOT EXISTS idx_cloud_findings_industry      ON cloud_findings(industry);
CREATE INDEX IF NOT EXISTS idx_dark_web_industry            ON dark_web_findings(industry);
CREATE INDEX IF NOT EXISTS idx_edr_alerts_industry          ON edr_alerts(industry);
CREATE INDEX IF NOT EXISTS idx_zero_days_industry           ON zero_days(industry);
CREATE INDEX IF NOT EXISTS idx_phishing_industry            ON phishing_campaigns(industry);
