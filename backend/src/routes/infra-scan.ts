/**
 * Sentinel AI — Infrastructure Scanner
 * Scans company services: GitLab, WordPress, ERPNext, Keycloak, PostgreSQL, Grafana, Prometheus
 * Flow: identify services → detect CVEs → map vulnerabilities → generate attack graph → recommend patches
 */
import type { FastifyInstance } from "fastify"
import http from "http"
import https from "https"
import net from "net"
import { supabase } from "../lib/supabase.js"

// ── Service Catalog ──────────────────────────────────────────────────────────

interface ServiceCve {
  cve_id: string
  title: string
  cvss_v3: number
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  epss_score: number
  kev: boolean
  exploit_available: boolean
  description: string
  mitre_techniques: string[]
  tactic: string
  patch: string
  affected_versions: string
}

interface ServiceDefinition {
  id: string
  name: string
  category: string
  default_port: number
  protocol: "http" | "https" | "tcp"
  fingerprint_path: string | null
  version_header?: string
  known_cves: ServiceCve[]
}

const SERVICE_CATALOG: ServiceDefinition[] = [
  {
    id: "gitlab",
    name: "GitLab",
    category: "Code Repository",
    default_port: 80,
    protocol: "http",
    fingerprint_path: "/users/sign_in",
    version_header: "x-gitlab-meta",
    known_cves: [
      {
        cve_id: "CVE-2023-7028",
        title: "Account Takeover via Password Reset Email Hijacking",
        cvss_v3: 10.0,
        severity: "CRITICAL",
        epss_score: 0.96,
        kev: true,
        exploit_available: true,
        description:
          "GitLab allows account takeover by sending a password reset link to an attacker-controlled unverified email address. No authentication required.",
        mitre_techniques: ["T1078", "T1098"],
        tactic: "Initial Access",
        patch: "Upgrade to GitLab 16.5.6, 16.6.4, or 16.7.2+. Enable 2FA enforcement.",
        affected_versions: "16.1.0 – 16.7.1",
      },
      {
        cve_id: "CVE-2024-0402",
        title: "Arbitrary File Write via Project Import",
        cvss_v3: 9.9,
        severity: "CRITICAL",
        epss_score: 0.71,
        kev: false,
        exploit_available: true,
        description:
          "Authenticated GitLab users can write files to arbitrary server paths via a crafted project import archive, enabling RCE via config file overwrite.",
        mitre_techniques: ["T1505", "T1190"],
        tactic: "Execution",
        patch: "Upgrade to GitLab 16.6.6+, 16.7.4+, or 16.8.1+",
        affected_versions: "16.0 – 16.8.0",
      },
      {
        cve_id: "CVE-2023-5356",
        title: "Slack/Mattermost Integration Command Injection",
        cvss_v3: 9.6,
        severity: "CRITICAL",
        epss_score: 0.34,
        kev: false,
        exploit_available: true,
        description:
          "Improper authorization allows users to run Slack/Mattermost slash commands as other users by exploiting integration webhook trust.",
        mitre_techniques: ["T1078", "T1059"],
        tactic: "Privilege Escalation",
        patch: "Upgrade to GitLab 16.2.8+, 16.3.5+, or 16.4.1+",
        affected_versions: "< 16.4.1",
      },
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    category: "Company Website",
    default_port: 80,
    protocol: "http",
    fingerprint_path: "/wp-login.php",
    known_cves: [
      {
        cve_id: "CVE-2024-6386",
        title: "WPML Plugin — Server-Side Template Injection (RCE)",
        cvss_v3: 9.9,
        severity: "CRITICAL",
        epss_score: 0.62,
        kev: false,
        exploit_available: true,
        description:
          "The WPML plugin allows authenticated users with Contributor+ permissions to execute arbitrary PHP via TWIG template injection in shortcodes.",
        mitre_techniques: ["T1059.004", "T1190"],
        tactic: "Execution",
        patch: "Upgrade WPML plugin to 4.6.13+",
        affected_versions: "WPML < 4.6.13",
      },
      {
        cve_id: "CVE-2024-4439",
        title: "WordPress Core — Stored XSS via Avatar Block",
        cvss_v3: 7.2,
        severity: "HIGH",
        epss_score: 0.13,
        kev: false,
        exploit_available: true,
        description:
          "WordPress avatar block doesn't properly sanitize HTML attributes, allowing stored XSS from any authenticated user that affects all visitors.",
        mitre_techniques: ["T1059.007", "T1185"],
        tactic: "Collection",
        patch: "Upgrade WordPress to 6.5.5+",
        affected_versions: "WordPress < 6.5.5",
      },
      {
        cve_id: "CVE-2023-2745",
        title: "WordPress Core — Directory Traversal via wp_lang",
        cvss_v3: 5.4,
        severity: "MEDIUM",
        epss_score: 0.06,
        kev: false,
        exploit_available: true,
        description:
          "Directory traversal via the wp_lang parameter in load-scripts.php allows unauthenticated users to read files outside the web root.",
        mitre_techniques: ["T1083", "T1190"],
        tactic: "Discovery",
        patch: "Upgrade WordPress to 6.2.1+",
        affected_versions: "< 6.2.1",
      },
    ],
  },
  {
    id: "erpnext",
    name: "ERPNext",
    category: "Business Operations",
    default_port: 8000,
    protocol: "http",
    fingerprint_path: "/api/method/frappe.auth.get_logged_user",
    known_cves: [
      {
        cve_id: "CVE-2024-25136",
        title: "Frappe Framework — SQL Injection in Report Builder",
        cvss_v3: 9.1,
        severity: "CRITICAL",
        epss_score: 0.45,
        kev: false,
        exploit_available: true,
        description:
          "Frappe (ERPNext foundation) contains unsanitized user input in dynamically generated SQL queries in the report-builder, enabling full database dump.",
        mitre_techniques: ["T1190", "T1078"],
        tactic: "Initial Access",
        patch: "Upgrade Frappe to 15.x+ or apply security commit patches",
        affected_versions: "Frappe < 15.0",
      },
      {
        cve_id: "CVE-2023-46127",
        title: "ERPNext — Stored XSS in User Profile Fields",
        cvss_v3: 8.8,
        severity: "HIGH",
        epss_score: 0.12,
        kev: false,
        exploit_available: true,
        description:
          "ERPNext user profile fields (full name, bio) are not properly sanitized, allowing stored XSS that fires for all users who view the profile — enables session hijacking.",
        mitre_techniques: ["T1059.007", "T1185"],
        tactic: "Collection",
        patch: "Upgrade ERPNext to 14.22.1+ or apply commit a6f6fb7",
        affected_versions: "ERPNext < 14.22.1",
      },
    ],
  },
  {
    id: "keycloak",
    name: "Keycloak",
    category: "Authentication",
    default_port: 8080,
    protocol: "http",
    fingerprint_path: "/realms/master/.well-known/openid-configuration",
    known_cves: [
      {
        cve_id: "CVE-2024-1132",
        title: "Path Traversal via Malformed OAuth2 redirect_uri",
        cvss_v3: 8.1,
        severity: "HIGH",
        epss_score: 0.18,
        kev: false,
        exploit_available: true,
        description:
          "Keycloak fails to validate path components in redirect_uri during OAuth2 authorization. Attackers can bypass allowed redirect_uri restrictions and steal authorization codes.",
        mitre_techniques: ["T1190", "T1083"],
        tactic: "Initial Access",
        patch: "Upgrade to Keycloak 24.0.3+",
        affected_versions: "< 24.0.3",
      },
      {
        cve_id: "CVE-2024-3656",
        title: "Privilege Escalation via Undocumented Admin API Endpoints",
        cvss_v3: 8.8,
        severity: "HIGH",
        epss_score: 0.22,
        kev: false,
        exploit_available: false,
        description:
          "Low-privilege Keycloak users can access admin-only REST API endpoints by directly calling undisclosed paths, enabling role and group manipulation.",
        mitre_techniques: ["T1078.004", "T1548"],
        tactic: "Privilege Escalation",
        patch: "Upgrade to Keycloak 24.0.5+",
        affected_versions: "< 24.0.5",
      },
      {
        cve_id: "CVE-2023-6927",
        title: "Open Redirect via Client redirect_uri Parameter",
        cvss_v3: 4.6,
        severity: "MEDIUM",
        epss_score: 0.09,
        kev: false,
        exploit_available: true,
        description:
          "Keycloak open redirect when the redirect_uri parameter is not fully validated, allowing phishing via SSO login flow redirection to attacker domains.",
        mitre_techniques: ["T1566", "T1598"],
        tactic: "Initial Access",
        patch: "Upgrade to Keycloak 23.0.3+",
        affected_versions: "< 23.0.3",
      },
    ],
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Database",
    default_port: 5432,
    protocol: "tcp",
    fingerprint_path: null,
    known_cves: [
      {
        cve_id: "CVE-2024-0985",
        title: "Superuser Privilege Escalation via ALTER TABLE",
        cvss_v3: 8.0,
        severity: "HIGH",
        epss_score: 0.11,
        kev: false,
        exploit_available: true,
        description:
          "Non-privileged PostgreSQL users can escalate to superuser by exploiting a security definer function vulnerability via crafted ALTER TABLE ... SET SCHEMA commands.",
        mitre_techniques: ["T1078", "T1548"],
        tactic: "Privilege Escalation",
        patch: "Upgrade to PostgreSQL 16.2, 15.6, 14.11, 13.14, or 12.18",
        affected_versions: "< 16.2",
      },
      {
        cve_id: "CVE-2023-5869",
        title: "Buffer Overflow in Range/Multirange Functions",
        cvss_v3: 8.8,
        severity: "HIGH",
        epss_score: 0.07,
        kev: false,
        exploit_available: false,
        description:
          "Memory safety issues in range and multirange type arithmetic functions can be exploited by authenticated users to crash the server or potentially execute arbitrary code.",
        mitre_techniques: ["T1190", "T1499"],
        tactic: "Impact",
        patch: "Upgrade to PostgreSQL 16.1+, 15.5+, 14.10+, 13.13+, or 12.17+",
        affected_versions: "< 16.1",
      },
    ],
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "Monitoring",
    default_port: 3000,
    protocol: "http",
    fingerprint_path: "/api/health",
    version_header: "x-grafana-id",
    known_cves: [
      {
        cve_id: "CVE-2021-43798",
        title: "Unauthenticated Arbitrary File Read via Plugin Path Traversal",
        cvss_v3: 7.5,
        severity: "HIGH",
        epss_score: 0.97,
        kev: true,
        exploit_available: true,
        description:
          "Grafana plugin static file serving is vulnerable to path traversal. Unauthenticated attackers can read any file accessible by the Grafana process, including /etc/passwd and private keys.",
        mitre_techniques: ["T1083", "T1552"],
        tactic: "Credential Access",
        patch: "Upgrade to Grafana 8.3.2, 8.2.7, 8.1.8, or 8.0.7+",
        affected_versions: "8.0.0 – 8.3.1",
      },
      {
        cve_id: "CVE-2023-1387",
        title: "JWT Token Leak via URL Parameter Forwarding to Datasource",
        cvss_v3: 7.5,
        severity: "HIGH",
        epss_score: 0.21,
        kev: false,
        exploit_available: true,
        description:
          "Grafana forwards auth JWT tokens via URL parameters when accessing datasource APIs, allowing tokens to leak into server access logs and referrer headers.",
        mitre_techniques: ["T1552", "T1539"],
        tactic: "Credential Access",
        patch: "Upgrade to Grafana 9.4.3+, 9.3.8+, 9.2.10+, or 8.5.22+",
        affected_versions: "< 9.4.3",
      },
      {
        cve_id: "CVE-2022-21703",
        title: "CSRF Leading to Privilege Escalation",
        cvss_v3: 8.8,
        severity: "HIGH",
        epss_score: 0.14,
        kev: false,
        exploit_available: true,
        description:
          "Cross-site request forgery allows remote attackers to perform state-changing operations including admin account creation and org-level privilege escalation.",
        mitre_techniques: ["T1078", "T1548"],
        tactic: "Privilege Escalation",
        patch: "Upgrade to Grafana 8.3.5+, 8.4.3+, or 7.5.15+",
        affected_versions: "< 8.3.5",
      },
    ],
  },
  {
    id: "prometheus",
    name: "Prometheus",
    category: "Monitoring",
    default_port: 9090,
    protocol: "http",
    fingerprint_path: "/-/healthy",
    known_cves: [
      {
        cve_id: "CVE-2019-3826",
        title: "Stored XSS via Arbitrary Alert Labels",
        cvss_v3: 6.1,
        severity: "MEDIUM",
        epss_score: 0.03,
        kev: false,
        exploit_available: true,
        description:
          "Prometheus alertmanager stores alert labels without sanitization, enabling stored XSS that fires in the alertmanager UI for any user who views the alert.",
        mitre_techniques: ["T1059.007"],
        tactic: "Execution",
        patch: "Upgrade to Prometheus 2.7.2+ and apply strict CSP headers",
        affected_versions: "< 2.7.2",
      },
      {
        cve_id: "CVE-2022-21698",
        title: "ReDoS via HTTP Server Metrics Collection",
        cvss_v3: 7.5,
        severity: "HIGH",
        epss_score: 0.04,
        kev: false,
        exploit_available: false,
        description:
          "Prometheus client_golang HTTP instrumentation middleware is vulnerable to regex denial of service via crafted HTTP method strings with deeply nested backtracking.",
        mitre_techniques: ["T1499"],
        tactic: "Impact",
        patch: "Upgrade prometheus/client_golang to 1.11.1+",
        affected_versions: "client_golang < 1.11.1",
      },
    ],
  },
]

// ── Network Helpers ──────────────────────────────────────────────────────────

function tcpProbe(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket()
    sock.setTimeout(timeoutMs)
    sock
      .on("connect", () => { sock.destroy(); resolve(true) })
      .on("error", () => { sock.destroy(); resolve(false) })
      .on("timeout", () => { sock.destroy(); resolve(false) })
      .connect(port, host)
  })
}

