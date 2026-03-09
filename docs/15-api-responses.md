# Sentinel AI — Backend API Response Reference

All endpoints are served by the Fastify backend on port **8000**.
Base URL: `http://localhost:8000` (local) or your Render / Cloudflare Tunnel URL.

---

## Health

### `GET /health`
```json
{
  "status": "ok",
  "ts": "2026-03-09T12:00:00.000Z",
  "version": "0.2.0",
  "services": {
    "ai": true,
    "nvd": true,
    "epss": true,
    "kev": true,
    "mitre_stix": true,
    "vuldb": true,
    "simulation": true,
    "network_monitoring": true,
    "attack_graph": true,
    "cve_sync": true,
    "auto_simulation": false
  }
}
```

---

## Dashboard

### `GET /api/dashboard/stats`
```json
{
  "security_score": 72,
  "score_delta": 3,
  "last_scan": "2026-03-09T11:00:00.000Z",
  "vulnerabilities": {
    "total": 142,
    "open": 87,
    "in_progress": 12,
    "patched": 43,
    "verified": 0,
    "critical_open": 8,
    "kev_open": 4,
    "exploitable": 11,
    "new_today": 2
  },
  "assets": {
    "total": 34,
    "critical": 5,
    "behind_patch": 11,
    "by_type": { "server": 12, "container": 8, "api": 14 }
  },
  "simulations": {
    "total": 56,
    "successful": 31,
    "success_rate": 55.3,
    "new_today": 1
  },
  "patches": {
    "total": 43,
    "pending": 18,
    "merged": 25
  },
  "threat_feed": {
    "total": 3204,
    "kev": 218,
    "exploit_available": 607,
    "critical": 412
  }
}
```

### `GET /api/dashboard/activity?limit=20`
```json
[
  {
    "log_id": "uuid",
    "actor": "system",
    "action": "cve_sync",
    "resource_type": "vulnerability",
    "resource_id": "vuln-uuid",
    "payload": { "cve_id": "CVE-2024-1234" },
    "logged_at": "2026-03-09T10:45:00.000Z"
  }
]
```

### `GET /api/dashboard/compliance`
```json
[
  {
    "framework": "ISO 27001",
    "total_controls": 114,
    "passing": 89,
    "failing": 25,
    "score": 78,
    "generated_at": "2026-03-09T10:00:00.000Z"
  },
  {
    "framework": "SOC 2",
    "total_controls": 64,
    "passing": 52,
    "failing": 12,
    "score": 81,
    "generated_at": "2026-03-09T10:00:00.000Z"
  }
]
```

---

## Assets

### `GET /api/assets?limit=20&type=server&criticality=critical`
**Query params:** `type`, `criticality`, `patch_status`, `search`, `limit`, `offset`
```json
{
  "total": 34,
  "assets": [
    {
      "asset_id": "uuid",
      "org_id": "org-uuid",
      "type": "server",
      "hostname": "prod-web-01",
      "ip": ["10.0.1.10"],
      "tags": ["production", "web"],
      "criticality": "critical",
      "os_version": "Ubuntu 22.04",
      "open_ports": [80, 443, 22],
      "patch_status": "behind",
      "source": "manual",
      "last_scan_at": "2026-03-09T09:00:00.000Z",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/assets/stats`
```json
{
  "total": 34,
  "by_type": { "server": 12, "container": 8, "api": 14 },
  "by_criticality": { "critical": 5, "high": 10, "medium": 14, "low": 5 },
  "by_patch_status": { "current": 18, "behind": 11, "unknown": 5 },
  "by_source": { "manual": 20, "github": 8, "gcp": 6 }
}
```

### `GET /api/assets/:id`
Returns a single `Asset` object (same shape as list item above, with optional `open_vulnerabilities` array).

---

## Vulnerabilities

### `GET /api/vulnerabilities?limit=20&status=open&kev=true&min_cvss=7`
**Query params:** `status`, `kev`, `min_cvss`, `cve`, `limit`, `offset`
```json
{
  "total": 87,
  "vulnerabilities": [
    {
      "vuln_id": "uuid",
      "cve_id": "CVE-2021-44228",
      "cvss_v3": 10.0,
      "cwe_ids": ["CWE-502"],
      "mitre_techniques": ["T1190"],
      "epss_score": 0.972,
      "kev_status": true,
      "affected_assets": ["asset-uuid-1"],
      "blast_radius": "critical",
      "scan_source": "nvd",
      "remediation_status": "open",
      "detection_at": "2026-03-01T08:00:00.000Z"
    }
  ]
}
```

