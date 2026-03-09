/**
 * Logistics Lab — live exploit simulation + DB seed endpoints
 * Routes: /api/logistics/*
 */

import { FastifyInstance } from "fastify"
import { spawn } from "child_process"
import { join } from "path"
import * as net from "net"
import { supabase } from "../lib/supabase.js"
import { v4 as uuidv4 } from "uuid"

// ─── Service Registry ─────────────────────────────────────────────────────────

const SERVICES = {
  erpnext: {
    label: "ERPNext",
    host: "localhost",
    port: 9000,
    protocol: "http",
    cve: "CVE-2023-46127",
    cvss: 8.8,
    description: "Stored XSS + default credentials (Administrator:admin)",
    technique: "T1190",
    script: "erpnext/erpnext_auth_bypass.py",
    args: (host: string) => ["--target", `http://${host}:9000`, "--skip-brute"],
  },
  redis: {
    label: "Redis Tracking",
    host: "localhost",
    port: 9379,
    protocol: "tcp",
    cve: "CVE-2022-0543",
    cvss: 10.0,
    description: "Unauthenticated access, CONFIG SET RCE, SLAVEOF hijack",
    technique: "T1005",
    script: "redis/logistics_redis_rce.py",
    args: (host: string) => ["--host", host, "--port", "9379", "--check-cve-0543"],
  },
  kafka: {
    label: "Apache Kafka",
    host: "kafka",
    port: 9092,
    protocol: "tcp",
    cve: "CVE-2023-25194",
    cvss: 8.8,
    description: "Unauthenticated topic enumeration + message exfiltration",
    technique: "T1530",
    script: "kafka/kafka_enum.py",
    args: (_host: string) => ["--bootstrap", "kafka:9092", "--consume"],
    dockerNetwork: "sentinel-logistics",
  },
  grafana: {
    label: "Grafana",
    host: "localhost",
    port: 9100,
    protocol: "http",
    cve: "CVE-2021-43798",
    cvss: 7.5,
    description: "Path traversal arbitrary file read (KEV), default credentials",
    technique: "T1083",
    script: "grafana/cve_2021_43798.py",
    args: (host: string) => ["--target", `http://${host}:9100`],
  },
  prometheus: {
    label: "Prometheus",
    host: "localhost",
    port: 9191,
    protocol: "http",
    cve: "CVE-2019-3826",
    cvss: 6.1,
    description: "Unauthenticated metrics exposure, internal host discovery",
    technique: "T1595",
    script: "prometheus/cve_2019_3826.py",
    args: (host: string) => ["--target", `http://${host}:9191`],
  },
  postgresql: {
    label: "PostgreSQL",
    host: "localhost",
    port: 9432,
    protocol: "tcp",
    cve: "CVE-2024-0985",
    cvss: 8.0,
    description: "Privilege escalation via ALTER TABLE, weak credentials check",
    technique: "T1078",
    script: "postgresql/pg_auth_check.py",
    args: (host: string) => ["--host", host, "--port", "9432", "--dbname", "shipments"],
  },
} as const

type ServiceKey = keyof typeof SERVICES

const EXPLOIT_FILES_DIR = join(process.cwd(), "..", "exploit-files", "tools")

// ─── Helper: TCP port check ───────────────────────────────────────────────────

function checkPort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket()
    sock.setTimeout(timeoutMs)
    sock
      .connect(port, host, () => { sock.destroy(); resolve(true) })
      .on("error", () => { sock.destroy(); resolve(false) })
      .on("timeout", () => { sock.destroy(); resolve(false) })
  })
}

// ─── Helper: run Python exploit script ───────────────────────────────────────

function runExploitScript(
  script: string,
  args: string[],
  dockerNetwork?: string
): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const scriptPath = join(EXPLOIT_FILES_DIR, script)

    let cmd: string
    let cmdArgs: string[]

    if (dockerNetwork) {
      // Run inside Docker network for Kafka (needs internal hostname resolution)
      cmd = "docker"
      cmdArgs = [
        "run", "--rm",
        "--network", dockerNetwork,
        "-v", `${EXPLOIT_FILES_DIR}:/exploits:ro`,
        "python:3.12-slim",
        "bash", "-c",
        `pip install confluent-kafka requests -q 2>/dev/null; python3 /exploits/${script} ${args.join(" ")}`,
      ]
    } else {
      cmd = "python3"
      cmdArgs = [scriptPath, ...args]
    }

    let stdout = ""
    let stderr = ""

    const proc = spawn(cmd, cmdArgs, {
      timeout: 120_000,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    })

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })

    proc.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1, durationMs: Date.now() - start })
    })

    proc.on("error", (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1, durationMs: Date.now() - start })
    })
  })
}