function httpProbe(
  host: string,
  port: number,
  path: string,
  useSsl = false,
  timeoutMs = 5000
): Promise<{ status: number; headers: Record<string, string>; body: string } | null> {
  return new Promise((resolve) => {
    const mod = useSsl ? https : http
    const options = {
      hostname: host,
      port,
      path,
      method: "GET",
      timeout: timeoutMs,
      headers: { "User-Agent": "SentinelAI-Scanner/1.0" },
      rejectUnauthorized: false,
    }
    const req = mod.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (c: Buffer) => chunks.push(c))
      res.on("end", () => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers as Record<string, string>,
          body: Buffer.concat(chunks).toString("utf8").slice(0, 2000),
        })
      })
    })
    req.on("error", () => resolve(null))
    req.on("timeout", () => { req.destroy(); resolve(null) })
    req.end()
  })
}

// ── Scanner Core ─────────────────────────────────────────────────────────────

interface ScanTarget {
  service_id: string
  host: string
  port?: number
}

interface ServiceScanResult {
  service_id: string
  name: string
  category: string
  host: string
  port: number
  reachable: boolean
  status: "online" | "offline" | "unknown"
  detected_version: string | null
  response_time_ms: number
  fingerprint: Record<string, string>
  vulnerabilities: ServiceCve[]
  risk_score: number
  highest_severity: string
}

