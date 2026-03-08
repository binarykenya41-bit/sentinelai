-- =============================================================
-- Sentinel AI — Expanded Development Seed Data
-- Run AFTER dev.sql (this extends it with more realistic volume)
-- psql $DATABASE_URL -f database/seeds/dev-expanded.sql
-- =============================================================

-- =============================================================
-- Additional Assets (40 more nodes — realistic enterprise)
-- =============================================================
INSERT INTO assets (asset_id, org_id, type, hostname, ip, tags, criticality, os_version, open_ports, patch_status, source, last_scan_at)
VALUES
  -- Additional servers
  ('a1b2c3d4-0000-0000-0001-000000000011','a1b2c3d4-0000-0000-0000-000000000001','server','api-prod-02',ARRAY['10.0.1.12'],ARRAY['production','backend','api'],'critical','Ubuntu 22.04.3 LTS',ARRAY[22,80,443,8080],'behind','aws',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000012','a1b2c3d4-0000-0000-0000-000000000001','server','api-prod-03',ARRAY['10.0.1.13'],ARRAY['production','backend','api'],'critical','Ubuntu 22.04.3 LTS',ARRAY[22,80,443,8080],'behind','aws',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000013','a1b2c3d4-0000-0000-0000-000000000001','server','web-nginx-02',ARRAY['10.0.1.21'],ARRAY['production','web','nginx'],'high','Ubuntu 22.04 LTS',ARRAY[80,443],'current','aws',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000014','a1b2c3d4-0000-0000-0000-000000000001','server','web-nginx-03',ARRAY['10.0.1.22'],ARRAY['production','web','nginx'],'high','Ubuntu 22.04 LTS',ARRAY[80,443],'current','aws',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000015','a1b2c3d4-0000-0000-0000-000000000001','server','mail-server-01',ARRAY['10.0.5.10'],ARRAY['production','mail','postfix'],'high','Ubuntu 20.04 LTS',ARRAY[25,587,993],'behind','aws',NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000016','a1b2c3d4-0000-0000-0000-000000000001','server','vpn-gateway-01',ARRAY['10.0.6.1'],ARRAY['production','network','vpn'],'critical','FortiOS 7.2.4',ARRAY[443,500,4500],'behind','manual',NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000017','a1b2c3d4-0000-0000-0000-000000000001','server','monitoring-01',ARRAY['10.0.3.20'],ARRAY['devops','monitoring','prometheus'],'medium','Ubuntu 22.04 LTS',ARRAY[9090,3000,9093],'current','manual',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000018','a1b2c3d4-0000-0000-0000-000000000001','server','backup-01',ARRAY['10.0.7.10'],ARRAY['production','backup','storage'],'high','Rocky Linux 9',ARRAY[22,873],'current','manual',NOW() - INTERVAL '6 hours'),
  -- Additional databases
  ('a1b2c3d4-0000-0000-0001-000000000019','a1b2c3d4-0000-0000-0000-000000000001','database','postgres-replica-01',ARRAY['10.0.2.11'],ARRAY['production','database','pgsql','replica'],'critical','PostgreSQL 15.3',ARRAY[5432],'behind','aws',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000020','a1b2c3d4-0000-0000-0000-000000000001','database','mysql-prod-01',ARRAY['10.0.2.30'],ARRAY['production','database','mysql'],'critical','MySQL 8.0.32',ARRAY[3306],'behind','aws',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000021','a1b2c3d4-0000-0000-0000-000000000001','database','redis-cache-02',ARRAY['10.0.2.21'],ARRAY['production','cache','redis'],'medium','Redis 7.0.11',ARRAY[6379],'current','aws',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000022','a1b2c3d4-0000-0000-0000-000000000001','database','elasticsearch-01',ARRAY['10.0.2.40'],ARRAY['production','search','elasticsearch'],'high','Elasticsearch 8.7.0',ARRAY[9200,9300],'current','aws',NOW() - INTERVAL '3 hours'),
  -- Additional containers
  ('a1b2c3d4-0000-0000-0001-000000000023','a1b2c3d4-0000-0000-0000-000000000001','container','payment-service',ARRAY['10.0.1.31'],ARRAY['production','payment','java'],'critical','OpenJDK 17.0.6',ARRAY[8080,8443],'behind','kubernetes',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000024','a1b2c3d4-0000-0000-0000-000000000001','container','notification-svc',ARRAY['10.0.1.32'],ARRAY['production','notification','node'],'medium','Node.js 18.16',ARRAY[3001],'current','kubernetes',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000025','a1b2c3d4-0000-0000-0000-000000000001','container','analytics-svc',ARRAY['10.0.1.33'],ARRAY['production','analytics','python'],'medium','Python 3.11',ARRAY[8000],'current','kubernetes',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000026','a1b2c3d4-0000-0000-0000-000000000001','container','gateway-svc',ARRAY['10.0.1.34'],ARRAY['production','gateway','go'],'high','Go 1.21',ARRAY[8080],'current','kubernetes',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000027','a1b2c3d4-0000-0000-0000-000000000001','container','user-svc',ARRAY['10.0.1.35'],ARRAY['production','user','node'],'high','Node.js 18.16',ARRAY[3002],'behind','kubernetes',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000028','a1b2c3d4-0000-0000-0000-000000000001','container','report-svc',ARRAY['10.0.1.36'],ARRAY['production','reporting','python'],'medium','Python 3.11',ARRAY[8001],'current','kubernetes',NOW() - INTERVAL '2 hours'),
  -- Cloud resources
  ('a1b2c3d4-0000-0000-0001-000000000029','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','s3-user-uploads',ARRAY[]::TEXT[],ARRAY['production','storage','s3','public'],'high',NULL,ARRAY[]::INT[],'current','aws',NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000030','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','s3-backups',ARRAY[]::TEXT[],ARRAY['production','storage','s3','private'],'medium',NULL,ARRAY[]::INT[],'current','aws',NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000031','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','cloudfront-cdn',ARRAY[]::TEXT[],ARRAY['production','cdn','cloudfront'],'medium',NULL,ARRAY[]::INT[],'current','aws',NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000032','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','api-gateway-prod',ARRAY[]::TEXT[],ARRAY['production','api','gateway','serverless'],'critical',NULL,ARRAY[]::INT[],'current','aws',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000033','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','lambda-processor',ARRAY[]::TEXT[],ARRAY['production','serverless','lambda'],'high',NULL,ARRAY[]::INT[],'current','aws',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000034','a1b2c3d4-0000-0000-0000-000000000001','cloud_resource','gke-cluster-dev',ARRAY['10.1.4.1'],ARRAY['development','kubernetes','gke'],'medium','GKE 1.27',ARRAY[443],'current','gcp',NOW() - INTERVAL '5 hours'),
  -- Endpoints
  ('a1b2c3d4-0000-0000-0001-000000000035','a1b2c3d4-0000-0000-0000-000000000001','endpoint','dev-macbook-02',ARRAY['192.168.1.51'],ARRAY['development','endpoint','macos'],'low','macOS 14.2',ARRAY[22],'current','jamf',NOW() - INTERVAL '12 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000036','a1b2c3d4-0000-0000-0000-000000000001','endpoint','dev-macbook-03',ARRAY['192.168.1.52'],ARRAY['development','endpoint','macos'],'low','macOS 13.5',ARRAY[22],'behind','jamf',NOW() - INTERVAL '12 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000037','a1b2c3d4-0000-0000-0000-000000000001','endpoint','win-workstation-01',ARRAY['192.168.1.100'],ARRAY['office','endpoint','windows'],'medium','Windows 11 22H2',ARRAY[]::INT[],'behind','intune',NOW() - INTERVAL '8 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000038','a1b2c3d4-0000-0000-0000-000000000001','endpoint','win-workstation-02',ARRAY['192.168.1.101'],ARRAY['office','endpoint','windows'],'medium','Windows 11 22H2',ARRAY[]::INT[],'current','intune',NOW() - INTERVAL '8 hours'),
  -- Network devices
  ('a1b2c3d4-0000-0000-0001-000000000039','a1b2c3d4-0000-0000-0000-000000000001','network_device','fw-perimeter-01',ARRAY['203.0.113.1'],ARRAY['production','firewall','fortinet'],'critical','FortiOS 7.2.4',ARRAY[443],'behind','manual',NOW() - INTERVAL '6 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000040','a1b2c3d4-0000-0000-0000-000000000001','network_device','sw-core-01',ARRAY['10.0.0.1'],ARRAY['production','switch','cisco'],'critical','Cisco IOS XE 17.9',ARRAY[22,443],'behind','manual',NOW() - INTERVAL '6 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000041','a1b2c3d4-0000-0000-0000-000000000001','network_device','sw-access-01',ARRAY['10.0.0.10'],ARRAY['office','switch','cisco'],'medium','Cisco IOS XE 17.7',ARRAY[22],'current','manual',NOW() - INTERVAL '6 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000042','a1b2c3d4-0000-0000-0000-000000000001','network_device','lb-prod-01',ARRAY['10.0.0.50'],ARRAY['production','loadbalancer','haproxy'],'critical','HAProxy 2.8',ARRAY[80,443,8404],'current','manual',NOW() - INTERVAL '4 hours'),
  -- Staging servers
  ('a1b2c3d4-0000-0000-0001-000000000043','a1b2c3d4-0000-0000-0000-000000000001','server','api-staging-01',ARRAY['10.1.1.10'],ARRAY['staging','backend','api'],'medium','Ubuntu 22.04.3 LTS',ARRAY[22,80,443,8080],'current','aws',NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000044','a1b2c3d4-0000-0000-0000-000000000001','server','web-staging-01',ARRAY['10.1.1.20'],ARRAY['staging','web','nginx'],'medium','Ubuntu 22.04 LTS',ARRAY[80,443],'current','aws',NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000045','a1b2c3d4-0000-0000-0000-000000000001','database','postgres-staging-01',ARRAY['10.1.2.10'],ARRAY['staging','database','pgsql'],'medium','PostgreSQL 15.3',ARRAY[5432],'current','aws',NOW() - INTERVAL '3 hours'),
  -- DevOps / CI
  ('a1b2c3d4-0000-0000-0001-000000000046','a1b2c3d4-0000-0000-0000-000000000001','server','ci-jenkins-02',ARRAY['10.0.3.11'],ARRAY['devops','jenkins','ci'],'high','Ubuntu 20.04 LTS',ARRAY[8080,443],'behind','manual',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000047','a1b2c3d4-0000-0000-0000-000000000001','server','artifact-registry-01',ARRAY['10.0.3.30'],ARRAY['devops','registry','docker'],'high','Ubuntu 22.04 LTS',ARRAY[443,5000],'current','manual',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000048','a1b2c3d4-0000-0000-0000-000000000001','server','secrets-vault-01',ARRAY['10.0.3.40'],ARRAY['production','secrets','vault'],'critical','HashiCorp Vault 1.14',ARRAY[8200,8201],'current','manual',NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0000-0000-0001-000000000049','a1b2c3d4-0000-0000-0000-000000000001','server','log-aggregator-01',ARRAY['10.0.3.50'],ARRAY['devops','logging','elk'],'medium','Ubuntu 22.04 LTS',ARRAY[5601,9200,5044],'current','manual',NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0001-000000000050','a1b2c3d4-0000-0000-0000-000000000001','server','cdn-origin-01',ARRAY['10.0.8.10'],ARRAY['production','cdn','origin'],'high','Ubuntu 22.04 LTS',ARRAY[80,443],'current','aws',NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Additional Vulnerabilities (30 more — real historical CVEs)
-- =============================================================
INSERT INTO vulnerabilities (vuln_id, cve_id, cvss_v3, cwe_ids, mitre_techniques, epss_score, kev_status, affected_assets, blast_radius, scan_source, remediation_status, detection_at)
VALUES
  -- New Critical KEV
  ('b1b2c3d4-0000-0000-0002-000000000021','CVE-2024-21762',9.8,ARRAY['CWE-787'],ARRAY['T1190'],0.9780,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000039'::UUID],'FortiOS VPN — internet-exposed firewalls','nessus','open',NOW() - INTERVAL '2 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000022','CVE-2024-26169',7.8,ARRAY['CWE-284'],ARRAY['T1068'],0.8340,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000037'::UUID,'a1b2c3d4-0000-0000-0001-000000000038'::UUID],'Windows Error Reporting LPE','nessus','open',NOW() - INTERVAL '3 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000023','CVE-2024-27198',9.8,ARRAY['CWE-288'],ARRAY['T1190','T1078'],0.9621,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000046'::UUID],'JetBrains TeamCity auth bypass — CI/CD compromise','nessus','open',NOW() - INTERVAL '4 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000024','CVE-2024-20359',6.0,ARRAY['CWE-347'],ARRAY['T1542.001'],0.7230,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000039'::UUID],'Cisco ASA persistent webshell','nessus','open',NOW() - INTERVAL '5 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000025','CVE-2023-48788',9.8,ARRAY['CWE-89'],ARRAY['T1190','T1059'],0.9450,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000016'::UUID],'Fortinet EMS SQL injection RCE','nessus','open',NOW() - INTERVAL '6 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000026','CVE-2024-22024',9.8,ARRAY['CWE-611'],ARRAY['T1190'],0.9120,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000016'::UUID],'Ivanti Connect Secure XXE bypass — auth bypass','nessus','open',NOW() - INTERVAL '7 hours'),
  -- High severity
  ('b1b2c3d4-0000-0000-0002-000000000027','CVE-2024-28987',9.1,ARRAY['CWE-798'],ARRAY['T1078'],0.8870,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000017'::UUID],'SolarWinds WHD hardcoded credentials','nessus','open',NOW() - INTERVAL '8 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000028','CVE-2024-23897',9.8,ARRAY['CWE-22'],ARRAY['T1190','T1083'],0.9340,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000009'::UUID,'a1b2c3d4-0000-0000-0001-000000000046'::UUID],'Jenkins path traversal arbitrary file read','nessus','in_progress',NOW() - INTERVAL '9 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000029','CVE-2024-24919',8.6,ARRAY['CWE-200'],ARRAY['T1552'],0.9560,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000039'::UUID],'Check Point VPN info disclosure — credentials leak','nessus','open',NOW() - INTERVAL '10 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000030','CVE-2024-37085',6.8,ARRAY['CWE-306'],ARRAY['T1078'],0.6230,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000010'::UUID,'a1b2c3d4-0000-0000-0001-000000000034'::UUID],'VMware ESXi auth bypass','trivy','open',NOW() - INTERVAL '11 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000031','CVE-2024-4978',8.6,ARRAY['CWE-78'],ARRAY['T1059','T1190'],0.8120,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000009'::UUID],'JAVS Viewer RCE supply chain attack','trivy','open',NOW() - INTERVAL '12 hours'),
  -- Container / Kubernetes
  ('b1b2c3d4-0000-0000-0002-000000000032','CVE-2024-21626',8.6,ARRAY['CWE-22'],ARRAY['T1611'],0.8670,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000023'::UUID,'a1b2c3d4-0000-0000-0001-000000000024'::UUID,'a1b2c3d4-0000-0000-0001-000000000025'::UUID],'runc container escape (Leaky Vessels)','trivy','in_progress',NOW() - INTERVAL '13 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000033','CVE-2023-2728',6.5,ARRAY['CWE-20'],ARRAY['T1611'],0.5410,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000010'::UUID],'Kubernetes mountable secrets bypass','trivy','open',NOW() - INTERVAL '14 hours'),
  -- Web / API
  ('b1b2c3d4-0000-0000-0002-000000000034','CVE-2024-34102',9.8,ARRAY['CWE-502'],ARRAY['T1190','T1059'],0.9730,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID,'a1b2c3d4-0000-0000-0001-000000000011'::UUID],'Adobe Commerce XXE/SSRF RCE chain','nessus','open',NOW() - INTERVAL '15 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000035','CVE-2024-38063',9.8,ARRAY['CWE-190'],ARRAY['T1190'],0.9450,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000037'::UUID,'a1b2c3d4-0000-0000-0001-000000000038'::UUID],'Windows TCP/IP RCE (IPv6)','nessus','open',NOW() - INTERVAL '16 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000036','CVE-2024-20017',9.8,ARRAY['CWE-787'],ARRAY['T1190'],0.8910,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000039'::UUID],'MediaTek WiFi OOB write — network device RCE','nessus','open',NOW() - INTERVAL '17 hours'),
  -- Database
  ('b1b2c3d4-0000-0000-0002-000000000037','CVE-2024-21894',9.1,ARRAY['CWE-416'],ARRAY['T1190'],0.8230,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000020'::UUID],'Ivanti Pulse Connect use-after-free RCE','nessus','open',NOW() - INTERVAL '18 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000038','CVE-2023-32315',7.5,ARRAY['CWE-22'],ARRAY['T1190','T1083'],0.9120,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000048'::UUID],'Openfire path traversal — secrets vault adjacent','trivy','open',NOW() - INTERVAL '19 hours'),
  -- Supply chain
  ('b1b2c3d4-0000-0000-0002-000000000039','CVE-2023-46747',9.8,ARRAY['CWE-306'],ARRAY['T1190','T1078'],0.9870,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000006'::UUID,'a1b2c3d4-0000-0000-0001-000000000013'::UUID],'F5 BIG-IP auth bypass RCE (unauthenticated)','nessus','open',NOW() - INTERVAL '20 hours'),
  ('b1b2c3d4-0000-0000-0002-000000000040','CVE-2024-5217',9.8,ARRAY['CWE-284'],ARRAY['T1190'],0.9340,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000032'::UUID],'ServiceNow EL injection RCE','nessus','open',NOW() - INTERVAL '21 hours'),
  -- More patched/verified for completeness
  ('b1b2c3d4-0000-0000-0002-000000000041','CVE-2023-0461',7.8,ARRAY['CWE-416'],ARRAY['T1068'],0.6780,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000001'::UUID],  'Linux kernel use-after-free net sockets','trivy','patched',NOW() - INTERVAL '30 days'),
  ('b1b2c3d4-0000-0000-0002-000000000042','CVE-2022-47986',9.8,ARRAY['CWE-502'],ARRAY['T1190'],0.9230,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000022'::UUID],'IBM Aspera Faspex deserialization RCE','trivy','patched',NOW() - INTERVAL '28 days'),
  ('b1b2c3d4-0000-0000-0002-000000000043','CVE-2023-22515',10.0,ARRAY['CWE-284'],ARRAY['T1190','T1078'],0.9760,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000048'::UUID],'Confluence Data Center privilege escalation','nessus','verified',NOW() - INTERVAL '25 days'),
  ('b1b2c3d4-0000-0000-0002-000000000044','CVE-2023-20273',7.2,ARRAY['CWE-78'],ARRAY['T1059'],0.8210,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000040'::UUID],'Cisco IOS XE web UI command injection','nessus','patched',NOW() - INTERVAL '22 days'),
  ('b1b2c3d4-0000-0000-0002-000000000045','CVE-2021-21985',9.8,ARRAY['CWE-20'],ARRAY['T1190'],0.9640,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000010'::UUID],'VMware vCenter RCE via vSAN plugin','trivy','verified',NOW() - INTERVAL '35 days'),
  ('b1b2c3d4-0000-0000-0002-000000000046','CVE-2022-1388',9.8,ARRAY['CWE-306'],ARRAY['T1190'],0.9780,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000042'::UUID],'F5 BIG-IP iControl REST auth bypass','nessus','patched',NOW() - INTERVAL '40 days'),
  ('b1b2c3d4-0000-0000-0002-000000000047','CVE-2023-35078',9.8,ARRAY['CWE-287'],ARRAY['T1190','T1078'],0.9530,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000016'::UUID],'Ivanti MobileIron auth bypass','nessus','verified',NOW() - INTERVAL '18 days'),
  ('b1b2c3d4-0000-0000-0002-000000000048','CVE-2024-1212',9.8,ARRAY['CWE-78'],ARRAY['T1059','T1190'],0.8870,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000039'::UUID],'Progress Telerik Report Server RCE','nessus','patched',NOW() - INTERVAL '15 days'),
  ('b1b2c3d4-0000-0000-0002-000000000049','CVE-2023-46298',7.5,ARRAY['CWE-400'],ARRAY['T1499'],0.7120,FALSE,ARRAY['a1b2c3d4-0000-0000-0001-000000000006'::UUID,'a1b2c3d4-0000-0000-0001-000000000013'::UUID,'a1b2c3d4-0000-0000-0001-000000000014'::UUID],'OpenResty/nginx DoS via null byte','trivy','patched',NOW() - INTERVAL '20 days'),
  ('b1b2c3d4-0000-0000-0002-000000000050','CVE-2024-0012',9.3,ARRAY['CWE-284'],ARRAY['T1190','T1078'],0.9680,TRUE,ARRAY['a1b2c3d4-0000-0000-0001-000000000039'::UUID],'PAN-OS management interface auth bypass','nessus','in_progress',NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Additional Exploit Results (15 more simulation records)
-- =============================================================
INSERT INTO exploit_results (result_id, vuln_id, sandbox_id, success, confidence, technique, payload_hash, duration_ms, executed_at)
VALUES
  ('e1b2c3d4-0000-0000-0005-000000000008','b1b2c3d4-0000-0000-0002-000000000023','sb-teamcity-001',TRUE, 0.96,'T1190','h1k5j9l8g7i4...', 6700,  NOW() - INTERVAL '3 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000009','b1b2c3d4-0000-0000-0002-000000000028','sb-jenkins-001', TRUE, 0.91,'T1083','i2l6k0m9h8j5...', 4200,  NOW() - INTERVAL '8 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000010','b1b2c3d4-0000-0000-0002-000000000032','sb-runc-001',    TRUE, 0.87,'T1611','j3m7l1n0i9k6...', 9800,  NOW() - INTERVAL '12 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000011','b1b2c3d4-0000-0000-0002-000000000039','sb-f5bigip-001', TRUE, 0.99,'T1190','k4n8m2o1j0l7...', 3100,  NOW() - INTERVAL '19 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000012','b1b2c3d4-0000-0000-0002-000000000021','sb-fortios-001', TRUE, 0.93,'T1190','l5o9n3p2k1m8...', 5500,  NOW() - INTERVAL '1 hour'),
  ('e1b2c3d4-0000-0000-0005-000000000013','b1b2c3d4-0000-0000-0002-000000000025','sb-fortinet-001',FALSE,0.25,'T1190','m6p0o4q3l2n9...', 7800,  NOW() - INTERVAL '5 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000014','b1b2c3d4-0000-0000-0002-000000000029','sb-vpn-001',     TRUE, 0.88,'T1552','n7q1p5r4m3o0...', 2300,  NOW() - INTERVAL '9 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000015','b1b2c3d4-0000-0000-0002-000000000034','sb-magento-001', TRUE, 0.94,'T1190','o8r2q6s5n4p1...', 11200, NOW() - INTERVAL '14 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000016','b1b2c3d4-0000-0000-0002-000000000035','sb-winipv6-001', FALSE,0.15,'T1190','p9s3r7t6o5q2...', 18900, NOW() - INTERVAL '15 hours'),
  ('e1b2c3d4-0000-0000-0005-000000000017','b1b2c3d4-0000-0000-0002-000000000041','sb-kernel2-001', FALSE,0.35,'T1068','q0t4s8u7p6r3...', 6100,  NOW() - INTERVAL '28 days'),
  ('e1b2c3d4-0000-0000-0005-000000000018','b1b2c3d4-0000-0000-0002-000000000043','sb-conflu2-001', TRUE, 0.97,'T1190','r1u5t9v8q7s4...', 4900,  NOW() - INTERVAL '24 days'),
  ('e1b2c3d4-0000-0000-0005-000000000019','b1b2c3d4-0000-0000-0002-000000000045','sb-vcenter2-001',TRUE, 0.95,'T1190','s2v6u0w9r8t5...', 8300,  NOW() - INTERVAL '34 days'),
  ('e1b2c3d4-0000-0000-0005-000000000020','b1b2c3d4-0000-0000-0002-000000000046','sb-f5rest-001',  TRUE, 0.98,'T1190','t3w7v1x0s9u6...', 2800,  NOW() - INTERVAL '39 days'),
  ('e1b2c3d4-0000-0000-0005-000000000021','b1b2c3d4-0000-0000-0002-000000000047','sb-ivanti2-001', TRUE, 0.92,'T1078','u4x8w2y1t0v7...', 5600,  NOW() - INTERVAL '17 days'),
  ('e1b2c3d4-0000-0000-0005-000000000022','b1b2c3d4-0000-0000-0002-000000000050','sb-panos-001',   TRUE, 0.96,'T1190','v5y9x3z2u1w8...', 7200,  NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Additional Patch Records (8 more)
-- =============================================================
INSERT INTO patch_records (patch_id, vuln_id, branch_name, commit_sha, pr_url, ci_status, resim_result, merge_status, authored_by)
VALUES
  ('f1b2c3d4-0000-0000-0006-000000000006','b1b2c3d4-0000-0000-0002-000000000023','sentinel/fix/CVE-2024-27198/jenkins-ci/20260307','pqr678stu901','https://github.com/org/repo/pull/104','running','pending',       'open',    'sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000007','b1b2c3d4-0000-0000-0002-000000000032','sentinel/fix/CVE-2024-21626/runc/20260306',       'stu901vwx234','https://github.com/org/repo/pull/103','running','pending',       'open',    'sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000008','b1b2c3d4-0000-0000-0002-000000000028','sentinel/fix/CVE-2024-23897/jenkins/20260306',    'vwx234yza567','https://github.com/org/repo/pull/102','passed','exploit_failed','approved','sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000009','b1b2c3d4-0000-0000-0002-000000000039','sentinel/fix/CVE-2023-46747/nginx/20260305',      'yza567abc890','https://github.com/org/repo/pull/101','failed','pending',       'blocked', 'sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000010','b1b2c3d4-0000-0000-0002-000000000041','sentinel/fix/CVE-2023-0461/kernel/20260205',      'abc890def123','https://github.com/org/repo/pull/88', 'passed','exploit_failed','merged',  'sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000011','b1b2c3d4-0000-0000-0002-000000000042','sentinel/fix/CVE-2022-47986/aspera/20260207',     'def123ghi456','https://github.com/org/repo/pull/90', 'passed','exploit_failed','merged',  'sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000012','b1b2c3d4-0000-0000-0002-000000000044','sentinel/fix/CVE-2023-20273/cisco-ios/20260213',  'ghi456jkl789','https://github.com/org/repo/pull/93', 'passed','exploit_failed','merged',  'sentinel-ai'),
  ('f1b2c3d4-0000-0000-0006-000000000013','b1b2c3d4-0000-0000-0002-000000000050','sentinel/fix/CVE-2024-0012/panos/20260307',      'jkl789mno012','https://github.com/org/repo/pull/105','pending','pending',       'open',    'sentinel-ai')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Compliance Reports (full ISO27001, SOC2, PCI DSS data)
-- =============================================================
INSERT INTO compliance_reports (report_id, org_id, framework, period_start, period_end, controls_mapped, evidence_refs, generated_at)
VALUES
  ('e1b2c3d4-0000-0000-0009-000000000001','a1b2c3d4-0000-0000-0000-000000000001','iso27001','2025-10-01','2025-12-31',
   '{"A.5.1":{"status":"pass","evidence":["policy-doc-v2.pdf"]},"A.6.1":{"status":"pass","evidence":["org-chart.pdf"]},"A.7.2":{"status":"fail","evidence":[]},"A.8.1":{"status":"pass","evidence":["asset-register-q4.xlsx"]},"A.8.2":{"status":"pass","evidence":["data-classification.pdf"]},"A.8.3":{"status":"fail","evidence":[]},"A.8.8":{"status":"fail","evidence":[]},"A.9.1":{"status":"pass","evidence":["access-policy.pdf"]},"A.9.2":{"status":"pass","evidence":["user-review-q4.pdf"]},"A.9.3":{"status":"fail","evidence":[]},"A.9.4":{"status":"pass","evidence":["mfa-report.pdf"]},"A.10.1":{"status":"pass","evidence":["crypto-policy.pdf"]},"A.11.1":{"status":"pass","evidence":["dc-access-log.pdf"]},"A.12.1":{"status":"pass","evidence":["change-log.xlsx"]},"A.12.2":{"status":"fail","evidence":[]},"A.12.4":{"status":"pass","evidence":["elk-logs.pdf"]},"A.12.6":{"status":"fail","evidence":[]},"A.13.1":{"status":"pass","evidence":["network-diagram.pdf"]},"A.14.1":{"status":"pass","evidence":["secure-sdlc.pdf"]},"A.14.2":{"status":"fail","evidence":[]},"A.15.1":{"status":"pass","evidence":["vendor-assessments.pdf"]},"A.16.1":{"status":"pass","evidence":["incident-response.pdf"]},"A.17.1":{"status":"pass","evidence":["bcp-doc.pdf"]},"A.18.1":{"status":"pass","evidence":["legal-review.pdf"]},"A.18.2":{"status":"fail","evidence":[]}}',
   ARRAY['policy-doc-v2.pdf','org-chart.pdf','asset-register-q4.xlsx','data-classification.pdf','access-policy.pdf','user-review-q4.pdf','mfa-report.pdf','crypto-policy.pdf','dc-access-log.pdf','change-log.xlsx','elk-logs.pdf','network-diagram.pdf','secure-sdlc.pdf','vendor-assessments.pdf','incident-response.pdf','bcp-doc.pdf','legal-review.pdf'],
   NOW() - INTERVAL '2 days'),
  ('e1b2c3d4-0000-0000-0009-000000000002','a1b2c3d4-0000-0000-0000-000000000001','soc2','2025-10-01','2025-12-31',
   '{"CC1.1":{"status":"pass","evidence":["org-structure.pdf"]},"CC1.2":{"status":"pass","evidence":["board-minutes.pdf"]},"CC2.1":{"status":"fail","evidence":[]},"CC2.2":{"status":"pass","evidence":["risk-register.xlsx"]},"CC3.1":{"status":"pass","evidence":["risk-assessment.pdf"]},"CC3.2":{"status":"fail","evidence":[]},"CC4.1":{"status":"pass","evidence":["monitoring-config.pdf"]},"CC5.1":{"status":"pass","evidence":["change-mgmt.pdf"]},"CC6.1":{"status":"pass","evidence":["access-review.pdf"]},"CC6.2":{"status":"fail","evidence":[]},"CC6.3":{"status":"pass","evidence":["network-seg.pdf"]},"CC7.1":{"status":"pass","evidence":["vuln-scan.pdf"]},"CC7.2":{"status":"fail","evidence":[]},"CC7.4":{"status":"pass","evidence":["incident-log.pdf"]},"CC8.1":{"status":"pass","evidence":["sdlc.pdf"]},"CC9.1":{"status":"pass","evidence":["vendor-mgmt.pdf"]},"CC9.2":{"status":"fail","evidence":[]}}',
   ARRAY['org-structure.pdf','board-minutes.pdf','risk-register.xlsx','risk-assessment.pdf','monitoring-config.pdf','change-mgmt.pdf','access-review.pdf','network-seg.pdf','vuln-scan.pdf','incident-log.pdf','sdlc.pdf','vendor-mgmt.pdf'],
   NOW() - INTERVAL '2 days'),
  ('e1b2c3d4-0000-0000-0009-000000000003','a1b2c3d4-0000-0000-0000-000000000001','pcidss','2025-10-01','2025-12-31',
   '{"1.1":{"status":"pass","evidence":["fw-rules.pdf"]},"1.2":{"status":"pass","evidence":["network-diagram.pdf"]},"2.1":{"status":"fail","evidence":[]},"2.2":{"status":"pass","evidence":["hardening-guide.pdf"]},"3.1":{"status":"pass","evidence":["data-retention.pdf"]},"3.4":{"status":"pass","evidence":["encryption-policy.pdf"]},"4.1":{"status":"pass","evidence":["tls-scan.pdf"]},"5.1":{"status":"pass","evidence":["av-report.pdf"]},"6.1":{"status":"fail","evidence":[]},"6.2":{"status":"fail","evidence":[]},"6.5":{"status":"pass","evidence":["sast-report.pdf"]},"7.1":{"status":"pass","evidence":["access-control.pdf"]},"8.1":{"status":"pass","evidence":["user-mgmt.pdf"]},"8.2":{"status":"pass","evidence":["mfa-config.pdf"]},"9.1":{"status":"pass","evidence":["dc-access.pdf"]},"10.1":{"status":"pass","evidence":["audit-logs.pdf"]},"10.2":{"status":"fail","evidence":[]},"11.1":{"status":"pass","evidence":["wireless-scan.pdf"]},"11.2":{"status":"fail","evidence":[]},"11.3":{"status":"pass","evidence":["pentest-report.pdf"]},"12.1":{"status":"pass","evidence":["security-policy.pdf"]},"12.6":{"status":"fail","evidence":[]}}',
   ARRAY['fw-rules.pdf','network-diagram.pdf','hardening-guide.pdf','data-retention.pdf','encryption-policy.pdf','tls-scan.pdf','av-report.pdf','sast-report.pdf','access-control.pdf','user-mgmt.pdf','mfa-config.pdf','dc-access.pdf','audit-logs.pdf','wireless-scan.pdf','pentest-report.pdf','security-policy.pdf'],
   NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Additional Threat Feed Entries (20 more CVEs)
-- =============================================================
INSERT INTO threat_feed (cve_id, sync_source, description, cvss_v3, cwe_ids, published_at, epss_score, kev_status, exploit_available, exploit_maturity, patch_available, vendor, product, mitre_techniques, priority_score, synced_at)
VALUES
  ('CVE-2024-21762',ARRAY['nvd','kev'],'Fortinet FortiOS SSL VPN out-of-bound write RCE',9.8,ARRAY['CWE-787'],'2024-02-08',0.9780,TRUE,TRUE,'weaponized',TRUE,'Fortinet','FortiOS',ARRAY['T1190'],98,NOW()),
  ('CVE-2024-27198',ARRAY['nvd','kev'],'JetBrains TeamCity authentication bypass CVE',9.8,ARRAY['CWE-288'],'2024-03-04',0.9621,TRUE,TRUE,'weaponized',TRUE,'JetBrains','TeamCity',ARRAY['T1190','T1078'],97,NOW()),
  ('CVE-2024-23897',ARRAY['nvd','kev'],'Jenkins arbitrary file read via CLI path traversal',9.8,ARRAY['CWE-22'],'2024-01-24',0.9340,TRUE,TRUE,'weaponized',TRUE,'Jenkins','Jenkins CI',ARRAY['T1190','T1083'],95,NOW()),
  ('CVE-2024-21626',ARRAY['nvd','kev'],'runc process.cwd container escape (Leaky Vessels)',8.6,ARRAY['CWE-22'],'2024-01-31',0.8670,TRUE,TRUE,'weaponized',TRUE,'OpenContainers','runc',ARRAY['T1611'],88,NOW()),
  ('CVE-2024-34102',ARRAY['nvd','kev'],'Adobe Commerce CosmicSting XXE to RCE',9.8,ARRAY['CWE-502'],'2024-06-11',0.9730,TRUE,TRUE,'weaponized',TRUE,'Adobe','Commerce/Magento',ARRAY['T1190','T1059'],97,NOW()),
  ('CVE-2024-38063',ARRAY['nvd','kev'],'Windows TCP/IP IPv6 remote code execution',9.8,ARRAY['CWE-190'],'2024-08-13',0.9450,TRUE,TRUE,'poc',TRUE,'Microsoft','Windows',ARRAY['T1190'],95,NOW()),
  ('CVE-2024-0012',ARRAY['nvd','kev'],'PAN-OS management web interface auth bypass',9.3,ARRAY['CWE-284'],'2024-11-18',0.9680,TRUE,TRUE,'weaponized',TRUE,'Palo Alto','PAN-OS',ARRAY['T1190','T1078'],96,NOW()),
  ('CVE-2023-46747',ARRAY['nvd','kev'],'F5 BIG-IP unauthenticated RCE via Config utility',9.8,ARRAY['CWE-306'],'2023-10-26',0.9870,TRUE,TRUE,'weaponized',TRUE,'F5','BIG-IP',ARRAY['T1190','T1078'],98,NOW()),
  ('CVE-2024-5217',ARRAY['nvd','kev'],'ServiceNow EL injection remote code execution',9.8,ARRAY['CWE-284'],'2024-07-10',0.9340,TRUE,TRUE,'weaponized',TRUE,'ServiceNow','Now Platform',ARRAY['T1190'],95,NOW()),
  ('CVE-2024-29824',ARRAY['nvd','kev'],'Ivanti EPM SQL injection unauthenticated RCE',9.8,ARRAY['CWE-89'],'2024-10-02',0.9560,TRUE,TRUE,'weaponized',TRUE,'Ivanti','Endpoint Manager',ARRAY['T1190','T1059'],97,NOW()),
  ('CVE-2023-48788',ARRAY['nvd','kev'],'Fortinet FortiClientEMS SQL injection RCE',9.8,ARRAY['CWE-89'],'2024-03-12',0.9450,TRUE,TRUE,'weaponized',TRUE,'Fortinet','FortiClientEMS',ARRAY['T1190','T1059'],96,NOW()),
  ('CVE-2024-22024',ARRAY['nvd','kev'],'Ivanti Connect Secure SAML XXE auth bypass',9.8,ARRAY['CWE-611'],'2024-02-08',0.9120,TRUE,TRUE,'weaponized',TRUE,'Ivanti','Connect Secure',ARRAY['T1190'],93,NOW()),
  ('CVE-2024-24919',ARRAY['nvd','kev'],'Check Point Quantum Gateway info disclosure',8.6,ARRAY['CWE-200'],'2024-05-28',0.9560,TRUE,TRUE,'weaponized',TRUE,'Check Point','Quantum Security Gateway',ARRAY['T1552'],90,NOW()),
  ('CVE-2024-3400',ARRAY['nvd','kev'],'PAN-OS GlobalProtect OS command injection',10.0,ARRAY['CWE-77'],'2024-04-12',0.9612,TRUE,TRUE,'weaponized',TRUE,'Palo Alto','PAN-OS',ARRAY['T1190','T1059'],98,NOW()),
  ('CVE-2024-26169',ARRAY['nvd','kev'],'Windows Error Reporting Service LPE',7.8,ARRAY['CWE-284'],'2024-03-12',0.8340,TRUE,TRUE,'functional',TRUE,'Microsoft','Windows',ARRAY['T1068'],83,NOW()),
  ('CVE-2024-28987',ARRAY['nvd','kev'],'SolarWinds Web Help Desk hardcoded credentials',9.1,ARRAY['CWE-798'],'2024-08-21',0.8870,TRUE,TRUE,'weaponized',TRUE,'SolarWinds','Web Help Desk',ARRAY['T1078'],92,NOW()),
  ('CVE-2024-37085',ARRAY['nvd','kev'],'VMware ESXi Active Directory integration bypass',6.8,ARRAY['CWE-306'],'2024-07-30',0.6230,TRUE,TRUE,'functional',TRUE,'VMware','ESXi',ARRAY['T1078'],68,NOW()),
  ('CVE-2023-2728',ARRAY['nvd'],'Kubernetes mountable secrets bypass via namespace',6.5,ARRAY['CWE-20'],'2023-06-16',0.5410,FALSE,TRUE,'poc',TRUE,'CNCF','Kubernetes',ARRAY['T1611'],55,NOW()),
  ('CVE-2024-21894',ARRAY['nvd','kev'],'Ivanti Pulse Connect Secure heap overflow RCE',9.1,ARRAY['CWE-416'],'2024-04-03',0.8230,TRUE,TRUE,'functional',TRUE,'Ivanti','Pulse Connect Secure',ARRAY['T1190'],91,NOW()),
  ('CVE-2024-20017',ARRAY['nvd'],'MediaTek MT7622/MT7915 WiFi OOB write',9.8,ARRAY['CWE-787'],'2024-03-04',0.8910,FALSE,TRUE,'poc',FALSE,NULL,'MediaTek WiFi',ARRAY['T1190'],89,NOW())
ON CONFLICT (cve_id) DO UPDATE SET
  synced_at = NOW(),
  updated_at = NOW();

-- =============================================================
-- Additional Audit Log entries
-- =============================================================
INSERT INTO audit_log (actor, action, resource_type, resource_id, payload)
VALUES
  ('sentinel-ai',      'exploit_simulation_completed','vulnerability',   'b1b2c3d4-0000-0000-0002-000000000023','{"technique":"T1190","success":true,"confidence":0.96,"sandbox":"sb-teamcity-001","cve":"CVE-2024-27198"}'),
  ('sentinel-ai',      'exploit_simulation_completed','vulnerability',   'b1b2c3d4-0000-0000-0002-000000000039','{"technique":"T1190","success":true,"confidence":0.99,"sandbox":"sb-f5bigip-001","cve":"CVE-2023-46747"}'),
  ('sentinel-ai',      'patch_pr_created',            'patch_record',    'f1b2c3d4-0000-0000-0006-000000000006','{"branch":"sentinel/fix/CVE-2024-27198","pr":"https://github.com/org/repo/pull/104"}'),
  ('sentinel-ai',      'patch_pr_created',            'patch_record',    'f1b2c3d4-0000-0000-0006-000000000007','{"branch":"sentinel/fix/CVE-2024-21626","pr":"https://github.com/org/repo/pull/103"}'),
  ('sentinel-ai',      'vulnerability_escalated',     'vulnerability',   'b1b2c3d4-0000-0000-0002-000000000021','{"from":"open","to":"open","reason":"simulation_confirmed_exploitable","cve":"CVE-2024-21762"}'),
  ('sentinel-ai',      'compliance_report_generated', 'compliance_report','e1b2c3d4-0000-0000-0009-000000000001','{"framework":"iso27001","period":"Q4 2025","pass_rate":0.67}'),
  ('sentinel-ai',      'compliance_report_generated', 'compliance_report','e1b2c3d4-0000-0000-0009-000000000002','{"framework":"soc2","period":"Q4 2025","pass_rate":0.70}'),
  ('sentinel-ai',      'compliance_report_generated', 'compliance_report','e1b2c3d4-0000-0000-0009-000000000003','{"framework":"pcidss","period":"Q4 2025","pass_rate":0.67}'),
  ('admin@sentinel.io','integration_connected',       'integration',     'c1b2c3d4-0000-0000-0003-000000000009','{"tool":"cloudflare","zones":3}'),
  ('sentinel-ai',      'asset_sync_completed',        'assets',          'all','{"source":"aws","added":12,"updated":28,"total":50}'),
  ('sentinel-ai',      'cve_sync_completed',          'sync_job',        's1b2c3d4-0000-0000-0008-000000000001','{"type":"nvd","fetched":185,"new":47,"updated":138}'),
  ('sentinel-ai',      'threat_feed_updated',         'threat_feed',     'all','{"total_entries":30,"new_kev":6,"high_priority":12}');

-- =============================================================
-- Additional Simulation Queue Jobs
-- =============================================================
INSERT INTO simulation_queue (job_id, vuln_id, cve_id, module_id, target_host, target_port, priority, status, triggered_by, dry_run, scheduled_at)
VALUES
  ('d1b2c3d4-0000-0000-0007-000000000006','b1b2c3d4-0000-0000-0002-000000000021','CVE-2024-21762','rce-log4shell',     '10.0.6.1',  443,5, 'pending','auto-scheduler',TRUE, NOW() - INTERVAL '30 minutes'),
  ('d1b2c3d4-0000-0000-0007-000000000007','b1b2c3d4-0000-0000-0002-000000000023','CVE-2024-27198','web-sqli-basic',    '10.0.3.11', 8080,10,'running','auto-scheduler',TRUE, NOW() - INTERVAL '15 minutes'),
  ('d1b2c3d4-0000-0000-0007-000000000008','b1b2c3d4-0000-0000-0002-000000000032','CVE-2024-21626','container-escape',  '10.0.1.31', 8080,15,'pending','auto-scheduler',TRUE, NOW() - INTERVAL '45 minutes'),
  ('d1b2c3d4-0000-0000-0007-000000000009','b1b2c3d4-0000-0000-0002-000000000050','CVE-2024-0012', 'web-ssrf-probe',    '10.0.6.1',  443,20,'pending','manual:admin',  TRUE, NOW() - INTERVAL '10 minutes'),
  ('d1b2c3d4-0000-0000-0007-000000000010','b1b2c3d4-0000-0000-0002-000000000039','CVE-2023-46747','auth-bruteforce',   '10.0.0.50', 443,25,'completed','auto-scheduler',TRUE, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;
