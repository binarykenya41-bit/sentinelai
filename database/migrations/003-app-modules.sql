-- =============================================================
-- Sentinel AI — App Modules Migration
-- Tables: incidents, risks, devsecops, cloud, code scanning,
--         containers, malware, zero-day, red-team, EDR, dark-web,
--         phishing, org settings, infrastructure nodes seed
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── incidents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  incident_id   TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  category      TEXT,
  status        TEXT CHECK (status IN ('Investigating','Containment','Analysis','Resolved')) DEFAULT 'Investigating',
  assigned_to   TEXT,
  affected_assets TEXT[],
  description   TEXT,
  progress      INT DEFAULT 0,
  mttr_hours    NUMERIC(5,2),
  sla_deadline  TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   TEXT REFERENCES incidents(incident_id) ON DELETE CASCADE,
  time          TIMESTAMPTZ DEFAULT NOW(),
  event         TEXT NOT NULL,
  event_type    TEXT CHECK (event_type IN ('alert','action','intel','notify'))
);

CREATE TABLE IF NOT EXISTS incident_playbooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  steps         INT DEFAULT 0,
  avg_time_hours NUMERIC(4,2),
  status        TEXT CHECK (status IN ('Active','Ready')),
  last_used     TIMESTAMPTZ
);

-- ── risks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risks (
  risk_id       TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT,
  likelihood    INT CHECK (likelihood BETWEEN 1 AND 5),
  impact        INT CHECK (impact BETWEEN 1 AND 5),
  risk_score    INT,
  status        TEXT CHECK (status IN ('Open','In Progress','Mitigated','Accepted')) DEFAULT 'Open',
  owner         TEXT,
  mitigation    TEXT,
  review_date   DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── devsecops ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devsecops_pipelines (
  pipeline_id   TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  repo          TEXT,
  branch        TEXT,
  status        TEXT CHECK (status IN ('passed','failed','running','skipped')),
  stage         TEXT,
  sbom_findings INT DEFAULT 0,
  secrets_count INT DEFAULT 0,
  sast_issues   INT DEFAULT 0,
  dast_issues   INT DEFAULT 0,
  policy_pass   BOOLEAN,
  run_at        TIMESTAMPTZ,
  duration_ms   INT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sbom_findings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id   TEXT REFERENCES devsecops_pipelines(pipeline_id) ON DELETE CASCADE,
  component     TEXT NOT NULL,
  version       TEXT,
  cve_id        TEXT,
  severity      TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  license       TEXT,
  fix_version   TEXT
);

CREATE TABLE IF NOT EXISTS devsecops_policies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  status        TEXT CHECK (status IN ('Passing','Failing','Warning')),
  failures      INT DEFAULT 0,
  description   TEXT
);

