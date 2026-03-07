# 6. API Reference

## Base URL

```
Production:  https://api.sentinelai.io/v1
Development: http://localhost:8000/v1
```

## Authentication

All endpoints require a Bearer token (JWT) via `Authorization: Bearer <token>`.

---

## Vulnerabilities

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vulnerabilities` | List all vulnerabilities (paginated) |
| GET | `/vulnerabilities/:cve_id` | Get enriched CVE record |
| POST | `/vulnerabilities/scan` | Trigger a new scan |
| PATCH | `/vulnerabilities/:vuln_id/status` | Update remediation status |

### GET /vulnerabilities
```json
// Query params: page, limit, severity, kev_only, status
// Response:
{
  "data": [
    {
      "vuln_id": "uuid",
      "cve_id": "CVE-2024-1234",
      "cvss_v3": 9.8,
      "epss_score": 0.97,
      "kev_status": true,
      "remediation_status": "open",
      "affected_assets": ["uuid1", "uuid2"]
    }
  ],
  "total": 247,
  "page": 1
}
```

---

## Exploit Simulation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/simulations` | Start a new exploit simulation |
| GET | `/simulations/:result_id` | Get simulation result |
| GET | `/simulations` | List simulation history |
| DELETE | `/simulations/killswitch` | Halt all active simulations (< 500ms) |

### POST /simulations
```json
// Request:
{
  "vuln_id": "uuid",
  "asset_id": "uuid",
  "operator_mfa_token": "123456"   // required if CVSS >= 9.0
}
// Response:
{
  "result_id": "uuid",
  "status": "running",
  "sandbox_id": "fc-sandbox-abc123"
}
```

---

## Attack Graph

| Method | Endpoint | Description |
|---|---|---|
| GET | `/graph/nodes` | List all graph nodes |
| GET | `/graph/nodes/:node_id` | Get node with edges |
| GET | `/graph/shortest-path` | Compute shortest exploit path |
| GET | `/graph/risk-score/:asset_id` | Get propagated risk score |

---

## Patch Automation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/patches` | Generate and commit AI patch |
| GET | `/patches/:patch_id` | Get patch record + CI status |
| GET | `/patches` | List all patch records |
| POST | `/patches/:patch_id/approve` | Approve for merge |

---

## Threat Intelligence

| Method | Endpoint | Description |
|---|---|---|
| GET | `/intel/cve/:cve_id` | Get enriched threat intel for CVE |
| GET | `/intel/kev` | Get CISA KEV feed |
| GET | `/intel/epss/:cve_id` | Get EPSS probability |
| POST | `/intel/sync` | Trigger manual TI sync |

---

## Compliance

| Method | Endpoint | Description |
|---|---|---|
| GET | `/compliance/controls` | List all mapped controls |
| GET | `/compliance/:framework` | Get framework posture |
| POST | `/compliance/report` | Generate compliance report PDF |

---

## WebSocket Events

Connect to `ws://localhost:8000/v1/ws` for real-time simulation events.

```json
// Simulation progress event:
{
  "event": "simulation.progress",
  "result_id": "uuid",
  "stage": "privilege_escalation",
  "success": null,
  "timestamp": "2026-03-06T10:00:00Z"
}

// Simulation complete event:
{
  "event": "simulation.complete",
  "result_id": "uuid",
  "success": true,
  "confidence": 0.94,
  "technique": "T1068",
  "duration_ms": 4820
}

// Posture score update:
{
  "event": "posture.updated",
  "score": 82,
  "delta": +4,
  "triggered_by": "patch_verified"
}
```
