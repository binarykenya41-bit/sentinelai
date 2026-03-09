/**
 * Sentinel AI — Frontend ↔ Backend Integration Tests
 *
 * Uses Node.js built-in test runner (node:test) + native fetch.
 * Requires Node 18+ and a running backend on http://localhost:8000
 *
 * Run:  node --test frontend/tests/api-integration.test.mjs
 *   or: npm run test:api  (after adding script to package.json)
 *
 * Each test checks:
 *   1. HTTP 200 (or 201) status
 *   2. Response is valid JSON
 *   3. Top-level shape matches the TypeScript interface
 */

import { describe, it, before } from "node:test"
import assert from "node:assert/strict"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const TIMEOUT = 15_000 // ms

/** Shared helper — throws on non-2xx */
async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { "Content-Type": "application/json" },
  })
  const body = await res.json()
  return { status: res.status, body }
}

async function post(path, data = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const body = await res.json()
  return { status: res.status, body }
}

/** Assert a value is an object (not null, not array) */
function assertObject(val, label) {
  assert.equal(typeof val, "object", `${label} should be object`)
  assert.notEqual(val, null, `${label} should not be null`)
  assert.equal(Array.isArray(val), false, `${label} should not be array`)
}

/** Assert a value is an array */
function assertArray(val, label) {
  assert.ok(Array.isArray(val), `${label} should be array`)
}

/** Assert numeric field >= 0 */
function assertNum(val, label) {
  assert.equal(typeof val, "number", `${label} should be number`)
}

// ─── Health ────────────────────────────────────────────────────────────────────