### `GET /api/vulnerabilities/stats`
```json
{
  "total": 142,
  "open": 87,
  "in_progress": 12,
  "patched": 43,
  "verified": 0,
  "critical": 8,
  "high": 24,
  "medium": 55,
  "low": 15,
  "kev_open": 4,
  "high_epss": 11,
  "by_source": { "nvd": 100, "manual": 42 },
  "top_techniques": [
    { "technique": "T1190", "count": 18 }
  ]
}
```

### `GET /api/vulnerabilities/:id`
Returns single `Vulnerability` with optional `exploit_history[]` and `patch_history[]` arrays.

### `PATCH /api/vulnerabilities/:id/status`
**Body:** `{ "status": "in_progress", "note": "Triaging" }`
**Response:** Updated `Vulnerability` object.

---

## Threat Feed

### `GET /api/sync/threat-feed?limit=20&kev=true&exploit=true&min_cvss=7`
**Query params:** `kev`, `exploit`, `min_cvss`, `limit`, `offset`
```json
{
  "total": 3204,
  "entries": [
    {
      "id": "uuid",
      "cve_id": "CVE-2021-44228",
      "sync_source": ["nvd", "kev", "epss"],
      "description": "Apache Log4j2 RCE via JNDI lookup",
      "cvss_v3": 10.0,
      "cwe_ids": ["CWE-502"],
      "published_at": "2021-12-10T00:00:00.000Z",
      "epss_score": 0.972,
      "kev_status": true,
      "exploit_available": true,
      "exploit_maturity": "weaponized",
      "patch_available": true,
      "vendor": "Apache",
      "product": "Log4j",
      "mitre_techniques": ["T1190"],
      "priority_score": 97,
      "synced_at": "2026-03-09T02:00:00.000Z"
    }
  ]
}
```

### `GET /api/sync/threat-feed/stats`
```json
{
  "total": 3204,
  "kev_count": 218,
  "exploit_available": 607,
  "weaponized": 42,
  "functional": 115,
  "poc": 450,
  "critical_cvss": 412,
  "high_cvss": 980,
  "avg_priority": 44.2,
  "top_techniques": [
    { "technique": "T1190", "count": 340 }
  ]
}
```

### `GET /api/sync/threat-feed/:cveId`
Returns a single `ThreatFeedEntry` object.

---

## Simulations

### `GET /api/simulation/results?limit=20&success=true`
**Query params:** `vuln_id`, `success`, `limit`
```json
[
  {
    "result_id": "uuid",
    "vuln_id": "vuln-uuid",
    "sandbox_id": "sandbox-abc123",
    "success": true,
    "confidence": 0.92,
    "technique": "T1190",
    "payload_hash": "sha256-abc",
    "duration_ms": 1430,
    "executed_at": "2026-03-09T11:30:00.000Z"
  }
]
```

### `GET /api/simulation/stats`
```json
{
  "total_simulations": 56,
  "successful": 31,
  "failed": 25,
  "success_rate": 55.3,
  "avg_confidence": 0.74,
  "avg_duration_ms": 2100,
  "top_techniques": [
    { "technique": "T1059", "count": 12 }
  ]
}
```

### `POST /api/simulation/run`
**Body:**
```json
{
  "vuln_id": "vuln-uuid",
  "cve_id": "CVE-2021-44228",
  "module_id": "log4shell",
  "target_host": "127.0.0.1",
  "target_port": 8080,
  "operator_id": "analyst-1",
  "dry_run": true
}
```
**Response:** `ExploitResult` object (same shape as simulation result).

---

## Attack Graph

### `POST /api/attack-graph/build-auto`
**Body:** `{}`
```json
{
  "nodes": [
    {
      "id": "CVE-2021-44228",
      "type": "cve",
      "label": "Log4Shell",
      "risk_score": 97,
      "cvss": 10.0,
      "epss": 0.972,
      "is_kev": true,
      "exploit_available": true,
      "tactic_phase": "initial-access"
    }
  ],
  "edges": [
    {
      "source": "CVE-2021-44228",
      "target": "T1190",
      "type": "exploits",
      "label": "Exploit Public-Facing Application",
      "weight": 0.97
    }
  ],
  "tactic_flow": ["initial-access", "execution", "lateral-movement"],
  "meta": {
    "cve_count": 8,
    "technique_count": 12,
    "tactic_count": 5,
    "generated_at": "2026-03-09T12:00:00.000Z"
  }
}
```

---

## Infrastructure Scanner