async function scanService(
  def: ServiceDefinition,
  host: string,
  port: number
): Promise<ServiceScanResult> {
  const start = Date.now()
  let reachable = false
  let detected_version: string | null = null
  const fingerprint: Record<string, string> = {}

  if (def.protocol === "tcp") {
    reachable = await tcpProbe(host, port)
  } else {
    const useSsl = def.protocol === "https"
    const result = await httpProbe(host, port, def.fingerprint_path ?? "/", useSsl)
    if (result) {
      reachable = result.status > 0 && result.status < 600
      // Extract version from headers
      if (def.version_header && result.headers[def.version_header]) {
        detected_version = result.headers[def.version_header]
        fingerprint[def.version_header] = detected_version
      }
      if (result.headers["server"]) fingerprint["server"] = result.headers["server"]
      if (result.headers["x-powered-by"]) fingerprint["x-powered-by"] = result.headers["x-powered-by"]
      if (result.headers["x-generator"]) fingerprint["x-generator"] = result.headers["x-generator"]
      // WordPress detection
      if (def.id === "wordpress" && result.body.includes("wp-")) fingerprint["cms"] = "WordPress"
      // Grafana detection
      if (def.id === "grafana" && result.body.includes("grafana")) fingerprint["app"] = "Grafana"
      // Keycloak detection
      if (def.id === "keycloak" && (result.body.includes("Keycloak") || result.body.includes("keycloak")))
        fingerprint["app"] = "Keycloak"
      // GitLab detection
      if (def.id === "gitlab" && (result.body.includes("GitLab") || result.body.includes("gitlab")))
        fingerprint["app"] = "GitLab"
    }
  }

  const response_time_ms = Date.now() - start

  // All known CVEs apply when service is reachable (we can't determine version without creds)
  const vulnerabilities = reachable ? def.known_cves : []

  // Risk score: weighted by CVSS, EPSS, KEV
  const risk_score = vulnerabilities.length
    ? Math.round(
        vulnerabilities.reduce((sum, v) => {
          const w = v.kev ? 1.5 : v.exploit_available ? 1.2 : 1.0
          return sum + (v.cvss_v3 / 10) * (1 + v.epss_score) * w
        }, 0) /
          vulnerabilities.length *
          10
      )
    : 0

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
  const highest_severity =
    vulnerabilities.length
      ? vulnerabilities.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))[0]
          .severity
      : "NONE"

  return {
    service_id: def.id,
    name: def.name,
    category: def.category,
    host,
    port,
    reachable,
    status: reachable ? "online" : "offline",
    detected_version,
    response_time_ms,
    fingerprint,
    vulnerabilities,
    risk_score,
    highest_severity,
  }
}