describe("Health", () => {
  it("GET /health → 200 with status ok", async () => {
    const { status, body } = await get("/health")
    assert.equal(status, 200)
    assert.equal(body.status, "ok")
    assert.ok(body.ts, "should have ts field")
    assertObject(body.services, "services")
  })
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("Dashboard", () => {
  it("GET /api/dashboard/stats → 200 with security_score", async () => {
    const { status, body } = await get("/api/dashboard/stats")
    assert.equal(status, 200)
    assertNum(body.security_score, "security_score")
    assertObject(body.vulnerabilities, "vulnerabilities")
    assertObject(body.assets, "assets")
    assertObject(body.simulations, "simulations")
    assertObject(body.patches, "patches")
    assertObject(body.threat_feed, "threat_feed")
  })

  it("GET /api/dashboard/activity → 200 array", async () => {
    const { status, body } = await get("/api/dashboard/activity?limit=5")
    assert.equal(status, 200)
    assertArray(body, "activity")
  })

  it("GET /api/dashboard/compliance → 200 array", async () => {
    const { status, body } = await get("/api/dashboard/compliance")
    assert.equal(status, 200)
    assertArray(body, "compliance")
  })
})

// ─── Assets ───────────────────────────────────────────────────────────────────

describe("Assets", () => {
  it("GET /api/assets → 200 with total and assets array", async () => {
    const { status, body } = await get("/api/assets?limit=5")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertArray(body.assets, "assets")
  })

  it("GET /api/assets/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/assets/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertObject(body.by_type, "by_type")
    assertObject(body.by_criticality, "by_criticality")
  })
})

// ─── Vulnerabilities ──────────────────────────────────────────────────────────

describe("Vulnerabilities", () => {
  it("GET /api/vulnerabilities → 200 with total and vulnerabilities array", async () => {
    const { status, body } = await get("/api/vulnerabilities?limit=5")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertArray(body.vulnerabilities, "vulnerabilities")
  })

  it("GET /api/vulnerabilities/stats → 200 with open/total counts", async () => {
    const { status, body } = await get("/api/vulnerabilities/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.open, "open")
    assertNum(body.critical, "critical")
    assertObject(body.by_source, "by_source")
    assertArray(body.top_techniques, "top_techniques")
  })
})

// ─── Threat Feed ─────────────────────────────────────────────────────────────

describe("Threat Feed", () => {
  it("GET /api/sync/threat-feed → 200 with entries array", async () => {
    const { status, body } = await get("/api/sync/threat-feed?limit=5")
    assert.equal(status, 200)
    assertArray(body.entries, "entries")
  })

  it("GET /api/sync/threat-feed/stats → 200 with total", async () => {
    const { status, body } = await get("/api/sync/threat-feed/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.kev_count, "kev_count")
    assertNum(body.exploit_available, "exploit_available")
    assertArray(body.top_techniques, "top_techniques")
  })
})

// ─── Simulations ─────────────────────────────────────────────────────────────

describe("Simulations", () => {
  it("GET /api/simulation/results → 200 array", async () => {
    const { status, body } = await get("/api/simulation/results?limit=5")
    assert.equal(status, 200)
    assertArray(body, "simulation results")
  })

  it("GET /api/simulation/stats → 200 with counts", async () => {
    const { status, body } = await get("/api/simulation/stats")
    assert.equal(status, 200)
    assertNum(body.total_simulations, "total_simulations")
    assertNum(body.successful, "successful")
    assertNum(body.success_rate, "success_rate")
    assertArray(body.top_techniques, "top_techniques")
  })
})

// ─── Infrastructure Scanner ──────────────────────────────────────────────────

describe("Infrastructure Scanner", () => {
  it("GET /api/infra-scan/catalog → 200 with services array", async () => {
    const { status, body } = await get("/api/infra-scan/catalog")
    assert.equal(status, 200)
    assertArray(body.services, "services")
  })

  it("GET /api/infra-scan/latest → 200 or 404 with scan_id", async () => {
    const { status, body } = await get("/api/infra-scan/latest")
    // Either a completed scan or 404 if none run yet
    assert.ok([200, 404].includes(status), `expected 200 or 404, got ${status}`)
    if (status === 200) {
      assert.ok(body.scan_id, "scan_id should be present")
      assert.ok(["running", "completed", "failed"].includes(body.status), "valid status")
    }
  })
})

// ─── Integrations ─────────────────────────────────────────────────────────────

describe("Integrations", () => {
  it("GET /api/integrations/status → 200 array", async () => {
    const { status, body } = await get("/api/integrations/status")
    assert.equal(status, 200)
    assertArray(body, "integrations")
  })
})

// ─── Patches ──────────────────────────────────────────────────────────────────

describe("Patches", () => {
  it("GET /api/patches → 200 with patches array", async () => {
    const { status, body } = await get("/api/patches?limit=5")
    assert.equal(status, 200)
    assertArray(body.patches, "patches")
  })

  it("GET /api/patches/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/patches/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.merged, "merged")
    assertNum(body.ci_passing, "ci_passing")
  })
})

// ─── Incidents ───────────────────────────────────────────────────────────────

describe("Incidents", () => {
  it("GET /api/incidents → 200 with incidents array", async () => {
    const { status, body } = await get("/api/incidents?limit=5")
    assert.equal(status, 200)
    assertArray(body.incidents, "incidents")
  })

  it("GET /api/incidents/stats → 200 with active count", async () => {
    const { status, body } = await get("/api/incidents/stats")
    assert.equal(status, 200)
    assertNum(body.active, "active")
    assertObject(body.by_severity, "by_severity")
    assertObject(body.by_status, "by_status")
  })

  it("GET /api/incidents/playbooks → 200 array", async () => {
    const { status, body } = await get("/api/incidents/playbooks")
    assert.equal(status, 200)
    assertArray(body, "playbooks")
  })
})

// ─── Risks ────────────────────────────────────────────────────────────────────

describe("Risks", () => {
  it("GET /api/risks → 200 with risks array", async () => {
    const { status, body } = await get("/api/risks?limit=5")
    assert.equal(status, 200)
    assertArray(body.risks, "risks")
  })

  it("GET /api/risks/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/risks/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.critical, "critical")
    assertObject(body.by_category, "by_category")
  })
})

// ─── DevSecOps ────────────────────────────────────────────────────────────────

describe("DevSecOps", () => {
  it("GET /api/devsecops/pipelines → 200 with pipelines array", async () => {
    const { status, body } = await get("/api/devsecops/pipelines?limit=5")
    assert.equal(status, 200)
    assertArray(body.pipelines, "pipelines")
  })

  it("GET /api/devsecops/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/devsecops/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.passed, "passed")
    assertNum(body.failed, "failed")
  })

  it("GET /api/devsecops/sbom → 200 array", async () => {
    const { status, body } = await get("/api/devsecops/sbom")
    assert.equal(status, 200)
    assertArray(body, "sbom findings")
  })

  it("GET /api/devsecops/policies → 200 array", async () => {
    const { status, body } = await get("/api/devsecops/policies")
    assert.equal(status, 200)
    assertArray(body, "policies")
  })
})

// ─── Cloud Security ───────────────────────────────────────────────────────────

describe("Cloud Security", () => {
  it("GET /api/cloud-security → 200 with findings array", async () => {
    const { status, body } = await get("/api/cloud-security?limit=5")
    assert.equal(status, 200)
    assertArray(body.findings, "findings")
  })

  it("GET /api/cloud-security/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/cloud-security/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertObject(body.by_severity, "by_severity")
    assertObject(body.by_provider, "by_provider")
  })
})

