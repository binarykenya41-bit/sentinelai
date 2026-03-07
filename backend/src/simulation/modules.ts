/**
 * Exploit Module Registry
 * Defines available simulation modules keyed by CVE / technique / category.
 * Modules describe WHAT will run inside the sandbox container — they never
 * execute directly in the backend process.
 */

export type ModuleCategory = "web" | "network" | "auth" | "sca" | "rce" | "lpe" | "lateral"

export interface ExploitModule {
  module_id: string
  name: string
  description: string
  category: ModuleCategory
  cve_ids: string[]         // CVEs this module tests
  technique_ids: string[]   // MITRE ATT&CK technique IDs
  cwe_ids: string[]
  requires_auth: boolean
  min_cvss: number          // Don't run if vuln CVSS < this
  sandbox_image: string     // Docker image tag to use
  entry_command: string[]   // CMD passed to sandbox container
  timeout_ms: number
  safe_targets_only: boolean
}

// Curated catalog of simulation modules
export const MODULE_CATALOG: ExploitModule[] = [
  {
    module_id: "web-sqli-basic",
    name: "SQL Injection - Basic UNION Attack",
    description: "Tests for classic UNION-based SQL injection in HTTP parameters",
    category: "web",
    cve_ids: [],
    technique_ids: ["T1190"],
    cwe_ids: ["CWE-89"],
    requires_auth: false,
    min_cvss: 5.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["python3", "/tools/sqli/union_test.py"],
    timeout_ms: 60_000,
    safe_targets_only: true,
  },
  {
    module_id: "web-xss-reflected",
    name: "Reflected XSS Detection",
    description: "Tests for reflected cross-site scripting vulnerabilities",
    category: "web",
    cve_ids: [],
    technique_ids: ["T1059.007"],
    cwe_ids: ["CWE-79"],
    requires_auth: false,
    min_cvss: 4.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["python3", "/tools/xss/reflected_scan.py"],
    timeout_ms: 45_000,
    safe_targets_only: true,
  },
  {
    module_id: "web-ssrf-probe",
    name: "SSRF Internal Network Probe",
    description: "Tests for Server-Side Request Forgery to reach internal services",
    category: "web",
    cve_ids: [],
    technique_ids: ["T1090", "T1090.001"],
    cwe_ids: ["CWE-918"],
    requires_auth: false,
    min_cvss: 6.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["python3", "/tools/ssrf/probe.py"],
    timeout_ms: 30_000,
    safe_targets_only: true,
  },
  {
    module_id: "auth-bruteforce",
    name: "Credential Brute-Force Simulation",
    description: "Simulates brute-force attack on login endpoint with common passwords",
    category: "auth",
    cve_ids: [],
    technique_ids: ["T1110", "T1110.001"],
    cwe_ids: ["CWE-307", "CWE-287"],
    requires_auth: false,
    min_cvss: 5.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["python3", "/tools/auth/brute.py"],
    timeout_ms: 120_000,
    safe_targets_only: true,
  },
  {
    module_id: "network-port-scan",
    name: "Network Port Enumeration",
    description: "Fast TCP port scan of target host to identify exposed services",
    category: "network",
    cve_ids: [],
    technique_ids: ["T1046"],
    cwe_ids: [],
    requires_auth: false,
    min_cvss: 0.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["nmap", "-sV", "-p-", "--open", "-T4"],
    timeout_ms: 300_000,
    safe_targets_only: true,
  },
  {
    module_id: "rce-log4shell",
    name: "Log4Shell RCE (CVE-2021-44228)",
    description: "Tests for Log4j JNDI injection RCE vulnerability",
    category: "rce",
    cve_ids: ["CVE-2021-44228", "CVE-2021-45046"],
    technique_ids: ["T1190", "T1059"],
    cwe_ids: ["CWE-502", "CWE-917"],
    requires_auth: false,
    min_cvss: 9.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["python3", "/tools/rce/log4shell_probe.py"],
    timeout_ms: 60_000,
    safe_targets_only: true,
  },
  {
    module_id: "rce-spring4shell",
    name: "Spring4Shell RCE (CVE-2022-22965)",
    description: "Tests for Spring Framework data binding RCE vulnerability",
    category: "rce",
    cve_ids: ["CVE-2022-22965"],
    technique_ids: ["T1190", "T1059"],
    cwe_ids: ["CWE-94"],
    requires_auth: false,
    min_cvss: 9.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["python3", "/tools/rce/spring4shell_probe.py"],
    timeout_ms: 60_000,
    safe_targets_only: true,
  },
  {
    module_id: "sca-dependency-check",
    name: "SCA Dependency Vulnerability Scan",
    description: "Scans project dependencies for known CVEs using OWASP Dependency-Check",
    category: "sca",
    cve_ids: [],
    technique_ids: ["T1195.001"],
    cwe_ids: [],
    requires_auth: false,
    min_cvss: 0.0,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["/tools/sca/dependency-check.sh"],
    timeout_ms: 300_000,
    safe_targets_only: false,
  },
  {
    module_id: "lpe-dirty-pipe",
    name: "DirtyPipe LPE (CVE-2022-0847)",
    description: "Tests for Linux kernel privilege escalation via pipe buffer vulnerability",
    category: "lpe",
    cve_ids: ["CVE-2022-0847"],
    technique_ids: ["T1068"],
    cwe_ids: ["CWE-416"],
    requires_auth: true,
    min_cvss: 7.8,
    sandbox_image: "sentinelai/sandbox:latest",
    entry_command: ["bash", "/tools/lpe/dirty_pipe_check.sh"],
    timeout_ms: 30_000,
    safe_targets_only: true,
  },
]

export function getModuleById(id: string): ExploitModule | undefined {
  return MODULE_CATALOG.find((m) => m.module_id === id)
}

export function getModulesForCve(cveId: string): ExploitModule[] {
  return MODULE_CATALOG.filter((m) => m.cve_ids.includes(cveId))
}

export function getModulesForTechnique(techniqueId: string): ExploitModule[] {
  return MODULE_CATALOG.filter((m) => m.technique_ids.includes(techniqueId))
}

export function getModulesByCategory(category: ModuleCategory): ExploitModule[] {
  return MODULE_CATALOG.filter((m) => m.category === category)
}