-- ── cloud security (CSPM) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cloud_findings (
  finding_id    TEXT PRIMARY KEY,
  provider      TEXT CHECK (provider IN ('AWS','Azure','GCP','Other')),
  resource_id   TEXT,
  resource_type TEXT,
  rule_id       TEXT,
  title         TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  status        TEXT CHECK (status IN ('Open','In Progress','Resolved','Suppressed')) DEFAULT 'Open',
  region        TEXT,
  account_id    TEXT,
  description   TEXT,
  remediation   TEXT,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── code scanning (SAST/DAST) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS code_findings (
  finding_id    TEXT PRIMARY KEY,
  repo          TEXT NOT NULL,
  tool          TEXT CHECK (tool IN ('semgrep','codeql','trivy','bandit','sonarqube','nikto','zap','other')),
  rule_id       TEXT,
  title         TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  category      TEXT,
  file_path     TEXT,
  line_number   INT,
  status        TEXT CHECK (status IN ('Open','In Progress','Resolved','Suppressed')) DEFAULT 'Open',
  branch        TEXT,
  pr_url        TEXT,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── container security ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS container_scans (
  scan_id         TEXT PRIMARY KEY,
  image           TEXT NOT NULL,
  tag             TEXT,
  registry        TEXT,
  critical_vulns  INT DEFAULT 0,
  high_vulns      INT DEFAULT 0,
  medium_vulns    INT DEFAULT 0,
  low_vulns       INT DEFAULT 0,
  total_vulns     INT DEFAULT 0,
  status          TEXT CHECK (status IN ('Clean','Vulnerable','Critical')) DEFAULT 'Clean',
  policy_pass     BOOLEAN DEFAULT TRUE,
  runtime_alerts  INT DEFAULT 0,
  base_image      TEXT,
  scanned_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── malware analysis ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS malware_samples (
  sample_id       TEXT PRIMARY KEY,
  filename        TEXT NOT NULL,
  hash_sha256     TEXT,
  file_type       TEXT,
  verdict         TEXT CHECK (verdict IN ('Malicious','Suspicious','Clean','Unknown')),
  threat_family   TEXT,
  confidence      INT CHECK (confidence BETWEEN 0 AND 100),
  iocs            JSONB DEFAULT '[]',
  mitre_techniques TEXT[],
  sandbox_env     TEXT,
  analysis_duration_ms INT,
  analyzed_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── zero-day tracker ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zero_days (
  zd_id           TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  cve_id          TEXT,
  affected_product TEXT,
  vendor          TEXT,
  severity        TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  status          TEXT CHECK (status IN ('Unpatched','Partial Mitigation','Patched','Monitoring')),
  epss_score      NUMERIC(5,4),
  exploit_maturity TEXT CHECK (exploit_maturity IN ('unproven','poc','functional','weaponized')),
  description     TEXT,
  behavior_signals JSONB DEFAULT '[]',
  discovered_at   TIMESTAMPTZ,
  patched_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── red team campaigns ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS red_team_campaigns (
  campaign_id     TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  status          TEXT CHECK (status IN ('Active','Completed','Planned','Cancelled')),
  objective       TEXT,
  operator        TEXT,
  target_scope    TEXT[],
  start_date      DATE,
  end_date        DATE,
  kill_chain_stage TEXT,
  findings        INT DEFAULT 0,
  critical_findings INT DEFAULT 0,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── EDR / endpoint security ───────────────────────────────────
CREATE TABLE IF NOT EXISTS edr_alerts (
  alert_id        TEXT PRIMARY KEY,
  endpoint        TEXT NOT NULL,
  hostname        TEXT,
  os              TEXT,
  severity        TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  technique_id    TEXT,
  technique_name  TEXT,
  tactic          TEXT,
  status          TEXT CHECK (status IN ('Active','Investigating','Resolved','False Positive')) DEFAULT 'Active',
  process_name    TEXT,
  description     TEXT,
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── dark web monitor ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dark_web_findings (
  finding_id      TEXT PRIMARY KEY,
  category        TEXT CHECK (category IN ('Credential Leak','Threat Actor','Data Exposure','Exploit Sale','Other')),
  title           TEXT NOT NULL,
  source          TEXT,
  severity        TEXT CHECK (severity IN ('Critical','High','Medium','Low')),
  status          TEXT CHECK (status IN ('New','Investigating','Remediated','Dismissed')) DEFAULT 'New',
  description     TEXT,
  affected_data   TEXT,
  threat_actor    TEXT,
  discovered_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── phishing campaigns ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phishing_campaigns (
  campaign_id       TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  status            TEXT CHECK (status IN ('Active','Completed','Scheduled','Cancelled')),
  target_department TEXT,
  recipients_count  INT DEFAULT 0,
  opened_count      INT DEFAULT 0,
  clicked_count     INT DEFAULT 0,
  submitted_count   INT DEFAULT 0,
  reported_count    INT DEFAULT 0,
  start_date        DATE,
  end_date          DATE,
  template_name     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── org settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
  setting_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        TEXT NOT NULL UNIQUE,
  org_name      TEXT,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- SEED DATA
-- =============================================================

-- incidents
INSERT INTO incidents (incident_id, title, severity, category, status, assigned_to, affected_assets, description, progress, mttr_hours, sla_deadline, created_at) VALUES
  ('inc-001','Ransomware Staging Detected — WORKSTATION-042','Critical','Malware','Investigating','j.smith',ARRAY['WORKSTATION-042','prod-web-01'],'EDR alert triggered on WORKSTATION-042 indicating LockBit 3.0 staging activity. Host isolated, forensic snapshot in progress.',35,NULL,NOW() + INTERVAL '4 hours',NOW() - INTERVAL '2 hours'),
  ('inc-002','Unauthorized DB Access from External IP','High','Unauthorized Access','Containment','a.chen',ARRAY['prod-db-primary'],'External IP 198.51.100.42 accessed production database via exposed management port. Credentials may be compromised.',60,NULL,NOW() + INTERVAL '2 hours',NOW() - INTERVAL '3.5 hours'),
  ('inc-003','DNS Tunneling Detected — k8s-node-07','Medium','C2 Communication','Analysis','m.torres',ARRAY['k8s-node-07'],'Unusual DNS query patterns indicative of tunneling detected. Possible data exfiltration channel.',45,NULL,NOW() + INTERVAL '5 hours',NOW() - INTERVAL '5 hours'),
  ('inc-004','Brute Force SSH — prod-web-01','High','Brute Force','Resolved','r.patel',ARRAY['prod-web-01'],'Sustained SSH brute force from 203.0.113.15. IP blocked at perimeter, no successful logins confirmed.',100,1.8,NULL,NOW() - INTERVAL '7 hours'),
  ('inc-005','Exposed S3 Bucket Data Access','Critical','Data Exposure','Resolved','j.smith',ARRAY['s3-backup-bucket'],'Public S3 bucket misconfiguration allowed unauthenticated reads. 2.3 GB customer data potentially accessed.',100,3.2,NULL,NOW() - INTERVAL '13 hours'),
  ('inc-006','Phishing Credential Harvest — Finance Dept','High','Phishing','Resolved','k.wilson',ARRAY['fin-workstation-12','email-gateway'],'3 Finance users clicked phishing link. Credentials reset, MFA enforced, sessions invalidated.',100,2.1,NULL,NOW() - INTERVAL '30 hours')
ON CONFLICT DO NOTHING;

INSERT INTO incident_timeline (incident_id, time, event, event_type) VALUES
  ('inc-001', NOW() - INTERVAL '2 hours',    'INC-001 created — EDR alert triggered on WORKSTATION-042',     'alert'),
  ('inc-001', NOW() - INTERVAL '114 minutes','Automated containment: endpoint isolated from network',         'action'),
  ('inc-001', NOW() - INTERVAL '108 minutes','Threat Intel match: LockBit 3.0 TTPs confirmed',               'intel'),
  ('inc-001', NOW() - INTERVAL '102 minutes','Forensic snapshot captured (disk + memory)',                    'action'),
  ('inc-001', NOW() - INTERVAL '96 minutes', 'Lateral movement to 3 hosts blocked by network policy',        'action'),
  ('inc-001', NOW() - INTERVAL '85 minutes', 'IR team notified — j.smith assigned as owner',                  'notify'),
  ('inc-001', NOW() - INTERVAL '80 minutes', 'C2 domain blacklisted across all endpoints',                    'action'),
  ('inc-001', NOW() - INTERVAL '59 minutes', 'Root cause identified: malicious email attachment via T1566.001','intel'),
  ('inc-002', NOW() - INTERVAL '3.5 hours',  'INC-002 created — DB access alert from SIEM',                  'alert'),
  ('inc-002', NOW() - INTERVAL '200 minutes','DB connection from 198.51.100.42 terminated',                   'action'),
  ('inc-002', NOW() - INTERVAL '190 minutes','Credential rotation initiated for all DB users',                'action')
ON CONFLICT DO NOTHING;

INSERT INTO incident_playbooks (name, steps, avg_time_hours, status, last_used) VALUES
  ('Ransomware Response',   12, 3.5, 'Active', NOW() - INTERVAL '2 hours'),
  ('Unauthorized Access',    8, 2.1, 'Active', NOW() - INTERVAL '4 hours'),
  ('Data Exfiltration',     10, 4.8, 'Ready',  NOW() - INTERVAL '3 days'),
  ('Malware Infection',      9, 3.0, 'Ready',  NOW() - INTERVAL '5 days'),
  ('Privilege Escalation',   7, 1.8, 'Ready',  NOW() - INTERVAL '7 days'),
  ('DDoS Response',          6, 1.2, 'Ready',  NOW() - INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- risks
INSERT INTO risks (risk_id, title, category, likelihood, impact, risk_score, status, owner, mitigation, review_date) VALUES
  ('risk-001','Unpatched Critical CVEs on Production Hosts',   'Vulnerability Management',2,5,10,'Open',       'sec-ops',      'Enforce 48h patch SLA for CVSS ≥ 9.0. Auto-patch pipeline in progress.','2026-03-15'),
  ('risk-002','Insufficient MFA Coverage for Admin Accounts',  'Identity & Access',       3,5,15,'In Progress', 'iam-team',     'MFA enforcement rollout. Current: 78%. Target: 100% by Q2.','2026-03-20'),
  ('risk-003','Third-Party Dependency with Known RCE',         'Supply Chain',            3,4,12,'Open',        'dev-team',     'Upgrade log4j-core to 2.20+. SCA pipeline on every PR.','2026-03-12'),
  ('risk-004','Cloud Storage Misconfiguration Risk',           'Cloud Security',          2,5,10,'Mitigated',   'cloud-ops',    'CSPM deployed. All buckets audited. SCPs enforce no public ACLs.','2026-04-01'),
  ('risk-005','Ransomware via Phishing — Finance Dept',        'Human Factor',            3,4,12,'In Progress', 'awareness',    'Monthly phishing simulations. Awareness training mandatory.','2026-03-30'),
  ('risk-006','Insider Threat — Privileged DB Access No Audit','Insider Threat',          2,4, 8,'Open',        'compliance',   'Implement UEBA for DB admin sessions.','2026-04-15'),
  ('risk-007','API Gateway Exposed Without WAF',               'Network Security',        4,3,12,'Mitigated',   'infra-team',   'Cloudflare WAF deployed. Rate limiting enabled.','2026-05-01'),
  ('risk-008','Inadequate DR / BCP Testing',                   'Business Continuity',     2,5,10,'In Progress', 'infra-team',   'Quarterly DR drills scheduled. RTO target 4h.','2026-06-01')
ON CONFLICT DO NOTHING;

-- devsecops pipelines
INSERT INTO devsecops_pipelines (pipeline_id, name, repo, branch, status, stage, sbom_findings, secrets_count, sast_issues, dast_issues, policy_pass, run_at, duration_ms) VALUES
  ('pipe-001','payment-service CI', 'org/payment-service', 'main',           'passed', 'deploy', 2,0,1,0,TRUE,  NOW() - INTERVAL '30 minutes',  312000),
  ('pipe-002','api-gateway CI',     'org/api-gateway',     'main',           'failed', 'sast',   5,1,7,3,FALSE, NOW() - INTERVAL '75 minutes',  198000),
  ('pipe-003','auth-service CI',    'org/auth-service',    'feature/oauth2', 'passed', 'deploy', 0,0,0,1,TRUE,  NOW() - INTERVAL '2 hours',     284000),
  ('pipe-004','data-pipeline CI',   'org/data-pipeline',   'main',           'running','test',   3,0,2,0,NULL,  NOW() - INTERVAL '8 minutes',   NULL),
  ('pipe-005','frontend-web CI',    'org/frontend-web',    'main',           'passed', 'deploy', 1,0,0,0,TRUE,  NOW() - INTERVAL '4 hours',     145000),
  ('pipe-006','infra-terraform CI', 'org/infra-terraform', 'main',           'passed', 'deploy', 0,0,0,0,TRUE,  NOW() - INTERVAL '6 hours',     420000)
ON CONFLICT DO NOTHING;

INSERT INTO sbom_findings (pipeline_id, component, version, cve_id, severity, license, fix_version) VALUES
  ('pipe-001','com.fasterxml.jackson:jackson-databind','2.13.4','CVE-2022-42004','High','Apache-2.0','2.14.0'),
  ('pipe-001','org.apache.commons:commons-text',       '1.9',   'CVE-2022-42889','Critical','Apache-2.0','1.10.0'),
  ('pipe-002','log4j-core',                            '2.17.1','CVE-2021-44228','Critical','Apache-2.0','2.17.2'),
  ('pipe-002','lodash',                                '4.17.20','CVE-2021-23337','High','MIT','4.17.21'),
  ('pipe-002','moment',                                '2.29.3','CVE-2022-24785','Medium','MIT','2.29.4'),
  ('pipe-004','spring-webmvc',                         '5.3.27','CVE-2022-22965','Critical','Apache-2.0','5.3.28'),
  ('pipe-004','netty-codec',                           '4.1.77','CVE-2022-41881','Medium','Apache-2.0','4.1.86'),
  ('pipe-005','node-fetch',                            '2.6.7', 'CVE-2022-0235','Medium','MIT','2.6.9')
ON CONFLICT DO NOTHING;

INSERT INTO devsecops_policies (name, status, failures, description) VALUES
  ('No Critical CVEs in SBOM',          'Passing', 0,'Block deployment if any SBOM dependency has CVSS ≥ 9.0'),
  ('No Hardcoded Secrets',              'Failing', 1,'Detect secrets in source code via Semgrep + Trufflehog'),
  ('SAST Gate (High+)',                 'Passing', 0,'Fail pipeline if SAST finds High/Critical severity issues'),
  ('Container Base Image Policy',       'Passing', 0,'Only approved base images from internal registry'),
  ('License Compliance',                'Passing', 0,'Block GPL/AGPL licenses in production dependencies'),
  ('DAST API Security Scan',            'Passing', 0,'Run OWASP ZAP against staging before deploy')
ON CONFLICT DO NOTHING;

-- cloud findings
INSERT INTO cloud_findings (finding_id, provider, resource_id, resource_type, rule_id, title, severity, status, region, account_id, description, remediation, detected_at) VALUES
  ('cf-001','AWS','arn:aws:s3:::prod-customer-data','S3 Bucket',           'CIS-2.1.5', 'S3 bucket with public read ACL enabled','Critical','Open',       'us-east-1','123456789012','Production S3 bucket allows unauthenticated public reads.',  'Set bucket ACL to private and enable S3 Block Public Access.',NOW() - INTERVAL '2 hours'),
  ('cf-002','AWS','sg-0abc12345def67890',            'Security Group',     'CIS-5.4',   'Security group allows 0.0.0.0/0 on SSH','High',    'In Progress','us-east-1','123456789012','Security group exposes SSH port 22 to the entire internet.','Restrict SSH to specific IP ranges or VPN CIDR.',          NOW() - INTERVAL '1 day'),
  ('cf-003','AWS','arn:aws:rds:us-east-1:123:prod-db','RDS Instance',     'CIS-2.3.1', 'RDS instance not encrypted at rest',    'High',    'Open',       'us-east-1','123456789012','Production RDS instance has encryption disabled.',           'Enable RDS storage encryption. Requires snapshot restore.',  NOW() - INTERVAL '3 days'),
  ('cf-004','Azure','sub-xyz/rg-prod/nsg-web',       'NSG',                'CIS-6.3',   'NSG allows RDP from internet',           'Critical','Open',       'eastus',   'sub-xyz',    'NSG allows inbound RDP (3389) from Any source.',             'Restrict RDP to specific admin IP ranges or use Bastion.',   NOW() - INTERVAL '6 hours'),
  ('cf-005','GCP','projects/prod/compute/fw-allow-all','Firewall Rule',   'CIS-3.7',   'Firewall rule allows all ingress traffic','High',    'Open',       'us-central1','prod-project','Permissive firewall rule allows unrestricted inbound traffic.','Remove or restrict the allow-all ingress rule.',            NOW() - INTERVAL '12 hours'),
  ('cf-006','AWS','trail-prod',                       'CloudTrail',        'CIS-2.1',   'CloudTrail log validation disabled',     'Medium',  'Resolved',   'us-east-1','123456789012','Log file integrity validation not enabled for CloudTrail.',  'Enable log file validation in CloudTrail settings.',        NOW() - INTERVAL '5 days'),
  ('cf-007','AWS','iam-user-deploy',                  'IAM User',          'CIS-1.16',  'IAM user has console access with no MFA','High',    'In Progress','global',   '123456789012','Deploy service account has console access without MFA.',     'Enable MFA for all IAM users with console access.',         NOW() - INTERVAL '8 hours'),
  ('cf-008','GCP','prod-bucket-logs',                 'GCS Bucket',        'CIS-5.1',   'GCS bucket is publicly accessible',      'Critical','Open',       'us-central1','prod-project','Logging bucket is publicly accessible.',                     'Set uniform bucket-level access and remove allUsers binding.',NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- code findings
INSERT INTO code_findings (finding_id, repo, tool, rule_id, title, severity, category, file_path, line_number, status, branch, detected_at) VALUES
  ('code-001','org/api-gateway',   'semgrep',   'taint.sql-injection',   'SQL Injection via unsanitized user input',         'Critical','Injection',       'src/db/queries.js',        42,  'Open',      'main',  NOW() - INTERVAL '2 hours'),
  ('code-002','org/api-gateway',   'semgrep',   'security.hardcoded-key','Hardcoded API key in source code',                 'High',    'Secrets',         'src/config/aws.js',         8,  'In Progress','main',  NOW() - INTERVAL '3 hours'),
  ('code-003','org/api-gateway',   'zap',       '10202',                 'Cross-Site Scripting (XSS) via reflected parameter','High',   'XSS',             'POST /api/v1/search',       NULL,'Open',      'main',  NOW() - INTERVAL '75 minutes'),
  ('code-004','org/payment-service','codeql',    'java/path-injection',   'Path traversal in file upload handler',            'High',    'Path Traversal',  'src/FileUploader.java',    187, 'Open',      'main',  NOW() - INTERVAL '1 day'),
  ('code-005','org/payment-service','semgrep',   'crypto.weak-hash',      'MD5 used for password hashing',                   'High',    'Cryptography',    'src/auth/UserService.java', 63,  'In Progress','main',  NOW() - INTERVAL '4 hours'),
  ('code-006','org/auth-service',  'bandit',    'B101',                  'Use of assert for security checks',                'Medium',  'Logic',           'auth/middleware.py',       121, 'Open',      'main',  NOW() - INTERVAL '2 days'),
  ('code-007','org/auth-service',  'semgrep',   'python.flask.ssrf',     'SSRF vulnerability via user-controlled URL',       'Critical','SSRF',            'auth/webhooks.py',          55, 'Open',      'main',  NOW() - INTERVAL '1 hour'),
  ('code-008','org/frontend-web',  'semgrep',   'javascript.xss',        'innerHTML used with unescaped user data',          'Medium',  'XSS',             'components/Renderer.tsx',   34, 'Resolved',  'main',  NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- container scans
INSERT INTO container_scans (scan_id, image, tag, registry, critical_vulns, high_vulns, medium_vulns, low_vulns, total_vulns, status, policy_pass, runtime_alerts, base_image, scanned_at) VALUES
  ('cscan-001','api-gateway',      'v2.4.1', 'registry.internal', 2,5,8,12,27,'Critical', FALSE,3,'node:18-slim',        NOW() - INTERVAL '1 hour'),
  ('cscan-002','auth-service',     'v1.8.3', 'registry.internal', 0,1,3,7, 11,'Vulnerable',TRUE, 0,'python:3.11-alpine',  NOW() - INTERVAL '2 hours'),
  ('cscan-003','payment-service',  'v3.1.0', 'registry.internal', 1,3,5,9, 18,'Critical', FALSE,1,'eclipse-temurin:17',  NOW() - INTERVAL '90 minutes'),
  ('cscan-004','data-pipeline',    'v0.9.2', 'registry.internal', 0,0,2,4,  6,'Clean',    TRUE, 0,'python:3.11-slim',    NOW() - INTERVAL '3 hours'),
  ('cscan-005','frontend-web',     'v5.2.0', 'registry.internal', 0,0,1,2,  3,'Clean',    TRUE, 0,'node:20-alpine',      NOW() - INTERVAL '4 hours'),
  ('cscan-006','scheduler-worker', 'v1.2.1', 'registry.internal', 0,2,4,6, 12,'Vulnerable',TRUE, 0,'ubuntu:22.04',        NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- malware samples
INSERT INTO malware_samples (sample_id, filename, hash_sha256, file_type, verdict, threat_family, confidence, iocs, mitre_techniques, sandbox_env, analysis_duration_ms, analyzed_at) VALUES
  ('mal-001','invoice_Q1_2026.exe',   'a3f8c2d1e4b7f9e2a1d4c7b8f3e6a9d2c5b8e1f4a7d0c3b6', 'PE32',    'Malicious',  'LockBit 3.0',        95,'[{"type":"domain","value":"c2-lockbit.onion"},{"type":"ip","value":"185.220.101.45"}]',ARRAY['T1566.001','T1059.001','T1486'],'Windows 10 x64', 342000, NOW() - INTERVAL '2 hours'),
  ('mal-002','update_service.dll',    'b4e9d3f2a1c8g0e3b2d5a6c9b0f3a2d5c8b1e4a7d0c3b7', 'PE32 DLL', 'Malicious',  'Cobalt Strike Beacon',88,'[{"type":"ip","value":"198.51.100.12"},{"type":"hash","value":"deadbeef12345678"}]',ARRAY['T1055','T1071.001','T1027'],  'Windows Server 2019',187000, NOW() - INTERVAL '4 hours'),
  ('mal-003','report_analysis.pdf',   'c5f0e4g3b2d9h1f4c3e6b7d0c1g4b3e6d9c2f5b8e1a4d0', 'PDF',     'Suspicious', 'Unknown',             62,'[{"type":"url","value":"http://malicious-dl.ru/stage2"}]',                         ARRAY['T1566.001','T1204'],          'Windows 10 x64', 95000,  NOW() - INTERVAL '6 hours'),
  ('mal-004','svchost.exe',           'd6g1f5h4c3e0i2g5d4f7c8e1d2h5c4f7e0d3g6c9f2b5e3', 'PE32',    'Malicious',  'Mimikatz',           91,'[{"type":"process","value":"lsass.exe"},{"type":"registry","value":"HKLM\\SAM"}]',  ARRAY['T1003.001','T1550.002'],       'Windows 10 x64', 128000, NOW() - INTERVAL '8 hours'),
  ('mal-005','backup_util.sh',        'e7h2g6i5d4f1j3h6e5g8d9f2e3i6d5g8f1e4h7d0g3c6f4', 'Script',  'Clean',      NULL,                  5, '[]',                                                                               ARRAY[]::TEXT[],                     'Ubuntu 22.04',   12000,  NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- zero days
INSERT INTO zero_days (zd_id, title, cve_id, affected_product, vendor, severity, status, epss_score, exploit_maturity, description, behavior_signals, discovered_at) VALUES
  ('zd-001','PAN-OS GlobalProtect RCE',      'CVE-2024-3400', 'PAN-OS < 11.1.2','Palo Alto Networks','Critical','Unpatched',       0.9612,'weaponized','Unauthenticated OS command injection via GlobalProtect gateway interface.','[{"signal":"Anomalous HTTP headers in GlobalProtect requests"},{"signal":"Unexpected process spawn from httpd"}]',NOW() - INTERVAL '3 days'),
  ('zd-002','Ivanti Connect Secure Auth Bypass','CVE-2024-21887','Ivanti Connect Secure','Ivanti','Critical','Partial Mitigation',0.9430,'weaponized','Command injection via web component allowing unauthenticated RCE.','[{"signal":"POST requests to /api/v1/totp"},{"signal":"Unusual crontab modifications"}]',NOW() - INTERVAL '5 days'),
  ('zd-003','Windows SmartScreen Bypass',   'CVE-2024-21412','Windows 10/11',   'Microsoft',         'High',   'Patched',          0.7820,'functional','Attacker can bypass SmartScreen via specially crafted internet shortcut files.','[{"signal":"Shortcut files from internet zone bypassing warnings"}]',NOW() - INTERVAL '10 days'),
  ('zd-004','FortiOS SSL-VPN RCE',          'CVE-2024-21762','FortiOS < 7.4.3', 'Fortinet',          'Critical','Unpatched',       0.8950,'weaponized','Out-of-bounds write in SSL-VPN allows unauthenticated RCE via HTTP requests.','[{"signal":"Malformed HTTP requests to SSL-VPN"},{"signal":"Memory corruption indicators in logs"}]',NOW() - INTERVAL '1 day'),
  ('zd-005','OpenSSH regreSSHion',           'CVE-2024-6387', 'OpenSSH < 9.8',  'OpenBSD',           'High',   'Partial Mitigation',0.8870,'functional','Signal handler race condition enabling unauthenticated RCE as root on glibc-based systems.','[{"signal":"High connection rate to SSH port"},{"signal":"Repeated auth timeout sequences"}]',NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- red team campaigns
INSERT INTO red_team_campaigns (campaign_id, name, status, objective, operator, target_scope, start_date, end_date, kill_chain_stage, findings, critical_findings, description) VALUES
  ('rt-001','Operation BlackMirror','Active',    'Simulate APT28 TTP against production cloud infrastructure','r.santos', ARRAY['prod-web-cluster','api-gateway','iam-system'],'2026-02-01',NULL,        'Lateral Movement',  12,4,'Adversary emulation of APT28. Focus on credential theft and lateral movement across cloud assets.'),
  ('rt-002','Operation RedHarvest', 'Active',    'Test phishing + initial access vector resilience',            'k.mcbride',ARRAY['email-gateway','finance-dept','hr-dept'],   '2026-03-01',NULL,        'Initial Access',     5,1,'Social engineering + phishing simulation targeting Finance and HR departments.'),
  ('rt-003','Operation IronVault',  'Completed', 'Test physical + digital access controls for data center',    'r.santos', ARRAY['datacenter-hq','identity-dc-01'],           '2026-01-15','2026-02-15','Persistence',       18,7,'Physical intrusion simulation combined with logical access tests. Critical badge cloning finding.'),
  ('rt-004','Operation SilentPivot','Planned',   'Supply chain attack via compromised npm package',             'a.mehta',  ARRAY['ci-jenkins-01','dev-env','npm-registry'],  '2026-03-15',NULL,        'Initial Access',     0,0,'Simulate supply chain compromise through malicious npm package targeting CI/CD pipeline.')
ON CONFLICT DO NOTHING;

-- EDR alerts
INSERT INTO edr_alerts (alert_id, endpoint, hostname, os, severity, technique_id, technique_name, tactic, status, process_name, description, detected_at) VALUES
  ('edr-001','ep-001','WORKSTATION-042','Windows 11 23H2', 'Critical','T1486','Data Encrypted for Impact',    'Impact',          'Active',       'svchost.exe',    'Ransomware-like file encryption activity detected on 847 files in 3 minutes.',                        NOW() - INTERVAL '2 hours'),
  ('edr-002','ep-002','LAPTOP-DEV-015', 'macOS 14.3',      'High',   'T1055','Process Injection',            'Defense Evasion', 'Investigating','Python3.11',     'Shellcode injection into system process from Python script.',                                          NOW() - INTERVAL '4 hours'),
  ('edr-003','ep-003','SRV-PROD-07',    'Ubuntu 22.04',    'High',   'T1068','Exploitation for Privilege Esc','Privilege Esc',   'Investigating','exploit',        'Kernel exploit attempt targeting CVE-2022-0847 (Dirty Pipe). System kernel 5.15 is vulnerable.',    NOW() - INTERVAL '6 hours'),
  ('edr-004','ep-004','WORKSTATION-019','Windows 10 22H2', 'Medium', 'T1003.001','LSASS Memory Dump',        'Credential Access','Resolved',    'mimikatz.exe',   'Mimikatz credential dumping from LSASS blocked and process terminated.',                              NOW() - INTERVAL '8 hours'),
  ('edr-005','ep-005','SRV-API-01',     'Ubuntu 22.04',    'High',   'T1190','Exploit Public-Facing App',    'Initial Access',  'Active',       'java',           'Log4Shell exploitation attempt against Java service. JNDI callback to external attacker IP.',       NOW() - INTERVAL '1 hour'),
  ('edr-006','ep-006','WORKSTATION-033','Windows 11 23H2', 'Medium', 'T1566.001','Spearphishing Attachment','Initial Access',  'Resolved',    'WINWORD.EXE',    'Malicious macro in Word document blocked. Document quarantined.',                                      NOW() - INTERVAL '12 hours'),
  ('edr-007','ep-007','SRV-JUMP-01',    'Windows Server 2022','High','T1078','Valid Accounts',               'Persistence',     'Investigating','winlogon.exe',   'Admin account login from unusual geolocation (Eastern Europe). Concurrent session from US detected.', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- dark web findings
INSERT INTO dark_web_findings (finding_id, category, title, source, severity, status, description, affected_data, threat_actor, discovered_at) VALUES
  ('dw-001','Credential Leak',   'Employee credentials leaked in Breached.vc data dump',             'Breached.vc',    'Critical','Investigating','1,247 employee email/password pairs from @company.com found in breach database.', '1,247 employee credentials',  NULL,          NOW() - INTERVAL '6 hours'),
  ('dw-002','Threat Actor',      'APT29 targeting financial sector — org mentioned in forum post',   'XSS Forum',      'High',   'Investigating','Threat actor post discusses targeting fintech companies in EMEA. Company logo referenced.','N/A',                 'APT29',       NOW() - INTERVAL '12 hours'),
  ('dw-003','Data Exposure',     'Customer PII dataset (12k records) for sale on darknet market',    'BreachForums',   'Critical','New',          '12,000 customer records including names, emails, phone numbers offered for $2,500.', '12k customer PII records', 'Unknown',     NOW() - INTERVAL '3 hours'),
  ('dw-004','Exploit Sale',      'Zero-day exploit for internal VPN product listed on 0day market',  '0day.today',     'High',   'New',          'Exploit for Ivanti Connect Secure offered for $45,000. Claims unauthenticated RCE.',  'VPN Infrastructure',        'Unknown',     NOW() - INTERVAL '1 day'),
  ('dw-005','Credential Leak',   'GitHub API tokens exposed in public repository',                   'GitHub Public',  'High',   'Remediated',   'Service account tokens committed to public fork. Rotated within 2 hours of discovery.','GitHub API tokens',        NULL,          NOW() - INTERVAL '2 days'),
  ('dw-006','Threat Actor',      'Ransomware gang RansomHub claims to have exfiltrated 50GB',        'RansomHub Blog', 'Critical','Investigating','RansomHub posted company name on leak site. Claims to have 50GB of sensitive data.', '50GB claimed exfiltrated', 'RansomHub',   NOW() - INTERVAL '18 hours')
ON CONFLICT DO NOTHING;

-- phishing campaigns
INSERT INTO phishing_campaigns (campaign_id, name, status, target_department, recipients_count, opened_count, clicked_count, submitted_count, reported_count, start_date, end_date, template_name) VALUES
  ('ph-001','Q1 2026 Finance Phish Sim',  'Completed','Finance',    142,89,34,12, 8, '2026-01-15','2026-01-22','Fake Invoice Approval'),
  ('ph-002','Q1 2026 HR Phish Sim',       'Completed','HR',          67,41,21, 9, 4, '2026-01-22','2026-01-29','Benefits Update Notification'),
  ('ph-003','Q1 2026 Engineering Sim',    'Completed','Engineering', 218,98,28, 3, 31,'2026-02-01','2026-02-08','GitHub Security Alert'),
  ('ph-004','Q1 2026 Executive Spear',    'Completed','Executive',   12, 10, 3, 1, 2, '2026-02-15','2026-02-22','Board Meeting Invitation'),
  ('ph-005','Q2 2026 Company-wide Sim',   'Active',   'All Depts',  487,NULL,NULL,NULL,NULL,'2026-03-01',NULL,      'IT Password Reset Required'),
  ('ph-006','Red Team Social Eng — Sales','Scheduled','Sales',       94, NULL,NULL,NULL,NULL,'2026-03-20',NULL,      'Customer Deal Opportunity')
ON CONFLICT DO NOTHING;

-- org settings
INSERT INTO org_settings (org_id, org_name, settings) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sentinel Demo Org', '{
    "scan_interval_hours": 6,
    "auto_patch": false,
    "notify_email": "security@company.com",
    "notify_slack": "#security-alerts",
    "slack_webhook": "",
    "severity_threshold": "High",
    "sandbox_network": "sentinel-sandbox",
    "sandbox_timeout_sec": 60,
    "mfa_enforcement": true,
    "sso_enabled": false,
    "retention_days": 90,
    "compliance_frameworks": ["iso27001","soc2","pcidss"],
    "integrations_auto_sync": true,
    "report_schedule": "weekly",
    "api_rate_limit": 1000,
    "sandbox_cpu_limit": "0.5",
    "sandbox_memory_limit": "256m"
  }')
ON CONFLICT (org_id) DO NOTHING;

-- infrastructure nodes seed
INSERT INTO infrastructure_nodes (node_id, org_id, name, type, environment, ip_address, hostname, os_name, os_version, patch_status, known_cves, external_tool) VALUES
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','prod-web-cluster', 'cloud',          'production','10.0.1.10',  'prod-web-cluster.internal','Ubuntu','22.04',   'current',ARRAY[]::TEXT[],         'AWS'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','prod-db-primary',  'cloud',          'production','10.0.2.5',   'prod-db-primary.internal', 'RHEL','9',        'current',ARRAY[]::TEXT[],         'Manual'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','core-firewall-01', 'network_device', 'production','10.0.0.1',   'firewall-01.internal',     'FortiOS','7.4',    'behind', ARRAY['CVE-2024-21762'], 'FortiManager'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','edge-router-01',   'network_device', 'production','10.0.0.2',   'router-01.internal',       'Cisco IOS-XE','17.9','current',ARRAY[]::TEXT[],       'Cisco DNA'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','k8s-worker-pool',  'cloud',          'production','10.0.3.0/24','k8s-workers.internal',     'Flatcar Linux','3.6','current',ARRAY['CVE-2023-44487'],'Kubernetes'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','dev-jumpbox',      'endpoint',       'development','10.10.1.5', 'dev-jumpbox.internal',     'Windows','11 23H2','behind', ARRAY[]::TEXT[],         'Ivanti'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','monitoring-stack', 'application',    'production','10.0.5.8',   'monitoring.internal',      'Debian','12',      'current',ARRAY[]::TEXT[],         'Zabbix'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','backup-nas-01',    'endpoint',       'production','10.0.6.20',  'nas-01.internal',          'TrueNAS','13.0',   'unknown',ARRAY[]::TEXT[],         'Manual'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','identity-dc-01',   'cloud',          'production','10.0.7.1',   'dc-01.internal',           'Windows Server','2022','current',ARRAY[]::TEXT[],      'SCCM'),
  (gen_random_uuid(),'a1b2c3d4-0000-0000-0000-000000000001','staging-api',      'application',    'staging',   '10.20.1.8',  'staging-api.internal',     'Alpine','3.18',    'current',ARRAY[]::TEXT[],         'AWS')
ON CONFLICT DO NOTHING;