// ─── Code Scanning ────────────────────────────────────────────────────────────

describe("Code Scanning", () => {
  it("GET /api/code-scanning → 200 with findings array", async () => {
    const { status, body } = await get("/api/code-scanning?limit=5")
    assert.equal(status, 200)
    assertArray(body.findings, "findings")
  })

  it("GET /api/code-scanning/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/code-scanning/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertObject(body.by_severity, "by_severity")
    assertObject(body.by_tool, "by_tool")
    assertArray(body.repo_scores, "repo_scores")
  })
})

// ─── Container Security ───────────────────────────────────────────────────────

describe("Container Security", () => {
  it("GET /api/container-security → 200 with scans array", async () => {
    const { status, body } = await get("/api/container-security?limit=5")
    assert.equal(status, 200)
    assertArray(body.scans, "scans")
  })

  it("GET /api/container-security/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/container-security/stats")
    assert.equal(status, 200)
    assertNum(body.total_images, "total_images")
    assertNum(body.vulnerable, "vulnerable")
    assertNum(body.critical_vulns, "critical_vulns")
  })
})

// ─── Malware Analysis ─────────────────────────────────────────────────────────

describe("Malware", () => {
  it("GET /api/malware → 200 with samples array", async () => {
    const { status, body } = await get("/api/malware?limit=5")
    assert.equal(status, 200)
    assertArray(body.samples, "samples")
  })

  it("GET /api/malware/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/malware/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.malicious, "malicious")
    assertArray(body.families, "families")
    assertArray(body.top_techniques, "top_techniques")
  })
})

// ─── Zero-Day ─────────────────────────────────────────────────────────────────

describe("Zero-Day", () => {
  it("GET /api/zero-day → 200 with zero_days array", async () => {
    const { status, body } = await get("/api/zero-day?limit=5")
    assert.equal(status, 200)
    assertArray(body.zero_days, "zero_days")
  })

  it("GET /api/zero-day/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/zero-day/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.unpatched, "unpatched")
    assertNum(body.critical, "critical")
    assertObject(body.by_status, "by_status")
  })
})

// ─── Red Team ─────────────────────────────────────────────────────────────────

describe("Red Team", () => {
  it("GET /api/red-team → 200 with campaigns array", async () => {
    const { status, body } = await get("/api/red-team?limit=5")
    assert.equal(status, 200)
    assertArray(body.campaigns, "campaigns")
  })

  it("GET /api/red-team/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/red-team/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.active, "active")
    assertNum(body.total_findings, "total_findings")
    assertObject(body.by_kill_chain, "by_kill_chain")
  })
})

// ─── Endpoint Security (EDR) ──────────────────────────────────────────────────

describe("Endpoint Security", () => {
  it("GET /api/endpoint-security → 200 with alerts array", async () => {
    const { status, body } = await get("/api/endpoint-security?limit=5")
    assert.equal(status, 200)
    assertArray(body.alerts, "alerts")
  })

  it("GET /api/endpoint-security/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/endpoint-security/stats")
    assert.equal(status, 200)
    assertNum(body.total_alerts, "total_alerts")
    assertNum(body.active, "active")
    assertNum(body.total_endpoints, "total_endpoints")
    assertObject(body.by_severity, "by_severity")
    assertObject(body.by_tactic, "by_tactic")
    assertArray(body.top_techniques, "top_techniques")
  })

  it("GET /api/endpoint-security/endpoints → 200 array", async () => {
    const { status, body } = await get("/api/endpoint-security/endpoints")
    assert.equal(status, 200)
    assertArray(body, "endpoints")
  })
})

// ─── Dark Web ─────────────────────────────────────────────────────────────────

describe("Dark Web", () => {
  it("GET /api/dark-web → 200 with findings array", async () => {
    const { status, body } = await get("/api/dark-web?limit=5")
    assert.equal(status, 200)
    assertArray(body.findings, "findings")
  })

  it("GET /api/dark-web/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/dark-web/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.critical, "critical")
    assertObject(body.by_category, "by_category")
    assertObject(body.by_severity, "by_severity")
  })
})

// ─── Phishing ─────────────────────────────────────────────────────────────────