### `GET /api/infra-scan/catalog`
```json
{
  "services": [
    {
      "service_id": "gitlab",
      "name": "GitLab",
      "category": "DevOps",
      "default_host": "localhost",
      "default_port": 80,
      "description": "GitLab CE/EE version check and CVE scan"
    }
  ]
}
```

### `POST /api/infra-scan/run`
**Body:** `{ "targets": [{ "service_id": "gitlab", "host": "localhost", "port": 80 }] }`
```json
{
  "scan_id": "scan-uuid",
  "status": "running",
  "message": "Scan started — 6 services queued",
  "poll_url": "/api/infra-scan/scan-uuid"
}
```

### `GET /api/infra-scan/:scanId`
```json
{
  "scan_id": "scan-uuid",
  "started_at": "2026-03-09T12:00:00.000Z",
  "completed_at": "2026-03-09T12:01:30.000Z",
  "status": "completed",
  "results": [
    {
      "service_id": "grafana",
      "name": "Grafana",
      "category": "Monitoring",
      "host": "localhost",
      "port": 3000,
      "reachable": true,
      "status": "online",
      "detected_version": "9.5.2",
      "response_time_ms": 45,
      "fingerprint": { "server": "Grafana" },
      "vulnerabilities": [
        {
          "cve_id": "CVE-2021-43798",
          "title": "Grafana Path Traversal",
          "cvss_v3": 7.5,
          "severity": "HIGH",
          "epss_score": 0.941,
          "kev": true,
          "exploit_available": true,
          "description": "Arbitrary file read via plugin API path traversal",
          "mitre_techniques": ["T1083"],
          "tactic": "Discovery",
          "patch": "Upgrade to Grafana >= 8.3.1",
          "affected_versions": "< 8.3.1"
        }
      ],
      "risk_score": 78,
      "highest_severity": "HIGH"
    }
  ],
  "attack_graph": { "nodes": [], "edges": [], "tactic_flow": [] },
  "summary": {
    "services_scanned": 6,
    "services_online": 5,
    "total_vulnerabilities": 14,
    "critical_vulns": 2,
    "high_vulns": 8,
    "kev_count": 3,
    "exploitable_count": 5,
    "overall_risk_score": 73
  }
}
```

### `GET /api/infra-scan/latest`
Same shape as `GET /api/infra-scan/:scanId`. Returns `404` if no scan has been run.

---

## Integrations

### `GET /api/integrations/status`
```json
[
  {
    "name": "GitHub",
    "service_id": "github",
    "category": "DevOps",
    "status": "Connected",
    "port": 443,
    "lastSync": "2026-03-09T11:00:00.000Z",
    "risk_score": 0,
    "vuln_count": 0
  }
]
```

---

## Patches

### `GET /api/patches?limit=20&ci_status=passed&merge_status=pending`
**Query params:** `ci_status`, `merge_status`, `limit`, `offset`
```json
{
  "total": 43,
  "patches": [
    {
      "patch_id": "uuid",
      "vuln_id": "vuln-uuid",
      "branch_name": "fix/cve-2021-44228",
      "commit_sha": "abc1234",
      "pr_url": "https://github.com/org/repo/pull/42",
      "ci_status": "passed",
      "resim_result": "fixed",
      "merge_status": "pending",
      "authored_by": "sentinel-ai",
      "created_at": "2026-03-08T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/patches/stats`
```json
{
  "total": 43,
  "ci_passing": 28,
  "ci_failing": 5,
  "ci_running": 3,
  "merged": 25,
  "pending_merge": 7,
  "blocked": 2,
  "exploit_confirmed_fixed": 15,
  "exploit_still_works": 3
}
```

### `GET /api/patches/:id`
Returns single `PatchRecord` with optional `vulnerabilities` object.

### `POST /api/patches/generate`
**Body:** `{ "vuln_id": "vuln-uuid" }`
**Response:** `PatchRecord` with additional `patch_explanation` (string) and `pr_url` (string|null).

---

## Incidents

### `GET /api/incidents?limit=20&status=open&severity=critical`
```json
{
  "total": 12,
  "incidents": [
    {
      "incident_id": "uuid",
      "title": "Log4Shell exploitation attempt detected",
      "severity": "critical",
      "category": "intrusion",
      "status": "open",
      "assigned_to": "alice@acme.com",
      "affected_assets": ["asset-uuid"],
      "description": "JNDI lookup string in HTTP headers",
      "progress": 20,
      "mttr_hours": null,
      "sla_deadline": "2026-03-10T12:00:00.000Z",
      "resolved_at": null,
      "created_at": "2026-03-09T09:00:00.000Z"
    }
  ]
}
```