// ─── Helper: infer exploit success from output ───────────────────────────────

function inferSuccess(output: string): { success: boolean; confidence: number } {
  const lower = output.toLowerCase()
  const hits = [
    "access granted", "vulnerable", "exploited", "success", "confirmed",
    "accessible", "connected without authentication", "!!!",
    "no auth", "breached", "exfiltration confirmed",
  ]
  const blocks = [
    "not vulnerable", "patched", "protected", "blocked", "refused",
    "no default credentials worked",
  ]
  const hitCount = hits.filter((h) => lower.includes(h)).length
  const blockCount = blocks.filter((b) => lower.includes(b)).length
  const success = hitCount > blockCount
  const confidence = success
    ? Math.min(0.5 + hitCount * 0.08, 0.96)
    : Math.max(0.1, 0.5 - blockCount * 0.1)
  return { success, confidence }
}

// ─── Seed data ────────────────────────────────────────────────────────────────

async function seedLogisticsData() {
  const orgId = "a1b2c3d4-0001-0001-0001-000000000001"

  // 1. Upsert assets
  const assets = [
    { hostname: "logistics-erpnext", type: "service", criticality: "critical", tags: ["logistics", "erp", "erpnext"], ip: ["172.20.0.10"] },
    { hostname: "logistics-redis", type: "database", criticality: "high", tags: ["logistics", "redis", "cache"], ip: ["172.20.0.11"] },
    { hostname: "logistics-kafka", type: "service", criticality: "critical", tags: ["logistics", "kafka", "streaming"], ip: ["172.20.0.12"] },
    { hostname: "logistics-grafana", type: "service", criticality: "medium", tags: ["logistics", "grafana", "monitoring"], ip: ["172.20.0.13"] },
    { hostname: "logistics-prometheus", type: "service", criticality: "medium", tags: ["logistics", "prometheus", "metrics"], ip: ["172.20.0.14"] },
    { hostname: "logistics-postgres", type: "database", criticality: "critical", tags: ["logistics", "postgresql", "shipments"], ip: ["172.20.0.15"] },
  ]

  const assetRows = assets.map((a) => ({
    asset_id: uuidv4(),
    org_id: orgId,
    type: a.type,
    hostname: a.hostname,
    ip: a.ip,
    tags: a.tags,
    criticality: a.criticality,
    last_scan_at: new Date().toISOString(),
  }))

  // Try to upsert — ignore if assets already exist (by hostname match)
  const { data: existingAssets } = await supabase
    .from("assets")
    .select("asset_id, hostname")
    .in("hostname", assets.map((a) => a.hostname))

  const existingHostnames = new Set((existingAssets ?? []).map((a: { hostname: string }) => a.hostname))
  const newAssets = assetRows.filter((a) => !existingHostnames.has(a.hostname))
  if (newAssets.length > 0) {
    await supabase.from("assets").insert(newAssets)
  }

  // Build hostname → asset_id map
  const { data: allAssets } = await supabase
    .from("assets")
    .select("asset_id, hostname")
    .in("hostname", assets.map((a) => a.hostname))

  const assetMap: Record<string, string> = {}
  for (const a of allAssets ?? []) {
    assetMap[(a as { hostname: string; asset_id: string }).hostname] = (a as { hostname: string; asset_id: string }).asset_id
  }

  // 2. Upsert vulnerabilities
  const vulns = [
    {
      cve_id: "CVE-2023-46127",
      cvss_v3: 8.8,
      cwe_ids: ["CWE-79"],
      mitre_techniques: ["T1190", "T1059.007"],
      epss_score: 0.14,
      kev_status: false,
      blast_radius: "ERPNext UI — stored XSS executes on all authenticated users viewing affected documents",
      scan_source: "logistics-lab",
      remediation_status: "open",
      affected_assets: [assetMap["logistics-erpnext"]].filter(Boolean),
    },
    {
      cve_id: "CVE-2022-0543",
      cvss_v3: 10.0,
      cwe_ids: ["CWE-119"],
      mitre_techniques: ["T1005", "T1053", "T1021.004"],
      epss_score: 0.97,
      kev_status: true,
      blast_radius: "Redis unauthenticated — full key dump + CONFIG SET file write + SLAVEOF RCE",
      scan_source: "logistics-lab",
      remediation_status: "open",
      affected_assets: [assetMap["logistics-redis"]].filter(Boolean),
    },
    {
      cve_id: "CVE-2023-25194",
      cvss_v3: 8.8,
      cwe_ids: ["CWE-502"],
      mitre_techniques: ["T1530", "T1565.002"],
      epss_score: 0.31,
      kev_status: false,
      blast_radius: "Kafka no auth — all 6 topics readable, customer PII exfiltrated, event poisoning possible",
      scan_source: "logistics-lab",
      remediation_status: "open",
      affected_assets: [assetMap["logistics-kafka"]].filter(Boolean),
    },
    {
      cve_id: "CVE-2021-43798",
      cvss_v3: 7.5,
      cwe_ids: ["CWE-22"],
      mitre_techniques: ["T1083", "T1552"],
      epss_score: 0.97,
      kev_status: true,
      blast_radius: "Grafana path traversal — reads grafana.ini (secrets), /etc/passwd, AWS credentials",
      scan_source: "logistics-lab",
      remediation_status: "open",
      affected_assets: [assetMap["logistics-grafana"]].filter(Boolean),
    },
    {
      cve_id: "CVE-2019-3826",
      cvss_v3: 6.1,
      cwe_ids: ["CWE-79"],
      mitre_techniques: ["T1595", "T1059.007"],
      epss_score: 0.04,
      kev_status: false,
      blast_radius: "Prometheus unauthenticated — 5 internal hosts leaked, full PromQL access, metrics exposed",
      scan_source: "logistics-lab",
      remediation_status: "open",
      affected_assets: [assetMap["logistics-prometheus"]].filter(Boolean),
    },
    {
      cve_id: "CVE-2024-0985",
      cvss_v3: 8.0,
      cwe_ids: ["CWE-269"],
      mitre_techniques: ["T1078", "T1548"],
      epss_score: 0.11,
      kev_status: false,
      blast_radius: "PostgreSQL privilege escalation via ALTER TABLE SET SCHEMA — non-superuser → superuser",
      scan_source: "logistics-lab",
      remediation_status: "open",
      affected_assets: [assetMap["logistics-postgres"]].filter(Boolean),
    },
  ]

  // Check which CVEs already exist for this scan source
  const { data: existingVulns } = await supabase
    .from("vulnerabilities")
    .select("vuln_id, cve_id")
    .eq("scan_source", "logistics-lab")

  const existingCves = new Set((existingVulns ?? []).map((v: { cve_id: string }) => v.cve_id))
  const newVulns = vulns
    .filter((v) => !existingCves.has(v.cve_id))
    .map((v) => ({ vuln_id: uuidv4(), detection_at: new Date().toISOString(), ...v }))

  if (newVulns.length > 0) {
    await supabase.from("vulnerabilities").insert(newVulns)
  }

  // 3. Return fresh counts
  const { data: finalVulns } = await supabase
    .from("vulnerabilities")
    .select("vuln_id, cve_id, remediation_status")
    .eq("scan_source", "logistics-lab")

  return {
    assets_seeded: newAssets.length,
    assets_existing: existingHostnames.size,
    vulns_seeded: newVulns.length,
    vulns_existing: existingCves.size,
    total_vulns: finalVulns?.length ?? 0,
    asset_map: assetMap,
    vuln_ids: Object.fromEntries((finalVulns ?? []).map((v: { cve_id: string; vuln_id: string }) => [v.cve_id, v.vuln_id])),
  }
}