// ── Attack Graph Builder ─────────────────────────────────────────────────────

interface GraphNode {
  id: string
  label: string
  type: "attacker" | "service" | "cve" | "data"
  risk_score: number
  service_id?: string
  category?: string
  tactic?: string
  cvss?: number
  epss?: number
  is_kev?: boolean
}

interface GraphEdge {
  source: string
  target: string
  type: string
  label: string
  weight: number
}

function buildInfraAttackGraph(results: ServiceScanResult[]) {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Attacker origin node
  nodes.push({ id: "attacker", label: "External Attacker", type: "attacker", risk_score: 100 })

  // Target data nodes
  nodes.push({ id: "data-source-code", label: "Source Code", type: "data", risk_score: 95 })
  nodes.push({ id: "data-business-data", label: "Business Data (ERP)", type: "data", risk_score: 95 })
  nodes.push({ id: "data-db", label: "Database (PostgreSQL)", type: "data", risk_score: 100 })
  nodes.push({ id: "data-identity", label: "Identity Provider (SSO)", type: "data", risk_score: 98 })
  nodes.push({ id: "data-metrics", label: "Metrics & Secrets", type: "data", risk_score: 80 })

  // Attack path mapping: which service leads to which data
  const attackPaths: Record<string, string[]> = {
    gitlab: ["data-source-code", "data-db"],
    wordpress: ["data-business-data"],
    erpnext: ["data-business-data", "data-db"],
    keycloak: ["data-identity", "data-business-data", "data-source-code"],
    postgresql: ["data-db"],
    grafana: ["data-metrics", "data-db"],
    prometheus: ["data-metrics"],
  }

  // Lateral movement: once one service is compromised, which others can be reached
  const lateralMovement: Record<string, string[]> = {
    gitlab: ["keycloak", "erpnext"],       // source code → service accounts, internal APIs
    wordpress: ["erpnext", "postgresql"],   // web server → internal network
    keycloak: ["gitlab", "erpnext", "grafana"], // SSO compromise → all services
    erpnext: ["postgresql"],               // app layer → DB
    grafana: ["prometheus", "postgresql"],  // monitoring → credentials in config
    prometheus: [],
    postgresql: [],
  }

  for (const result of results) {
    if (!result.reachable) continue

    // Service node
    nodes.push({
      id: result.service_id,
      label: result.name,
      type: "service",
      risk_score: result.risk_score,
      service_id: result.service_id,
      category: result.category,
    })

    // Attacker → service edge (initial access CVEs)
    const initCves = result.vulnerabilities.filter((v) =>
      ["Initial Access", "Execution"].includes(v.tactic)
    )
    if (initCves.length > 0) {
      edges.push({
        source: "attacker",
        target: result.service_id,
        type: "exploit",
        label: initCves.map((v) => v.cve_id).join(", "),
        weight: Math.max(...initCves.map((v) => v.cvss_v3)),
      })
    }

    // CVE nodes for high-severity vulns
    for (const cve of result.vulnerabilities.filter((v) => v.cvss_v3 >= 8.0)) {
      const cveNodeId = `${result.service_id}-${cve.cve_id}`
      nodes.push({
        id: cveNodeId,
        label: cve.cve_id,
        type: "cve",
        risk_score: Math.round(cve.cvss_v3 * 10),
        tactic: cve.tactic,
        cvss: cve.cvss_v3,
        epss: cve.epss_score,
        is_kev: cve.kev,
      })
      edges.push({
        source: result.service_id,
        target: cveNodeId,
        type: "vulnerability",
        label: cve.tactic,
        weight: cve.cvss_v3,
      })
    }

    // Service → data edges
    for (const dataTarget of attackPaths[result.service_id] ?? []) {
      edges.push({
        source: result.service_id,
        target: dataTarget,
        type: "data_access",
        label: "data exfiltration",
        weight: result.risk_score / 10,
      })
    }

    // Lateral movement edges
    for (const lateralTarget of lateralMovement[result.service_id] ?? []) {
      const targetResult = results.find((r) => r.service_id === lateralTarget && r.reachable)
      if (targetResult) {
        edges.push({
          source: result.service_id,
          target: lateralTarget,
          type: "lateral_movement",
          label: "pivot via shared credentials / internal network",
          weight: 7.5,
        })
      }
    }
  }

  // Tactic kill chain
  const tacticFlow = [
    "Reconnaissance",
    "Initial Access",
    "Execution",
    "Privilege Escalation",
    "Credential Access",
    "Lateral Movement",
    "Collection",
    "Exfiltration",
    "Impact",
  ]

  return { nodes, edges, tactic_flow: tacticFlow }
}