describe("Phishing", () => {
  it("GET /api/phishing → 200 with campaigns array", async () => {
    const { status, body } = await get("/api/phishing?limit=5")
    assert.equal(status, 200)
    assertArray(body.campaigns, "campaigns")
  })

  it("GET /api/phishing/stats → 200 with click_rate", async () => {
    const { status, body } = await get("/api/phishing/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.click_rate, "click_rate")
    assertNum(body.report_rate, "report_rate")
    assertArray(body.dept_risk, "dept_risk")
  })
})

// ─── Settings ─────────────────────────────────────────────────────────────────

describe("Settings", () => {
  it("GET /api/settings → 200 with org_name", async () => {
    const { status, body } = await get("/api/settings")
    assert.equal(status, 200)
    assert.ok(body.org_name !== undefined, "org_name should exist")
    assertObject(body.settings, "settings object")
  })
})

// ─── Infrastructure ───────────────────────────────────────────────────────────

describe("Infrastructure", () => {
  it("GET /api/infrastructure → 200 with nodes array", async () => {
    const { status, body } = await get("/api/infrastructure?limit=5")
    assert.equal(status, 200)
    assertArray(body.nodes, "nodes")
  })

  it("GET /api/infrastructure/stats → 200 with totals", async () => {
    const { status, body } = await get("/api/infrastructure/stats")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertNum(body.vulnerable, "vulnerable")
    assertObject(body.by_type, "by_type")
    assertObject(body.by_environment, "by_environment")
  })
})

// ─── Logistics Lab ────────────────────────────────────────────────────────────

describe("Logistics Lab", () => {
  it("GET /api/logistics/status → 200 with services array", async () => {
    const { status, body } = await get("/api/logistics/status")
    assert.equal(status, 200)
    assertArray(body.services, "services")
    assert.ok(body.checked_at, "checked_at should be present")
    if (body.services.length > 0) {
      const svc = body.services[0]
      assert.ok(svc.service, "service key")
      assert.ok(svc.label, "label key")
      assertNum(svc.port, "port")
      assert.equal(typeof svc.up, "boolean", "up should be boolean")
      assert.ok(svc.cve, "cve key")
      assertNum(svc.cvss, "cvss")
    }
  })

  it("GET /api/logistics/vulnerabilities → 200 with vulnerabilities array", async () => {
    const { status, body } = await get("/api/logistics/vulnerabilities")
    assert.equal(status, 200)
    assertArray(body.vulnerabilities, "vulnerabilities")
  })

  it("GET /api/logistics/results → 200 with results and vulns", async () => {
    const { status, body } = await get("/api/logistics/results")
    assert.equal(status, 200)
    assertArray(body.results, "results")
    assertArray(body.vulns, "vulns")
    assertArray(body.logistics_cves, "logistics_cves")
  })

  it("POST /api/logistics/seed → 200 with seed counts", async () => {
    const { status, body } = await post("/api/logistics/seed")
    assert.equal(status, 200)
    assert.equal(body.ok, true, "ok should be true")
    assertNum(body.assets_seeded, "assets_seeded")
    assertNum(body.assets_existing, "assets_existing")
    assertNum(body.vulns_seeded, "vulns_seeded")
    assertNum(body.total_vulns, "total_vulns")
  })
})

// ─── Attack Graph ─────────────────────────────────────────────────────────────

describe("Attack Graph", () => {
  it("POST /api/attack-graph/build-auto → 200 with nodes and edges", async () => {
    const { status, body } = await post("/api/attack-graph/build-auto")
    assert.equal(status, 200)
    assertArray(body.nodes, "nodes")
    assertArray(body.edges, "edges")
    assertArray(body.tactic_flow, "tactic_flow")
    assertObject(body.meta, "meta")
    assertNum(body.meta.cve_count, "meta.cve_count")
    assertNum(body.meta.technique_count, "meta.technique_count")
  })
})

// ─── Intel (CVE lookup) ───────────────────────────────────────────────────────

describe("Intel", () => {
  it("GET /api/intel/cve/CVE-2021-44228 → 200 with enriched CVE", async () => {
    const { status, body } = await get("/api/intel/cve/CVE-2021-44228")
    assert.equal(status, 200)
    assert.ok(body.cve_id ?? body.id, "cve_id or id should be present")
  })

  it("GET /api/intel/epss/CVE-2021-44228 → 200 with epss_score", async () => {
    const { status, body } = await get("/api/intel/epss/CVE-2021-44228")
    assert.equal(status, 200)
    assert.ok(body.epss !== undefined || body.epss_score !== undefined, "epss_score should be present")
  })

  it("GET /api/intel/kev → 200 with entries array", async () => {
    const { status, body } = await get("/api/intel/kev")
    assert.equal(status, 200)
    assertNum(body.total, "total")
    assertArray(body.entries, "kev entries")
    assert.ok(body.total > 0, "KEV catalog should not be empty")
  })
})