// ─── Route registration ───────────────────────────────────────────────────────

export async function logisticsLabRoutes(app: FastifyInstance) {

  // GET /api/logistics/status — live port health for all 6 services
  app.get("/api/logistics/status", async (_req, reply) => {
    const checks = await Promise.all(
      Object.entries(SERVICES).map(async ([key, svc]) => {
        const up = await checkPort(svc.host === "kafka" ? "localhost" : svc.host, svc.port)
        return { service: key, label: svc.label, port: svc.port, up, cve: svc.cve, cvss: svc.cvss }
      })
    )
    return reply.send({ services: checks, checked_at: new Date().toISOString() })
  })

  // POST /api/logistics/exploit — run one exploit
  app.post<{ Body: { service: ServiceKey; target_host?: string } }>(
    "/api/logistics/exploit",
    async (req, reply) => {
      const { service, target_host } = req.body ?? {}

      if (!service || !SERVICES[service]) {
        return reply.status(400).send({ error: `Invalid service. Valid: ${Object.keys(SERVICES).join(", ")}` })
      }

      const svc = SERVICES[service]
      const host = target_host ?? svc.host
      const args = svc.args(host)

      const { stdout, stderr, exitCode, durationMs } = await runExploitScript(
        svc.script,
        args as string[],
        (svc as { dockerNetwork?: string }).dockerNetwork
      )

      const output = stdout + (stderr ? `\n[STDERR]\n${stderr}` : "")
      const { success, confidence } = inferSuccess(output)

      // Persist result to Supabase (best-effort)
      let resultId = uuidv4()
      try {
        // Find vuln_id for this CVE
        const { data: vuln } = await supabase
          .from("vulnerabilities")
          .select("vuln_id")
          .eq("cve_id", svc.cve)
          .eq("scan_source", "logistics-lab")
          .single()

        if (vuln) {
          await supabase.from("exploit_results").insert({
            result_id: resultId,
            vuln_id: (vuln as { vuln_id: string }).vuln_id,
            sandbox_id: `logistics-${service}-${Date.now()}`,
            success,
            confidence: parseFloat(confidence.toFixed(2)),
            technique: svc.technique,
            payload_hash: null,
            duration_ms: durationMs,
            executed_at: new Date().toISOString(),
          })
        }
      } catch (_e) {
        // Non-fatal — still return output
      }

      return reply.send({
        result_id: resultId,
        service,
        label: svc.label,
        cve: svc.cve,
        cvss: svc.cvss,
        technique: svc.technique,
        success,
        confidence: parseFloat(confidence.toFixed(2)),
        exit_code: exitCode,
        duration_ms: durationMs,
        output,
      })
    }
  )

  // POST /api/logistics/seed — insert assets + vulnerabilities into Supabase
  app.post("/api/logistics/seed", async (_req, reply) => {
    try {
      const result = await seedLogisticsData()
      return reply.send({ ok: true, ...result })
    } catch (err) {
      return reply.status(500).send({ error: String(err) })
    }
  })

  // GET /api/logistics/results — fetch exploit results for logistics CVEs
  app.get("/api/logistics/results", async (_req, reply) => {
    const logisticsCves = Object.values(SERVICES).map((s) => s.cve)

    const { data: vulns } = await supabase
      .from("vulnerabilities")
      .select("vuln_id, cve_id, cvss_v3, remediation_status, blast_radius")
      .eq("scan_source", "logistics-lab")

    const vulnIds = (vulns ?? []).map((v: { vuln_id: string }) => v.vuln_id)

    let results: unknown[] = []
    if (vulnIds.length > 0) {
      const { data } = await supabase
        .from("exploit_results")
        .select("*")
        .in("vuln_id", vulnIds)
        .order("executed_at", { ascending: false })
        .limit(100)
      results = data ?? []
    }

    // Build vuln lookup
    const vulnMap = Object.fromEntries(
      (vulns ?? []).map((v: { vuln_id: string; cve_id: string; cvss_v3: number; remediation_status: string; blast_radius: string }) => [v.vuln_id, v])
    )

    return reply.send({
      vulns: vulns ?? [],
      results: results.map((r) => ({
        ...(r as object),
        vuln: vulnMap[(r as { vuln_id: string }).vuln_id] ?? null,
      })),
      logistics_cves: logisticsCves,
    })
  })

  // GET /api/logistics/vulnerabilities — just the vuln list
  app.get("/api/logistics/vulnerabilities", async (_req, reply) => {
    const { data, error } = await supabase
      .from("vulnerabilities")
      .select("*")
      .eq("scan_source", "logistics-lab")
      .order("cvss_v3", { ascending: false })

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ vulnerabilities: data ?? [] })
  })
}
