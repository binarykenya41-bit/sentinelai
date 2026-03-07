# 10. Compliance & Governance

## Overview

The Compliance Engine maintains **continuous mapping** between vulnerability records, remediation activities, and regulatory control frameworks — enabling real-time compliance posture rather than point-in-time audit snapshots.

---

## Supported Frameworks

### ISO 27001
| Control | Annex A Reference | Sentinel AI Coverage |
|---|---|---|
| Technical Vulnerability Management | A.12.6 | CVE scanning + patch records |
| Security in Development | A.14.2 | CI/CD validation + code review |
| Incident Management | A.16.1 | Exploit detection + response log |

### SOC 2 Type II
| Criteria | Code | Sentinel AI Coverage |
|---|---|---|
| System Operations | CC7.1 | Continuous monitoring + alerting |
| Change Management | CC7.2 | Patch automation + PR audit trail |
| Risk Assessment | CC4.1 | CVSS + EPSS + graph risk scoring |

**Benefit:** Automated evidence collection reduces audit preparation by 70–80%.

### PCI-DSS v4.0
| Requirement | Code | Sentinel AI Coverage |
|---|---|---|
| Vulnerability Management | Req 6.3 | SAST/SCA scanning + patch loop |
| Internal Penetration Testing | Req 11.3 | Exploit simulation results as pentest evidence |
| Incident Response | Req 12.10 | Audit log + exploit forensics |

---

## Audit Controls

| Control | Implementation |
|---|---|
| Immutable audit log | Append-only PostgreSQL table with HMAC chaining |
| Log integrity | Merkle tree root published every 15 minutes |
| RBAC | Viewer / Analyst / Engineer / Admin (Casbin-enforced) |
| Evidence packages | Auto-generated ZIP: exploit logs + patch diffs + CI artifacts + re-simulation reports |
| Retention | 7-year default for financial-sector deployments (configurable) |

---

## Evidence Package Contents

When a vulnerability is verified as remediated, Sentinel AI auto-generates an evidence package containing:

```
evidence-{cve_id}-{date}.zip
├── 01-initial-exploit-log.txt       Proof of exploitability
├── 02-patch-diff.patch              AI-generated code fix
├── 03-commit.txt                    GPG-signed commit SHA + PR URL
├── 04-ci-pipeline-run.json          Full CI pipeline results
├── 05-re-simulation-log.txt         Proof of exploit failure post-patch
└── 06-compliance-mapping.pdf        Control framework audit narrative
```

---

## RBAC Roles

| Role | Permissions |
|---|---|
| Viewer | Read-only access to dashboard, reports, compliance |
| Analyst | All Viewer + trigger scans + view simulation results |
| Engineer | All Analyst + initiate simulations + review patches |
| Admin | All Engineer + approve patches + export compliance + manage users |

Sensitive operations (exploit initiation for CVSS >= 9.0, patch merge, compliance export) require **elevated role + MFA**.
