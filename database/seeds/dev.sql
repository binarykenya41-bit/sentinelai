-- =============================================================
-- Sentinel AI — Development Seed Data (Rich)
-- Run: psql $DATABASE_URL -f database/seeds/dev.sql
-- =============================================================

-- Organization
INSERT INTO organizations (org_id, name, plan_tier, compliance_frameworks)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Sentinel Demo Org',
  'enterprise',
  ARRAY['iso27001', 'soc2', 'pcidss']
) ON CONFLICT DO NOTHING;

-- =============================================================
-- Assets (10 realistic nodes)
-- =============================================================
INSERT INTO assets (asset_id, org_id, type, hostname, ip, tags, criticality, os_version, open_ports, patch_status, source)
VALUES
  ('a1b2c3d4-0000-0000-0001-000000000001','a1b2c3d4-0000-0000-0000-000000000001','server',        'api-prod-01',      ARRAY['10.0.1.10'],    ARRAY['production','backend','api'],   'critical','Ubuntu 22.04.3 LTS',  ARRAY[22,80,443,8080], 'behind',  'aws'),
  ('a1b2c3d4-0000-0000-0001-000000000002','a1b2c3d4-0000-0000-0000-000000000001','container',     'auth-service',     ARRAY['10.0.1.11'],    ARRAY['production','auth','jwt'],      'high',   'Alpine 3.18',         ARRAY[443,3000],       'current', 'kubernetes'),
  ('a1b2c3d4-0000-0000-0001-000000000003','a1b2c3d4-0000-0000-0000-000000000001','database',      'postgres-prod-01', ARRAY['10.0.2.10'],    ARRAY['production','database','pgsql'],'critical','PostgreSQL 15.3',     ARRAY[5432],           'behind',  'aws'),
  ('a1b2c3d4-0000-0000-0001-000000000004','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','s3-data-lake',     ARRAY[]::TEXT[],       ARRAY['production','storage','s3'],    'medium', NULL,                  ARRAY[]::INT[],        'current', 'aws'),
  ('a1b2c3d4-0000-0000-0001-000000000005','a1b2c3d4-0000-0000-0000-000000000001','endpoint',      'dev-macbook-01',   ARRAY['192.168.1.50'], ARRAY['development','endpoint'],       'low',    'macOS 14.3',          ARRAY[22],             'current', 'jamf'),
  ('a1b2c3d4-0000-0000-0001-000000000006','a1b2c3d4-0000-0000-0000-000000000001','server',        'web-nginx-01',     ARRAY['10.0.1.20'],    ARRAY['production','web','nginx'],     'high',   'Ubuntu 22.04 LTS',    ARRAY[80,443],         'behind',  'aws'),
  ('a1b2c3d4-0000-0000-0001-000000000007','a1b2c3d4-0000-0000-0000-000000000001','container',     'java-api-service', ARRAY['10.0.1.30'],    ARRAY['production','java','spring'],   'critical','OpenJDK 11.0.11',    ARRAY[8080,8443],      'behind',  'kubernetes'),
  ('a1b2c3d4-0000-0000-0001-000000000008','a1b2c3d4-0000-0000-0000-000000000001','server',        'redis-cache-01',   ARRAY['10.0.2.20'],    ARRAY['production','cache','redis'],   'medium', 'Redis 7.0.11',        ARRAY[6379],           'current', 'aws'),
  ('a1b2c3d4-0000-0000-0001-000000000009','a1b2c3d4-0000-0000-0000-000000000001','server',        'ci-jenkins-01',    ARRAY['10.0.3.10'],    ARRAY['devops','jenkins','ci'],        'high',   'Ubuntu 20.04 LTS',    ARRAY[8080,443],       'behind',  'manual'),
  ('a1b2c3d4-0000-0000-0001-000000000010','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','gke-cluster-prod', ARRAY['10.0.4.1'],     ARRAY['production','kubernetes','gke'],'critical','GKE 1.28',            ARRAY[443,10250],      'current', 'gcp')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Vulnerabilities (20 CVEs — real historical CVEs)