### `GET /api/incidents/stats`
```json
{
  "active": 5,
  "resolved_30d": 18,
  "avg_mttr": 4.2,
  "open_playbooks": 3,
  "by_severity": { "critical": 2, "high": 3, "medium": 5, "low": 2 },
  "by_status": { "open": 5, "investigating": 3, "resolved": 4 }
}
```

### `GET /api/incidents/playbooks`
```json
[
  {
    "id": "uuid",
    "name": "Ransomware Response",
    "steps": 12,
    "avg_time_hours": 6,
    "status": "active",
    "last_used": "2026-03-01T00:00:00.000Z"
  }
]
```

### `POST /api/incidents`
**Body:** `{ "title": "...", "severity": "critical", "category": "intrusion", "assigned_to": "alice@acme.com", "affected_assets": ["uuid"], "description": "..." }`
**Response:** Created `Incident` object.

### `PATCH /api/incidents/:id`
**Body:** `{ "status": "investigating", "progress": 40, "assigned_to": "bob@acme.com" }`
**Response:** Updated `Incident` object.

---

## Risks

### `GET /api/risks?limit=20&status=open&category=technical`
```json
{
  "total": 24,
  "risks": [
    {
      "risk_id": "uuid",
      "title": "Unpatched critical CVEs in production",
      "category": "technical",
      "likelihood": 4,
      "impact": 5,
      "risk_score": 20,
      "status": "open",
      "owner": "security@acme.com",
      "mitigation": "Emergency patch rollout",
      "review_date": "2026-03-15T00:00:00.000Z",
      "created_at": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/risks/stats`
```json
{
  "total": 24,
  "critical": 3,
  "high": 8,
  "medium": 10,
  "low": 3,
  "by_category": { "technical": 12, "compliance": 6, "operational": 6 },
  "by_status": { "open": 14, "mitigated": 7, "accepted": 3 }
}
```

---

## DevSecOps

### `GET /api/devsecops/pipelines?limit=10&status=failed`
```json
{
  "total": 28,
  "pipelines": [
    {
      "pipeline_id": "uuid",
      "name": "main-ci",
      "repo": "acme/api",
      "branch": "main",
      "status": "failed",
      "stage": "sast",
      "sbom_findings": 12,
      "secrets_count": 1,
      "sast_issues": 5,
      "dast_issues": 0,
      "policy_pass": false,
      "run_at": "2026-03-09T10:00:00.000Z",
      "duration_ms": 180000,
      "created_at": "2026-03-09T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/devsecops/stats`
```json
{
  "total": 28,
  "passed": 18,
  "failed": 6,
  "running": 2,
  "sbom_findings": 87,
  "secrets_detected": 4,
  "sast_issues": 23,
  "dast_issues": 8,
  "policy_pass_rate": 78.5
}
```

### `GET /api/devsecops/sbom?pipeline_id=uuid`
```json
[
  {
    "id": "uuid",
    "pipeline_id": "uuid",
    "component": "lodash",
    "version": "4.17.20",
    "cve_id": "CVE-2021-23337",
    "severity": "HIGH",
    "license": "MIT",
    "fix_version": "4.17.21"
  }
]
```

### `GET /api/devsecops/policies`
```json
[
  {
    "id": "uuid",
    "name": "No critical CVEs in production images",
    "status": "failing",
    "failures": 2,
    "description": "Container images must have zero critical CVEs before deploy"
  }
]
```

---

## Cloud Security

### `GET /api/cloud-security?limit=20&provider=aws&severity=CRITICAL`
```json
{
  "total": 45,
  "findings": [
    {
      "finding_id": "uuid",
      "provider": "aws",
      "resource_id": "sg-abc123",
      "resource_type": "security_group",
      "rule_id": "sg-open-ssh",
      "title": "Security group allows unrestricted SSH access",
      "severity": "CRITICAL",
      "status": "open",
      "region": "eu-west-1",
      "account_id": "123456789012",
      "description": "Port 22 is open to 0.0.0.0/0",
      "remediation": "Restrict SSH to known IP ranges",
      "detected_at": "2026-03-09T08:00:00.000Z",
      "resolved_at": null,
      "created_at": "2026-03-09T08:00:00.000Z"
    }
  ]
}
```