// ── Scan State Store (in-memory for demo) ────────────────────────────────────

interface ScanJob {
  scan_id: string
  started_at: string
  completed_at: string | null
  status: "running" | "completed" | "failed"
  targets: ScanTarget[]
  results: ServiceScanResult[]
  attack_graph: ReturnType<typeof buildInfraAttackGraph> | null
  summary: {
    services_scanned: number
    services_online: number
    total_vulnerabilities: number
    critical_vulns: number
    high_vulns: number
    kev_count: number
    exploitable_count: number
    overall_risk_score: number
  } | null
}

const scanStore: Map<string, ScanJob> = new Map()
let latestScanId: string | null = null

// ── Routes ───────────────────────────────────────────────────────────────────

export async function infraScanRoutes(app: FastifyInstance) {

  // POST /api/infra-scan/run — start a new infrastructure scan
  app.post<{
    Body: {
      targets?: { service_id: string; host: string; port?: number }[]
      scan_all?: boolean
    }
  }>("/api/infra-scan/run", async (req, reply) => {
    const scan_id = `scan-${Date.now()}`
    const started_at = new Date().toISOString()

    // Build target list — defaults to full company stack on localhost
    const targets: ScanTarget[] = req.body?.targets ?? SERVICE_CATALOG.map((s) => ({
      service_id: s.id,
      host: req.body?.targets ? req.body.targets[0]?.host : "localhost",
      port: s.default_port,
    }))

    // Normalize host per service
    const normalizedTargets: ScanTarget[] = SERVICE_CATALOG.map((def) => {
      const override = (req.body?.targets ?? []).find((t) => t.service_id === def.id)
      return {
        service_id: def.id,
        host: override?.host ?? "localhost",
        port: override?.port ?? def.default_port,
      }
    })

    const job: ScanJob = {
      scan_id,
      started_at,
      completed_at: null,
      status: "running",
      targets: normalizedTargets,
      results: [],
      attack_graph: null,
      summary: null,
    }

    scanStore.set(scan_id, job)
    latestScanId = scan_id

    // Run scan async
    ;(async () => {
      try {
        const results = await Promise.all(
          normalizedTargets.map((t) => {
            const def = SERVICE_CATALOG.find((s) => s.id === t.service_id)!
            return scanService(def, t.host, t.port ?? def.default_port)
          })
        )

        const attack_graph = buildInfraAttackGraph(results)
        const allCves = results.flatMap((r) => r.vulnerabilities)

        const summary = {
          services_scanned: results.length,
          services_online: results.filter((r) => r.reachable).length,
          total_vulnerabilities: allCves.length,
          critical_vulns: allCves.filter((v) => v.severity === "CRITICAL").length,
          high_vulns: allCves.filter((v) => v.severity === "HIGH").length,
          kev_count: allCves.filter((v) => v.kev).length,
          exploitable_count: allCves.filter((v) => v.exploit_available).length,
          overall_risk_score: results.length
            ? Math.round(results.reduce((s, r) => s + r.risk_score, 0) / results.length)
            : 0,
        }

        job.results = results
        job.attack_graph = attack_graph
        job.summary = summary
        job.status = "completed"
        job.completed_at = new Date().toISOString()

        // Persist scan to audit log
        await supabase.from("audit_log").insert({
          actor: "sentinel-ai",
          action: "infra_scan_completed",
          resource_type: "infra_scan",
          resource_id: scan_id,
          payload: {
            services_online: summary.services_online,
            total_vulnerabilities: summary.total_vulnerabilities,
            critical_vulns: summary.critical_vulns,
          },
        })
      } catch (err) {
        job.status = "failed"
        job.completed_at = new Date().toISOString()
      }
    })()

    return reply.status(202).send({
      scan_id,
      status: "running",
      message: `Scanning ${SERVICE_CATALOG.length} company services…`,
      poll_url: `/api/infra-scan/${scan_id}`,
    })
  })

  // GET /api/infra-scan/:scan_id — get scan result by ID
  app.get<{ Params: { scan_id: string } }>("/api/infra-scan/:scan_id", async (req, reply) => {
    const job = scanStore.get(req.params.scan_id)
    if (!job) return reply.status(404).send({ error: "Scan not found" })
    return reply.send(job)
  })

  // GET /api/infra-scan/latest — get the latest scan result
  app.get("/api/infra-scan/latest", async (_req, reply) => {
    if (!latestScanId) {
      return reply.status(404).send({ error: "No scans yet — POST /api/infra-scan/run to start" })
    }
    const job = scanStore.get(latestScanId)
    return reply.send(job)
  })

  // GET /api/infra-scan/catalog — return service catalog (no scan needed)
  app.get("/api/infra-scan/catalog", async (_req, reply) => {
    return reply.send({
      services: SERVICE_CATALOG.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        default_port: s.default_port,
        protocol: s.protocol,
        cve_count: s.known_cves.length,
        cves: s.known_cves.map((c) => ({
          cve_id: c.cve_id,
          title: c.title,
          cvss_v3: c.cvss_v3,
          severity: c.severity,
          epss_score: c.epss_score,
          kev: c.kev,
          exploit_available: c.exploit_available,
          tactic: c.tactic,
        })),
      })),
    })
  })

  // GET /api/integrations/status — integration status for dashboard
  app.get("/api/integrations/status", async (_req, reply) => {
    const now = Date.now()
    // Return company infrastructure services with realistic status
    const status = latestScanId
      ? (scanStore.get(latestScanId)?.results ?? []).map((r) => ({
          name: r.name,
          service_id: r.service_id,
          category: r.category,
          status: r.reachable ? "Connected" : "Disconnected",
          port: r.port,
          lastSync: r.response_time_ms < 200 ? "just now" : `${Math.round(r.response_time_ms / 1000)}s ago`,
          risk_score: r.risk_score,
          vuln_count: r.vulnerabilities.length,
        }))
      : SERVICE_CATALOG.map((s) => ({
          name: s.name,
          service_id: s.id,
          category: s.category,
          status: "Unknown",
          port: s.default_port,
          lastSync: "Not scanned",
          risk_score: 0,
          vuln_count: 0,
        }))

    return reply.send(status)
  })
}