-- =============================================================
INSERT INTO vulnerabilities (vuln_id, cve_id, cvss_v3, cwe_ids, mitre_techniques, epss_score, kev_status, affected_assets, blast_radius, scan_source, remediation_status, detection_at)
VALUES
  -- CRITICAL + KEV
  ('b1b2c3d4-0000-0000-0002-000000000001','CVE-2021-44228',10.0,ARRAY['CWE-502','CWE-917'],ARRAY['T1190','T1059'],0.9750,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000007'::UUID],'Java services + all log4j consumers','trivy','in_progress',NOW() - INTERVAL '5 days'),
  ('b1b2c3d4-0000-0000-0002-000000000002','CVE-2022-22965',9.8, ARRAY['CWE-94'],           ARRAY['T1190','T1059'],0.9340,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000007'::UUID],'Spring Boot applications',           'grype', 'in_progress',NOW() - INTERVAL '4 days'),
  ('b1b2c3d4-0000-0000-0002-000000000003','CVE-2022-0847', 7.8, ARRAY['CWE-416'],          ARRAY['T1068'],        0.8621,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],'All Linux hosts with kernel < 5.16', 'trivy', 'open',       NOW() - INTERVAL '3 days'),
  ('b1b2c3d4-0000-0000-0002-000000000004','CVE-2021-45046',9.0, ARRAY['CWE-917'],          ARRAY['T1190'],        0.9100,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000007'::UUID],'Log4j bypass of initial fix',        'trivy', 'in_progress',NOW() - INTERVAL '4 days'),
  ('b1b2c3d4-0000-0000-0002-000000000005','CVE-2017-0144', 9.3, ARRAY['CWE-287'],          ARRAY['T1210'],        0.9771,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000006'::UUID],'EternalBlue — all Windows SMB hosts','nessus','open',       NOW() - INTERVAL '2 days'),
  -- HIGH + no KEV
  ('b1b2c3d4-0000-0000-0002-000000000006','CVE-2023-46604',10.0,ARRAY['CWE-502'],          ARRAY['T1190','T1059'],0.9823,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000007'::UUID],'Apache ActiveMQ RCE',                'trivy', 'open',       NOW() - INTERVAL '1 days'),
  ('b1b2c3d4-0000-0000-0002-000000000007','CVE-2024-3400', 10.0,ARRAY['CWE-77'],           ARRAY['T1190','T1059'],0.9612,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],'PAN-OS GlobalProtect RCE',           'nessus','open',       NOW() - INTERVAL '1 days'),
  ('b1b2c3d4-0000-0000-0002-000000000008','CVE-2023-44487',7.5, ARRAY['CWE-400'],          ARRAY['T1499','T1499.001'],0.7230,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000006'::UUID],'HTTP/2 Rapid Reset DoS (web tier)',  'manual','open',       NOW() - INTERVAL '2 days'),
  ('b1b2c3d4-0000-0000-0002-000000000009','CVE-2023-4966', 9.4, ARRAY['CWE-200'],          ARRAY['T1539','T1185'],0.9450,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000002'::UUID],'Citrix Bleed session token leak',    'nessus','open',       NOW() - INTERVAL '3 days'),
  ('b1b2c3d4-0000-0000-0002-000000000010','CVE-2024-21413',9.8, ARRAY['CWE-20'],           ARRAY['T1566.001'],    0.8910,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000005'::UUID],'Outlook NTLM credential theft',      'nessus','open',       NOW() - INTERVAL '1 days'),
  -- MEDIUM
  ('b1b2c3d4-0000-0000-0002-000000000011','CVE-2023-36884',8.8, ARRAY['CWE-94'],           ARRAY['T1203','T1059'],0.8220,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000005'::UUID],'Office RCE via malicious document',  'nessus','open',       NOW() - INTERVAL '2 days'),
  ('b1b2c3d4-0000-0000-0002-000000000012','CVE-2023-20198',10.0,ARRAY['CWE-306'],          ARRAY['T1078.001'],    0.9670,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000009'::UUID],'Cisco IOS XE auth bypass',           'nessus','open',       NOW() - INTERVAL '3 days'),
  ('b1b2c3d4-0000-0000-0002-000000000013','CVE-2024-1709', 10.0,ARRAY['CWE-287'],          ARRAY['T1190','T1078'],0.9530,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],'ConnectWise ScreenConnect auth bypass','manual','open',    NOW() - INTERVAL '1 days'),
  ('b1b2c3d4-0000-0000-0002-000000000014','CVE-2023-27997',9.8, ARRAY['CWE-122'],          ARRAY['T1190'],        0.9120,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000006'::UUID],'Fortinet FortiOS heap overflow',     'nessus','open',       NOW() - INTERVAL '4 days'),
  ('b1b2c3d4-0000-0000-0002-000000000015','CVE-2024-6387', 8.1, ARRAY['CWE-364'],          ARRAY['T1110','T1190'],0.8870,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],'OpenSSH regreSSHion RCE',            'trivy', 'open',       NOW() - INTERVAL '2 days'),
  -- Patched/Verified
  ('b1b2c3d4-0000-0000-0002-000000000016','CVE-2023-34048',9.8, ARRAY['CWE-787'],          ARRAY['T1190','T1068'],0.7830,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000010'::UUID],'VMware vCenter OOB write',           'trivy', 'patched',    NOW() - INTERVAL '10 days'),
  ('b1b2c3d4-0000-0000-0002-000000000017','CVE-2023-29300',9.8, ARRAY['CWE-78'],           ARRAY['T1059','T1190'],0.9010,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],'Adobe ColdFusion RCE',               'nessus','patched',    NOW() - INTERVAL '15 days'),
  ('b1b2c3d4-0000-0000-0002-000000000018','CVE-2022-26134',9.8, ARRAY['CWE-74'],           ARRAY['T1190'],        0.9650,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000007'::UUID],'Confluence OGNL injection',          'trivy', 'verified',   NOW() - INTERVAL '20 days'),
  ('b1b2c3d4-0000-0000-0002-000000000019','CVE-2023-0386',  7.8,ARRAY['CWE-281'],          ARRAY['T1068'],        0.6230,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],'Linux OverlayFS privilege escalation','trivy','patched',    NOW() - INTERVAL '12 days'),
  ('b1b2c3d4-0000-0000-0002-000000000020','CVE-2021-34527',8.8, ARRAY['CWE-269'],          ARRAY['T1068','T1547'],0.9530,TRUE, ARRAY['a1b2c3d4-0000-0000-0001-000000000005'::UUID],'PrintNightmare LPE',                 'nessus','verified',   NOW() - INTERVAL '25 days')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Exploit Results (7 simulation records)
-- =============================================================
INSERT INTO exploit_results (result_id, vuln_id, sandbox_id, success, confidence, technique, payload_hash, duration_ms, executed_at)
VALUES
  ('e1b2c3d4-0000-0000-0005-000000000001','b1b2c3d4-0000-0000-0002-000000000001','sb-log4shell-001', TRUE,  0.95,'T1190','a3f8c2d1e4b7...', 12450, NOW() - INTERVAL '4 days'),
  ('e1b2c3d4-0000-0000-0005-000000000002','b1b2c3d4-0000-0000-0002-000000000002','sb-spring4s-001',  TRUE,  0.88,'T1190','b4e9d3f2a1c8...', 8920,  NOW() - INTERVAL '3 days'),
  ('e1b2c3d4-0000-0000-0005-000000000003','b1b2c3d4-0000-0000-0002-000000000003','sb-dirtypipe-001', FALSE, 0.30,'T1068','c5f0e4g3b2d9...', 5100,  NOW() - INTERVAL '2 days'),
  ('e1b2c3d4-0000-0000-0005-000000000004','b1b2c3d4-0000-0000-0002-000000000006','sb-activemq-001',  TRUE,  0.92,'T1190','d6g1f5h4c3e0...', 15300, NOW() - INTERVAL '1 days'),
  ('e1b2c3d4-0000-0000-0005-000000000005','b1b2c3d4-0000-0000-0002-000000000008','sb-h2rapid-001',   FALSE, 0.20,'T1499','e7h2g6i5d4f1...', 45000, NOW() - INTERVAL '1 days'),
  ('e1b2c3d4-0000-0000-0005-000000000006','b1b2c3d4-0000-0000-0002-000000000016','sb-vcenter-001',   TRUE,  0.91,'T1190','f8i3h7j6e5g2...', 22100, NOW() - INTERVAL '9 days'),
  ('e1b2c3d4-0000-0000-0005-000000000007','b1b2c3d4-0000-0000-0002-000000000018','sb-conflu-001',    TRUE,  0.97,'T1190','g9j4i8k7f6h3...', 9800,  NOW() - INTERVAL '19 days')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Patch Records (5 AI-generated patches)
-- =============================================================
INSERT INTO patch_records (patch_id, vuln_id, branch_name, commit_sha, pr_url, ci_status, resim_result, merge_status, authored_by)
VALUES
  ('p1b2c3d4-0000-0000-0006-000000000001','b1b2c3d4-0000-0000-0002-000000000001','sentinel/fix/CVE-2021-44228/java-api/20260301','abc123def456','https://github.com/org/repo/pull/101','passed','exploit_failed','approved','sentinel-ai'),
  ('p1b2c3d4-0000-0000-0006-000000000002','b1b2c3d4-0000-0000-0002-000000000002','sentinel/fix/CVE-2022-22965/java-api/20260302','def456ghi789','https://github.com/org/repo/pull/102','running','pending',       'open',    'sentinel-ai'),
  ('p1b2c3d4-0000-0000-0006-000000000003','b1b2c3d4-0000-0000-0002-000000000016','sentinel/fix/CVE-2023-34048/gke/20260225',      'ghi789jkl012','https://github.com/org/repo/pull/98', 'passed','exploit_failed','merged',  'sentinel-ai'),
  ('p1b2c3d4-0000-0000-0006-000000000004','b1b2c3d4-0000-0000-0002-000000000018','sentinel/fix/CVE-2022-26134/java-api/20260210', 'jkl012mno345','https://github.com/org/repo/pull/89', 'passed','exploit_failed','merged',  'sentinel-ai'),
  ('p1b2c3d4-0000-0000-0006-000000000005','b1b2c3d4-0000-0000-0002-000000000006','sentinel/fix/CVE-2023-46604/java-api/20260306','mno345pqr678','https://github.com/org/repo/pull/103','pending','pending',      'open',    'sentinel-ai')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Threat Feed (10 pre-enriched entries for instant dashboard display)
-- =============================================================
INSERT INTO threat_feed (cve_id, sync_source, description, cvss_v3, cwe_ids, published_at, epss_score, kev_status, exploit_available, exploit_maturity, patch_available, vendor, product, mitre_techniques, priority_score, synced_at)
VALUES
  ('CVE-2021-44228',ARRAY['nvd','kev'],'Apache Log4j2 JNDI injection RCE (Log4Shell)',10.0,ARRAY['CWE-502'],'2021-12-10',0.9750,TRUE, TRUE,'weaponized',TRUE,'Apache','Log4j2',           ARRAY['T1190','T1059'],98,NOW()),
  ('CVE-2022-22965',ARRAY['nvd','kev'],'Spring Framework RCE via data binding (Spring4Shell)',9.8,ARRAY['CWE-94'],'2022-03-31',0.9340,TRUE,TRUE,'weaponized',TRUE,'VMware','Spring Framework',ARRAY['T1190','T1059'],96,NOW()),
  ('CVE-2023-46604',ARRAY['nvd','kev'],'Apache ActiveMQ RCE via ClassInfo deserialization',10.0,ARRAY['CWE-502'],'2023-10-27',0.9823,TRUE,TRUE,'weaponized',TRUE,'Apache','ActiveMQ',       ARRAY['T1190','T1059'],98,NOW()),
  ('CVE-2024-3400', ARRAY['nvd','kev'],'PAN-OS GlobalProtect OS command injection RCE',10.0,ARRAY['CWE-77'], '2024-04-12',0.9612,TRUE,TRUE,'weaponized',TRUE,'Palo Alto','PAN-OS',          ARRAY['T1190','T1059'],98,NOW()),
  ('CVE-2023-4966', ARRAY['nvd','kev'],'Citrix Bleed — session token disclosure',9.4,ARRAY['CWE-200'],'2023-10-10',0.9450,TRUE,TRUE,'functional',TRUE,'Citrix','NetScaler ADC',            ARRAY['T1539','T1185'],94,NOW()),
  ('CVE-2024-21413',ARRAY['nvd','kev'],'Microsoft Outlook NTLM credential theft',9.8,ARRAY['CWE-20'], '2024-02-13',0.8910,TRUE,TRUE,'functional',TRUE,'Microsoft','Outlook',              ARRAY['T1566.001'],   92,NOW()),
  ('CVE-2024-1709', ARRAY['nvd','kev'],'ConnectWise ScreenConnect authentication bypass',10.0,ARRAY['CWE-287'],'2024-02-21',0.9530,TRUE,TRUE,'weaponized',TRUE,'ConnectWise','ScreenConnect',ARRAY['T1190','T1078'],98,NOW()),
  ('CVE-2024-6387', ARRAY['nvd','kev'],'OpenSSH regreSSHion — race condition RCE',8.1,ARRAY['CWE-364'],'2024-07-01',0.8870,TRUE,TRUE,'poc',       TRUE,'OpenBSD','OpenSSH',               ARRAY['T1110','T1190'],87,NOW()),
  ('CVE-2023-44487',ARRAY['nvd'],      'HTTP/2 Rapid Reset Attack — DoS amplification',7.5,ARRAY['CWE-400'],'2023-10-10',0.7230,FALSE,FALSE,NULL,         FALSE,NULL,NULL,                 ARRAY['T1499','T1499.001'],72,NOW()),
  ('CVE-2022-0847', ARRAY['nvd','kev'],'DirtyPipe — Linux kernel privilege escalation',7.8,ARRAY['CWE-416'],'2022-03-07',0.8621,TRUE,TRUE,'functional',TRUE,'Linux','Kernel',              ARRAY['T1068'],       84,NOW())
ON CONFLICT (cve_id) DO UPDATE SET
  synced_at = NOW(),
  updated_at = NOW();

-- =============================================================
-- Simulation Queue (5 pending jobs)
-- =============================================================
INSERT INTO simulation_queue (job_id, vuln_id, cve_id, module_id, target_host, target_port, priority, status, triggered_by, dry_run, scheduled_at)
VALUES
  ('q1b2c3d4-0000-0000-0007-000000000001','b1b2c3d4-0000-0000-0002-000000000003','CVE-2022-0847', 'lpe-dirty-pipe',    '10.0.1.10',80,10,'pending','auto-scheduler',TRUE, NOW() - INTERVAL '1 hour'),
  ('q1b2c3d4-0000-0000-0007-000000000002','b1b2c3d4-0000-0000-0002-000000000006','CVE-2023-46604','rce-log4shell',     '10.0.1.30',80,20,'pending','auto-scheduler',TRUE, NOW() - INTERVAL '2 hours'),
  ('q1b2c3d4-0000-0000-0007-000000000003','b1b2c3d4-0000-0000-0002-000000000007','CVE-2024-3400', 'web-sqli-basic',    '10.0.1.10',443,30,'pending','auto-scheduler',TRUE,NOW() - INTERVAL '3 hours'),
  ('q1b2c3d4-0000-0000-0007-000000000004','b1b2c3d4-0000-0000-0002-000000000009','CVE-2023-4966', 'auth-bruteforce',   '10.0.1.11',443,40,'pending','manual:admin', TRUE, NOW() - INTERVAL '30 minutes'),
  ('q1b2c3d4-0000-0000-0007-000000000005','b1b2c3d4-0000-0000-0002-000000000015','CVE-2024-6387', 'network-port-scan', '10.0.1.10',22, 50,'pending','auto-scheduler',TRUE, NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Sync Jobs (3 historical records)
-- =============================================================
INSERT INTO sync_jobs (job_id, type, status, cves_fetched, cves_new, cves_updated, sims_queued, started_at, completed_at, duration_ms)
VALUES
  ('s1b2c3d4-0000-0000-0008-000000000001','full',    'completed',42,12,8, 5, NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '5 hours 50 minutes', 580000),
  ('s1b2c3d4-0000-0000-0008-000000000002','cve_nvd', 'completed',18,4, 6, 2, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 55 minutes',320000),
  ('s1b2c3d4-0000-0000-0008-000000000003','kev',     'completed',3, 3, 0, 3, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '23 hours 58 minutes',90000)
ON CONFLICT DO NOTHING;

-- =============================================================
-- Integrations
-- =============================================================
INSERT INTO integrations (integration_id, org_id, category, tool_id, name, status)
VALUES
  ('c1b2c3d4-0000-0000-0003-000000000001','a1b2c3d4-0000-0000-0000-000000000001','codebase',   'github',  'GitHub — sentinel org',     'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000002','a1b2c3d4-0000-0000-0000-000000000001','codebase',   'gitlab',  'GitLab — internal',         'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000003','a1b2c3d4-0000-0000-0000-000000000001','cloud',      'aws',     'AWS — Production',          'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000004','a1b2c3d4-0000-0000-0000-000000000001','cloud',      'gcp',     'GCP — sentinelai-489513',   'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000005','a1b2c3d4-0000-0000-0000-000000000001','database',   'supabase','Supabase (PostgreSQL)',      'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000006','a1b2c3d4-0000-0000-0000-000000000001','database',   'neo4j',   'Neo4j Attack Graph',        'pending'),
  ('c1b2c3d4-0000-0000-0003-000000000007','a1b2c3d4-0000-0000-0000-000000000001','database',   'redis',   'Redis Cache',               'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000008','a1b2c3d4-0000-0000-0000-000000000001','monitoring', 'splunk',  'Splunk Enterprise SIEM',    'pending'),
  ('c1b2c3d4-0000-0000-0003-000000000009','a1b2c3d4-0000-0000-0000-000000000001','network',    'cloudflare','Cloudflare WAF',          'connected'),
  ('c1b2c3d4-0000-0000-0003-000000000010','a1b2c3d4-0000-0000-0000-000000000001','endpoint',   'jamf',    'Jamf Pro — macOS fleet',    'connected')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Audit Log
-- =============================================================
INSERT INTO audit_log (actor, action, resource_type, resource_id, payload)
VALUES
  ('sentinel-ai',    'exploit_simulation_completed', 'vulnerability',   'b1b2c3d4-0000-0000-0002-000000000001', '{"technique":"T1190","success":true,"confidence":0.95,"sandbox":"sb-log4shell-001"}'),
  ('sentinel-ai',    'patch_pr_created',             'patch_record',    'p1b2c3d4-0000-0000-0006-000000000001', '{"branch":"sentinel/fix/CVE-2021-44228","pr":"https://github.com/org/repo/pull/101"}'),
  ('sentinel-ai',    'vulnerability_escalated',      'vulnerability',   'b1b2c3d4-0000-0000-0002-000000000001', '{"from":"open","to":"in_progress","reason":"simulation_confirmed_exploitable"}'),
  ('sentinel-ai',    'cve_sync_completed',           'sync_job',        's1b2c3d4-0000-0000-0008-000000000001', '{"type":"full","fetched":42,"new":12,"updated":8,"sims_queued":5}'),
  ('admin@sentinel.io','integration_connected',      'integration',     'c1b2c3d4-0000-0000-0003-000000000001', '{"tool":"github","org":"sentinel-org"}'),
  ('admin@sentinel.io','integration_connected',      'integration',     'c1b2c3d4-0000-0000-0003-000000000004', '{"tool":"gcp","project":"sentinelai-489513"}'),
  ('sentinel-ai',    'simulation_queued',            'simulation_queue','q1b2c3d4-0000-0000-0007-000000000001', '{"cve":"CVE-2022-0847","module":"lpe-dirty-pipe","dry_run":true}');