### `GET /api/cloud-security/stats`
```json
{
  "total": 45,
  "open": 32,
  "critical": 8,
  "high": 14,
  "resolved": 13,
  "by_severity": { "CRITICAL": 8, "HIGH": 14, "MEDIUM": 15, "LOW": 8 },
  "by_provider": { "aws": 28, "gcp": 17 },
  "provider_scores": {
    "aws": { "total": 28, "open": 20, "score": 64 },
    "gcp": { "total": 17, "open": 12, "score": 71 }
  }
}
```

---

## Code Scanning

### `GET /api/code-scanning?limit=20&tool=semgrep&severity=HIGH`
```json
{
  "total": 67,
  "findings": [
    {
      "finding_id": "uuid",
      "repo": "acme/api",
      "tool": "semgrep",
      "rule_id": "python.lang.security.audit.exec-detected",
      "title": "Use of exec() with user-controlled input",
      "severity": "HIGH",
      "category": "injection",
      "file_path": "src/utils/eval.py",
      "line_number": 42,
      "status": "open",
      "branch": "main",
      "pr_url": null,
      "detected_at": "2026-03-09T09:00:00.000Z",
      "resolved_at": null,
      "created_at": "2026-03-09T09:00:00.000Z"
    }
  ]
}
```

### `GET /api/code-scanning/stats`
```json
{
  "total": 67,
  "open": 45,
  "critical": 3,
  "high": 18,
  "resolved": 22,
  "by_tool": { "semgrep": 40, "codeql": 27 },
  "by_severity": { "CRITICAL": 3, "HIGH": 18, "MEDIUM": 30, "LOW": 16 },
  "by_category": { "injection": 12, "xss": 8, "secrets": 5 },
  "repo_scores": [
    { "repo": "acme/api", "score": 65, "critical": 2, "high": 8, "medium": 15 }
  ]
}
```

---

## Container Security

### `GET /api/container-security?limit=20`
```json
{
  "total": 18,
  "scans": [
    {
      "scan_id": "uuid",
      "image": "acme/api",
      "tag": "v1.2.3",
      "registry": "ghcr.io",
      "critical_vulns": 2,
      "high_vulns": 8,
      "medium_vulns": 12,
      "low_vulns": 5,
      "total_vulns": 27,
      "status": "vulnerable",
      "policy_pass": false,
      "runtime_alerts": 0,
      "base_image": "node:20-alpine",
      "scanned_at": "2026-03-09T08:00:00.000Z",
      "created_at": "2026-03-09T08:00:00.000Z"
    }
  ]
}
```

### `GET /api/container-security/stats`
```json
{
  "total_images": 18,
  "clean": 6,
  "vulnerable": 12,
  "critical": 3,
  "policy_pass": 8,
  "policy_fail": 10,
  "total_vulns": 224,
  "critical_vulns": 12,
  "high_vulns": 58,
  "runtime_alerts": 4
}
```

---

## Malware Analysis

### `GET /api/malware?limit=20&verdict=malicious`
```json
{
  "total": 14,
  "samples": [
    {
      "sample_id": "uuid",
      "filename": "invoice-march.pdf.exe",
      "hash_sha256": "abc123...",
      "file_type": "PE32",
      "verdict": "malicious",
      "threat_family": "Emotet",
      "confidence": 0.97,
      "iocs": [{ "type": "domain", "value": "evil.example.com" }],
      "mitre_techniques": ["T1566", "T1059"],
      "sandbox_env": "windows10-x64",
      "analysis_duration_ms": 45000,
      "analyzed_at": "2026-03-09T10:00:00.000Z",
      "created_at": "2026-03-09T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/malware/stats`
```json
{
  "total": 14,
  "malicious": 9,
  "suspicious": 3,
  "clean": 2,
  "families": ["Emotet", "AgentTesla", "RedLine"],
  "avg_confidence": 0.89,
  "top_techniques": [
    { "technique": "T1566", "count": 7 }
  ]
}
```

---

## Zero-Day

### `GET /api/zero-day?limit=20&status=unpatched&severity=CRITICAL`
```json
{
  "total": 6,
  "zero_days": [
    {
      "zd_id": "uuid",
      "title": "OpenSSH pre-auth RCE",
      "cve_id": "CVE-2024-6387",
      "affected_product": "OpenSSH",
      "vendor": "OpenBSD",
      "severity": "CRITICAL",
      "status": "unpatched",
      "epss_score": 0.42,
      "exploit_maturity": "weaponized",
      "description": "Signal handler race condition in sshd",
      "behavior_signals": ["unusual_process_spawn", "network_scan"],
      "discovered_at": "2024-07-01T00:00:00.000Z",
      "patched_at": null,
      "created_at": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/zero-day/stats`
```json
{
  "total": 6,
  "unpatched": 4,
  "critical": 3,
  "weaponized": 2,
  "avg_epss": 0.38,
  "by_status": { "unpatched": 4, "patched": 2 },
  "by_severity": { "CRITICAL": 3, "HIGH": 2, "MEDIUM": 1 },
  "by_maturity": { "weaponized": 2, "functional": 1, "poc": 3 }
}
```

---

## Red Team

### `GET /api/red-team?limit=10&status=active`
```json
{
  "total": 8,
  "campaigns": [
    {
      "campaign_id": "uuid",
      "name": "Q1 2026 External Pentest",
      "status": "active",
      "objective": "Test external attack surface",
      "operator": "red-team@acme.com",
      "target_scope": ["api.acme.com", "admin.acme.com"],
      "start_date": "2026-03-01T00:00:00.000Z",
      "end_date": "2026-03-31T00:00:00.000Z",
      "kill_chain_stage": "exploitation",
      "findings": 12,
      "critical_findings": 2,
      "description": "External perimeter assessment",
      "created_at": "2026-02-28T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/red-team/stats`
```json
{
  "total": 8,
  "active": 2,
  "completed": 5,
  "planned": 1,
  "total_findings": 87,
  "critical_findings": 9,
  "by_kill_chain": {
    "reconnaissance": 12,
    "weaponization": 8,
    "exploitation": 34,
    "lateral-movement": 18,
    "exfiltration": 15
  }
}
```

---

## Endpoint Security (EDR)

### `GET /api/endpoint-security?limit=20&status=active&severity=CRITICAL`
```json
{
  "total": 34,
  "alerts": [
    {
      "alert_id": "uuid",
      "endpoint": "endpoint-uuid",
      "hostname": "WORKSTATION-42",
      "os": "Windows 11",
      "severity": "CRITICAL",
      "technique_id": "T1059.001",
      "technique_name": "PowerShell",
      "tactic": "Execution",
      "status": "active",
      "process_name": "powershell.exe",
      "description": "Encoded PowerShell command executed with AMSI bypass",
      "detected_at": "2026-03-09T11:00:00.000Z",
      "resolved_at": null,
      "created_at": "2026-03-09T11:00:00.000Z"
    }
  ]
}
```

### `GET /api/endpoint-security/stats`
```json
{
  "total_alerts": 34,
  "active": 12,
  "resolved": 18,
  "false_positives": 4,
  "critical": 5,
  "by_severity": { "CRITICAL": 5, "HIGH": 12, "MEDIUM": 11, "LOW": 6 },
  "by_tactic": { "Execution": 14, "Persistence": 6, "Discovery": 8, "Exfiltration": 6 },
  "top_techniques": [{ "technique": "T1059.001", "count": 8 }],
  "total_endpoints": 142,
  "compliant_endpoints": 128
}
```

### `GET /api/endpoint-security/endpoints`
```json
[
  {
    "id": "endpoint-uuid",
    "hostname": "WORKSTATION-42",
    "os": "Windows 11",
    "alerts": 5,
    "active_alerts": 2,
    "last_alert": "2026-03-09T11:00:00.000Z"
  }
]
```

---

## Dark Web

### `GET /api/dark-web?limit=20&category=credentials&severity=CRITICAL`
```json
{
  "total": 11,
  "findings": [
    {
      "finding_id": "uuid",
      "category": "credentials",
      "title": "Employee credentials found in breach forum",
      "source": "BreachForums",
      "severity": "CRITICAL",
      "status": "investigating",
      "description": "500 employee email/password pairs from Q4 2025 breach",
      "affected_data": "email, password_hash",
      "threat_actor": "unknown",
      "discovered_at": "2026-03-08T00:00:00.000Z",
      "created_at": "2026-03-08T06:00:00.000Z"
    }
  ]
}
```

### `GET /api/dark-web/stats`
```json
{
  "total": 11,
  "new": 3,
  "investigating": 5,
  "critical": 4,
  "threat_actors": 2,
  "by_category": { "credentials": 6, "ip_theft": 2, "ransomware": 3 },
  "by_severity": { "CRITICAL": 4, "HIGH": 4, "MEDIUM": 3 },
  "by_status": { "new": 3, "investigating": 5, "resolved": 3 }
}
```

---

## Phishing

### `GET /api/phishing?limit=10&status=completed`
```json
{
  "total": 15,
  "campaigns": [
    {
      "campaign_id": "uuid",
      "name": "Q1 2026 Awareness Test",
      "status": "completed",
      "target_department": "Finance",
      "recipients_count": 42,
      "opened_count": 28,
      "clicked_count": 12,
      "submitted_count": 3,
      "reported_count": 8,
      "start_date": "2026-02-01T00:00:00.000Z",
      "end_date": "2026-02-14T00:00:00.000Z",
      "template_name": "Invoice Phish",
      "created_at": "2026-01-28T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/phishing/stats`
```json
{
  "total": 15,
  "active": 2,
  "completed": 12,
  "scheduled": 1,
  "total_recipients": 620,
  "total_clicked": 98,
  "total_submitted": 22,
  "total_reported": 145,
  "click_rate": 15.8,
  "report_rate": 23.4,
  "dept_risk": [
    { "department": "Finance", "click_rate": 28.5, "submitted_rate": 7.1 }
  ]
}
```

---

## Settings

### `GET /api/settings`
```json
{
  "setting_id": "uuid",
  "org_id": "org-uuid",
  "org_name": "Acme Corp",
  "settings": {
    "auto_sim_enabled": false,
    "min_cvss_threshold": 7.0,
    "default_assignee": "security@acme.com",
    "slack_webhook": null
  },
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2026-03-09T12:00:00.000Z"
}
```

### `PUT /api/settings`
**Body:** `{ "org_name": "Acme Corp", "settings": { "auto_sim_enabled": true } }`
**Response:** Updated `OrgSettings` object.

---

## Infrastructure Nodes

### `GET /api/infrastructure?limit=20&type=server&environment=production`
```json
{
  "total": 28,
  "nodes": [
    {
      "node_id": "uuid",
      "org_id": "org-uuid",
      "name": "prod-web-01",
      "type": "server",
      "environment": "production",
      "ip_address": "10.0.1.10",
      "hostname": "prod-web-01.acme.internal",
      "os_name": "Ubuntu",
      "os_version": "22.04",
      "patch_status": "behind",
      "known_cves": ["CVE-2021-44228"],
      "external_tool": "crowdstrike",
      "firewall_present": true,
      "endpoint_agent": "crowdstrike_falcon",
      "description": "Primary web server",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/infrastructure/stats`
```json
{
  "total": 28,
  "by_type": { "server": 14, "container": 8, "network_device": 6 },
  "by_environment": { "production": 12, "staging": 10, "dev": 6 },
  "by_patch_status": { "current": 16, "behind": 8, "unknown": 4 },
  "by_source": { "manual": 20, "crowdstrike": 8 },
  "vulnerable": 6,
  "behind_patches": 8
}
```

---

## Logistics Lab

### `GET /api/logistics/status`
```json
{
  "services": [
    {
      "service": "redis",
      "label": "Redis Tracking Cache",
      "port": 9379,
      "up": true,
      "cve": "CVE-2022-0543",
      "cvss": 10.0
    },
    {
      "service": "erpnext",
      "label": "ERPNext ERP",
      "port": 9000,
      "up": false,
      "cve": "CVE-2023-46127",
      "cvss": 8.3
    },
    {
      "service": "kafka",
      "label": "Kafka Message Bus",
      "port": 9092,
      "up": true,
      "cve": "CVE-2023-25194",
      "cvss": 8.8
    },
    {
      "service": "grafana",
      "label": "Grafana Dashboard",
      "port": 9100,
      "up": true,
      "cve": "CVE-2021-43798",
      "cvss": 7.5
    },
    {
      "service": "prometheus",
      "label": "Prometheus Metrics",
      "port": 9191,
      "up": true,
      "cve": "CVE-2019-3826",
      "cvss": 5.4
    },
    {
      "service": "postgres",
      "label": "PostgreSQL Shipment DB",
      "port": 9432,
      "up": true,
      "cve": "CVE-2024-0985",
      "cvss": 8.0
    }
  ],
  "checked_at": "2026-03-09T12:00:00.000Z"
}
```

### `POST /api/logistics/exploit`
**Body:** `{ "service": "redis", "target_host": "localhost" }`
**Supported service keys:** `redis`, `erpnext`, `kafka`, `grafana`, `prometheus`, `postgres`
```json
{
  "result_id": "uuid",
  "service": "redis",
  "label": "Redis Tracking Cache",
  "cve": "CVE-2022-0543",
  "cvss": 10.0,
  "technique": "T1210",
  "success": true,
  "confidence": 0.88,
  "exit_code": 0,
  "duration_ms": 1234,
  "output": "[+] Redis accessible without auth\n[+] KEYS enumeration: 23 keys\n[+] CVE-2022-0543 Lua sandbox escape: CONFIRMED\n..."
}
```

### `POST /api/logistics/seed`
**Body:** `{}`
```json
{
  "ok": true,
  "assets_seeded": 6,
  "assets_existing": 0,
  "vulns_seeded": 6,
  "vulns_existing": 0,
  "total_vulns": 6,
  "vuln_ids": {
    "redis": "vuln-uuid-1",
    "erpnext": "vuln-uuid-2",
    "kafka": "vuln-uuid-3",
    "grafana": "vuln-uuid-4",
    "prometheus": "vuln-uuid-5",
    "postgres": "vuln-uuid-6"
  }
}
```
Idempotent — subsequent calls return `assets_existing: 6, assets_seeded: 0`.

### `GET /api/logistics/vulnerabilities`
```json
{
  "vulnerabilities": [
    {
      "vuln_id": "uuid",
      "cve_id": "CVE-2022-0543",
      "cvss_v3": 10.0,
      "remediation_status": "open",
      "kev_status": false
    }
  ]
}
```

### `GET /api/logistics/results`
```json
{
  "vulns": [{ "vuln_id": "uuid", "cve_id": "CVE-2022-0543" }],
  "results": [
    {
      "result_id": "uuid",
      "vuln_id": "vuln-uuid",
      "success": true,
      "confidence": 0.88,
      "technique": "T1210",
      "executed_at": "2026-03-09T12:00:00.000Z"
    }
  ],
  "logistics_cves": [
    "CVE-2022-0543",
    "CVE-2023-46127",
    "CVE-2023-25194",
    "CVE-2021-43798",
    "CVE-2019-3826",
    "CVE-2024-0985"
  ]
}
```

---

## Intel

### `GET /api/intel/cve/:id`
```json
{
  "cve_id": "CVE-2021-44228",
  "description": "Apache Log4j2 <=2.14.1 JNDI features used in configuration, log messages, and parameters do not protect against attacker-controlled LDAP and other JNDI related endpoints.",
  "cvss_v3": 10.0,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
  "cwe_ids": ["CWE-502", "CWE-917"],
  "published_at": "2021-12-10T10:15:00.000Z",
  "last_modified_at": "2023-04-03T00:00:00.000Z",
  "references": ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228"]
}
```

### `GET /api/intel/cve/:id/enriched`
Returns enriched CVE with NVD + EPSS + KEV + MITRE + VulDB data merged.

### `GET /api/intel/epss/:cveId`
```json
{
  "cve": "CVE-2021-44228",
  "epss": 0.97217,
  "percentile": 0.99997,
  "date": "2026-03-09"
}
```

### `GET /api/intel/epss/top?limit=20&min=0.9`
Returns array of top EPSS CVEs.

### `GET /api/intel/kev`
```json
{
  "total": 1536,
  "entries": [
    {
      "cve_id": "CVE-2021-44228",
      "vendor_project": "Apache",
      "product": "Log4j",
      "vulnerability_name": "Apache Log4j2 Remote Code Execution Vulnerability",
      "date_added": "2021-12-10",
      "short_description": "Apache Log4j2 contains a RCE vulnerability...",
      "required_action": "Apply updates per vendor instructions",
      "due_date": "2021-12-24"
    }
  ]
}
```

### `GET /api/intel/kev/recent?days=7`
Returns KEV entries added in the last N days.

### `GET /api/intel/mitre/techniques?tactic=initial-access&q=exploit`
Returns array of MITRE ATT&CK techniques.

### `GET /api/intel/mitre/tactics`
Returns array of MITRE ATT&CK tactics.

---

## Error Responses

All endpoints return errors in this shape:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request / invalid parameters |
| `404` | Resource not found |
| `500` | Internal server error |
| `503` | External service unavailable (NVD/EPSS timeout) |

---

## Running the Integration Tests

```bash
# Ensure backend is running on port 8000
cd backend && npm run dev &

# Run all integration tests
cd frontend && node --test tests/api-integration.test.mjs

# Or via npm script:
cd frontend && npm run test:api

# Against a different backend URL:
NEXT_PUBLIC_API_URL=https://sentinelai-backend.onrender.com \
  node --test tests/api-integration.test.mjs
```

Test output example:
```
✓ Health > GET /health → 200 with status ok (45ms)
✓ Dashboard > GET /api/dashboard/stats → 200 with security_score (120ms)
✓ Dashboard > GET /api/dashboard/activity → 200 array (88ms)
...
✓ Logistics Lab > POST /api/logistics/seed → 200 with seed counts (234ms)
pass: 52
fail: 0
```
