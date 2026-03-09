/**
 * Sentinel AI — typed API client
 * All calls go to NEXT_PUBLIC_API_URL (default: http://localhost:8000)
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    // 10 s timeout via AbortSignal
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  security_score: number
  score_delta: number
  last_scan: string
  vulnerabilities: {
    total: number
    open: number
    in_progress: number
    patched: number
    verified: number
    critical_open: number
    kev_open: number
    exploitable: number
    new_today: number
  }
  assets: {
    total: number
    critical: number
    behind_patch: number
    by_type: Record<string, number>
  }
  simulations: {
    total: number
    successful: number
    success_rate: number
    new_today: number
  }
  patches: {
    total: number
    pending: number
    merged: number
  }
  threat_feed: {
    total: number
    kev: number
    exploit_available: number
    critical: number
  }
}

export interface ComplianceOverview {
  framework: string
  total_controls: number
  passing: number
  failing: number
  score: number
  generated_at: string
}

export interface ActivityEntry {
  log_id: string
  actor: string
  action: string
  resource_type: string | null
  resource_id: string | null
  payload: Record<string, unknown> | null
  logged_at: string
}

export interface Asset {
  asset_id: string
  org_id: string
  type: string
  hostname: string | null
  ip: string[] | null
  tags: string[] | null
  criticality: string | null
  os_version: string | null
  open_ports: number[] | null
  patch_status: string | null
  source: string | null
  last_scan_at: string | null
  created_at: string
  open_vulnerabilities?: VulnSummary[]
}

export interface AssetStats {
  total: number
  by_type: Record<string, number>
  by_criticality: Record<string, number>
  by_patch_status: Record<string, number>
  by_source: Record<string, number>
}

export interface Vulnerability {
  vuln_id: string
  cve_id: string
  cvss_v3: number | null
  cwe_ids: string[] | null
  mitre_techniques: string[] | null
  epss_score: number | null
  kev_status: boolean
  affected_assets: string[] | null
  blast_radius: string | null
  scan_source: string | null
  remediation_status: string
  detection_at: string
  exploit_history?: ExploitResult[]
  patch_history?: PatchRecord[]
}

export interface VulnSummary {
  vuln_id: string
  cve_id: string
  cvss_v3: number | null
  kev_status: boolean
  epss_score: number | null
  remediation_status: string
  mitre_techniques: string[] | null
}

export interface VulnStats {
  total: number
  open: number
  in_progress: number
  patched: number
  verified: number
  critical: number
  high: number
  medium: number
  low: number
  kev_open: number
  high_epss: number
  by_source: Record<string, number>
  top_techniques: { technique: string; count: number }[]
}

export interface ExploitResult {
  result_id: string
  vuln_id: string
  sandbox_id: string
  success: boolean
  confidence: number | null
  technique: string | null
  payload_hash: string | null
  duration_ms: number | null
  executed_at: string
}

export interface PatchRecord {
  patch_id: string
  vuln_id: string
  branch_name: string | null
  commit_sha: string | null
  pr_url: string | null
  ci_status: string | null
  resim_result: string | null
  merge_status: string | null
  authored_by: string
  created_at: string
  vulnerabilities?: Vulnerability
}

export interface PatchStats {
  total: number
  ci_passing: number
  ci_failing: number
  ci_running: number
  merged: number
  pending_merge: number
  blocked: number
  exploit_confirmed_fixed: number
  exploit_still_works: number
}

export interface ThreatFeedEntry {
  id: string
  cve_id: string
  sync_source: string[]
  description: string
  cvss_v3: number | null
  cwe_ids: string[] | null
  published_at: string
  epss_score: number | null
  kev_status: boolean
  exploit_available: boolean
  exploit_maturity: string | null
  patch_available: boolean
  vendor: string | null
  product: string | null
  mitre_techniques: string[] | null
  priority_score: number
  synced_at: string
}

export interface ThreatFeedStats {
  total: number
  kev_count: number
  exploit_available: number
  weaponized: number
  functional: number
  poc: number
  critical_cvss: number
  high_cvss: number
  avg_priority: number
  top_techniques: { technique: string; count: number }[]
}

export interface SimulationResult {
  result_id: string
  vuln_id: string
  sandbox_id: string
  success: boolean
  confidence: number | null
  technique: string | null
  payload_hash: string | null
  duration_ms: number | null
  executed_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
  activity: (limit = 20) => apiFetch<ActivityEntry[]>(`/api/dashboard/activity?limit=${limit}`),
  compliance: () => apiFetch<ComplianceOverview[]>("/api/dashboard/compliance"),
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export const assetsApi = {
  list: (params?: {
    type?: string; criticality?: string; patch_status?: string; search?: string; limit?: number; offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.type) q.set("type", params.type)
    if (params?.criticality) q.set("criticality", params.criticality)
    if (params?.patch_status) q.set("patch_status", params.patch_status)
    if (params?.search) q.set("search", params.search)
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    return apiFetch<{ total: number; assets: Asset[] }>(`/api/assets?${q}`)
  },
  stats: () => apiFetch<AssetStats>("/api/assets/stats"),
  get: (id: string) => apiFetch<Asset>(`/api/assets/${id}`),
}

// ─── Vulnerabilities ──────────────────────────────────────────────────────────

export const vulnsApi = {
  list: (params?: {
    status?: string; kev?: boolean; min_cvss?: number; cve?: string; limit?: number; offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.kev) q.set("kev", "true")
    if (params?.min_cvss) q.set("min_cvss", String(params.min_cvss))
    if (params?.cve) q.set("cve", params.cve)
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    return apiFetch<{ total: number; vulnerabilities: Vulnerability[] }>(`/api/vulnerabilities?${q}`)
  },
  stats: () => apiFetch<VulnStats>("/api/vulnerabilities/stats"),
  get: (id: string) => apiFetch<Vulnerability>(`/api/vulnerabilities/${id}`),
  updateStatus: (id: string, status: string, note?: string) =>
    apiFetch<Vulnerability>(`/api/vulnerabilities/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),
}

// ─── Threat Feed ─────────────────────────────────────────────────────────────

export const threatFeedApi = {
  list: (params?: {
    kev?: boolean; exploit?: boolean; min_cvss?: number; limit?: number; offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.kev) q.set("kev", "true")
    if (params?.exploit) q.set("exploit", "true")
    if (params?.min_cvss) q.set("min_cvss", String(params.min_cvss))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    return apiFetch<{ total: number | null; entries: ThreatFeedEntry[] }>(`/api/sync/threat-feed?${q}`)
  },
  stats: () => apiFetch<ThreatFeedStats>("/api/sync/threat-feed/stats"),
  get: (cveId: string) => apiFetch<ThreatFeedEntry>(`/api/sync/threat-feed/${cveId}`),
}

// ─── Simulations ─────────────────────────────────────────────────────────────

export const simulationApi = {
  results: (params?: { vuln_id?: string; success?: boolean; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.vuln_id) q.set("vuln_id", params.vuln_id)
    if (params?.success !== undefined) q.set("success", String(params.success))
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<SimulationResult[]>(`/api/simulation/results?${q}`)
  },
  stats: () => apiFetch<{
    total_simulations: number
    successful: number
    failed: number
    success_rate: number
    avg_confidence: number
    avg_duration_ms: number
    top_techniques: { technique: string; count: number }[]
  }>("/api/simulation/stats"),
  run: (body: {
    vuln_id: string; cve_id?: string; module_id?: string
    target_host: string; target_port?: number; operator_id: string; dry_run?: boolean
  }) => apiFetch<ExploitResult>("/api/simulation/run", { method: "POST", body: JSON.stringify(body) }),
}

// ─── Attack Graph ─────────────────────────────────────────────────────────────

export interface AttackGraphNode {
  id: string
  type: string
  label: string
  risk_score: number
  cvss?: number
  epss?: number
  is_kev?: boolean
  exploit_available?: boolean
  tactic_phase?: string
  description?: string
  url?: string
}

export interface AttackGraphEdge {
  source: string
  target: string
  type: string
  label?: string
  weight?: number
}

export interface AttackGraphResponse {
  nodes: AttackGraphNode[]
  edges: AttackGraphEdge[]
  tactic_flow: string[]
  meta: {
    cve_count: number
    technique_count: number
    tactic_count: number
    generated_at: string
  }
}

export const attackGraphApi = {
  buildAuto: () =>
    apiFetch<AttackGraphResponse>("/api/attack-graph/build-auto", {
      method: "POST",
      body: "{}",
    }),
}

// ─── Infrastructure Scan ──────────────────────────────────────────────────────

export interface InfraServiceCve {
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

export interface InfraServiceResult {
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
  vulnerabilities: InfraServiceCve[]
  risk_score: number
  highest_severity: string
}

export interface InfraAttackGraph {
  nodes: {
    id: string; label: string; type: string
    risk_score: number; tactic?: string; cvss?: number; epss?: number; is_kev?: boolean
  }[]
  edges: {
    source: string; target: string; type: string; label: string; weight: number
  }[]
  tactic_flow: string[]
}

export interface InfraScanJob {
  scan_id: string
  started_at: string
  completed_at: string | null
  status: "running" | "completed" | "failed"
  results: InfraServiceResult[]
  attack_graph: InfraAttackGraph | null
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

export interface IntegrationStatus {
  name: string
  service_id: string
  category: string
  status: "Connected" | "Disconnected" | "Unknown" | "Warning"
  port: number
  lastSync: string
  risk_score: number
  vuln_count: number
}

export const infraScanApi = {
  run: (targets?: { service_id: string; host: string; port?: number }[]) =>
    apiFetch<{ scan_id: string; status: string; message: string; poll_url: string }>(
      "/api/infra-scan/run",
      { method: "POST", body: JSON.stringify({ targets }) }
    ),
  get: (scanId: string) => apiFetch<InfraScanJob>(`/api/infra-scan/${scanId}`),
  latest: () => apiFetch<InfraScanJob>("/api/infra-scan/latest"),
  catalog: () => apiFetch<{ services: unknown[] }>("/api/infra-scan/catalog"),
}

export const integrationsApi = {
  status: () => apiFetch<IntegrationStatus[]>("/api/integrations/status"),
}

// ─── Patches ─────────────────────────────────────────────────────────────────

export const patchesApi = {
  list: (params?: {
    ci_status?: string; merge_status?: string; limit?: number; offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.ci_status) q.set("ci_status", params.ci_status)
    if (params?.merge_status) q.set("merge_status", params.merge_status)
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    return apiFetch<{ total: number | null; patches: PatchRecord[] }>(`/api/patches?${q}`)
  },
  stats: () => apiFetch<PatchStats>("/api/patches/stats"),
  get: (id: string) => apiFetch<PatchRecord>(`/api/patches/${id}`),
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export interface Incident {
  incident_id: string
  title: string
  severity: string
  category: string | null
  status: string
  assigned_to: string | null
  affected_assets: string[] | null
  description: string | null
  progress: number
  mttr_hours: number | null
  sla_deadline: string | null
  resolved_at: string | null
  created_at: string
  timeline?: IncidentTimelineEvent[]
}

export interface IncidentTimelineEvent {
  id: string
  incident_id: string
  time: string
  event: string
  event_type: string
}

export interface IncidentPlaybook {
  id: string
  name: string
  steps: number
  avg_time_hours: number
  status: string
  last_used: string
}

export interface IncidentStats {
  active: number
  resolved_30d: number
  avg_mttr: number
  open_playbooks: number
  by_severity: Record<string, number>
  by_status: Record<string, number>
}

export const incidentsApi = {
  list: (params?: { status?: string; severity?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.severity) q.set("severity", params.severity)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; incidents: Incident[] }>(`/api/incidents?${q}`)
  },
  stats: () => apiFetch<IncidentStats>("/api/incidents/stats"),
  get: (id: string) => apiFetch<Incident>(`/api/incidents/${id}`),
  playbooks: () => apiFetch<IncidentPlaybook[]>("/api/incidents/playbooks"),
  create: (body: { title: string; severity: string; category?: string; assigned_to?: string; affected_assets?: string[]; description?: string }) =>
    apiFetch<Incident>("/api/incidents", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { status?: string; progress?: number; assigned_to?: string }) =>
    apiFetch<Incident>(`/api/incidents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
}

// ─── Risks ────────────────────────────────────────────────────────────────────

export interface Risk {
  risk_id: string
  title: string
  category: string
  likelihood: number
  impact: number
  risk_score: number
  status: string
  owner: string | null
  mitigation: string | null
  review_date: string | null
  created_at: string
}

export interface RiskStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  by_category: Record<string, number>
  by_status: Record<string, number>
}

export const risksApi = {
  list: (params?: { status?: string; category?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.category) q.set("category", params.category)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; risks: Risk[] }>(`/api/risks?${q}`)
  },
  stats: () => apiFetch<RiskStats>("/api/risks/stats"),
  get: (id: string) => apiFetch<Risk>(`/api/risks/${id}`),
  create: (body: { title: string; category: string; likelihood: number; impact: number; owner?: string; mitigation?: string }) =>
    apiFetch<Risk>("/api/risks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { status?: string; mitigation?: string }) =>
    apiFetch<Risk>(`/api/risks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
}

// ─── DevSecOps ────────────────────────────────────────────────────────────────

export interface DevSecOpsPipeline {
  pipeline_id: string
  name: string
  repo: string | null
  branch: string | null
  status: string
  stage: string | null
  sbom_findings: number
  secrets_count: number
  sast_issues: number
  dast_issues: number
  policy_pass: boolean | null
  run_at: string | null
  duration_ms: number | null
  created_at: string
}

export interface SbomFinding {
  id: string
  pipeline_id: string
  component: string
  version: string | null
  cve_id: string | null
  severity: string
  license: string | null
  fix_version: string | null
}

export interface DevSecOpsPolicy {
  id: string
  name: string
  status: string
  failures: number
  description: string | null
}

export interface DevSecOpsStats {
  total: number
  passed: number
  failed: number
  running: number
  sbom_findings: number
  secrets_detected: number
  sast_issues: number
  dast_issues: number
  policy_pass_rate: number
}

export const devsecopsApi = {
  pipelines: (params?: { status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; pipelines: DevSecOpsPipeline[] }>(`/api/devsecops/pipelines?${q}`)
  },
  stats: () => apiFetch<DevSecOpsStats>("/api/devsecops/stats"),
  sbom: (pipelineId?: string) => {
    const q = new URLSearchParams()
    if (pipelineId) q.set("pipeline_id", pipelineId)
    return apiFetch<SbomFinding[]>(`/api/devsecops/sbom?${q}`)
  },
  policies: () => apiFetch<DevSecOpsPolicy[]>("/api/devsecops/policies"),
}

// ─── Cloud Security ───────────────────────────────────────────────────────────

export interface CloudFinding {
  finding_id: string
  provider: string
  resource_id: string | null
  resource_type: string | null
  rule_id: string | null
  title: string
  severity: string
  status: string
  region: string | null
  account_id: string | null
  description: string | null
  remediation: string | null
  detected_at: string
  resolved_at: string | null
  created_at: string
}

export interface CloudSecurityStats {
  total: number
  open: number
  critical: number
  high: number
  resolved: number
  by_severity: Record<string, number>
  by_provider: Record<string, number>
  provider_scores: Record<string, { total: number; open: number; score: number }>
}

export const cloudSecurityApi = {
  list: (params?: { provider?: string; severity?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.provider) q.set("provider", params.provider)
    if (params?.severity) q.set("severity", params.severity)
    if (params?.status) q.set("status", params.status)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; findings: CloudFinding[] }>(`/api/cloud-security?${q}`)
  },
  stats: () => apiFetch<CloudSecurityStats>("/api/cloud-security/stats"),
  get: (id: string) => apiFetch<CloudFinding>(`/api/cloud-security/${id}`),
}

// ─── Code Scanning ────────────────────────────────────────────────────────────

export interface CodeFinding {
  finding_id: string
  repo: string
  tool: string
  rule_id: string | null
  title: string
  severity: string
  category: string | null
  file_path: string | null
  line_number: number | null
  status: string
  branch: string | null
  pr_url: string | null
  detected_at: string
  resolved_at: string | null
  created_at: string
}

export interface CodeScanningStats {
  total: number
  open: number
  critical: number
  high: number
  resolved: number
  by_tool: Record<string, number>
  by_severity: Record<string, number>
  by_category: Record<string, number>
  repo_scores: { repo: string; score: number; critical: number; high: number; medium: number }[]
}

export const codeScanningApi = {
  list: (params?: { repo?: string; tool?: string; severity?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.repo) q.set("repo", params.repo)
    if (params?.tool) q.set("tool", params.tool)
    if (params?.severity) q.set("severity", params.severity)
    if (params?.status) q.set("status", params.status)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; findings: CodeFinding[] }>(`/api/code-scanning?${q}`)
  },
  stats: () => apiFetch<CodeScanningStats>("/api/code-scanning/stats"),
  get: (id: string) => apiFetch<CodeFinding>(`/api/code-scanning/${id}`),
}

// ─── Container Security ───────────────────────────────────────────────────────

export interface ContainerScan {
  scan_id: string
  image: string
  tag: string | null
  registry: string | null
  critical_vulns: number
  high_vulns: number
  medium_vulns: number
  low_vulns: number
  total_vulns: number
  status: string
  policy_pass: boolean
  runtime_alerts: number
  base_image: string | null
  scanned_at: string
  created_at: string
}

export interface ContainerSecurityStats {
  total_images: number
  clean: number
  vulnerable: number
  critical: number
  policy_pass: number
  policy_fail: number
  total_vulns: number
  critical_vulns: number
  high_vulns: number
  runtime_alerts: number
}

export const containerSecurityApi = {
  list: (params?: { status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; scans: ContainerScan[] }>(`/api/container-security?${q}`)
  },
  stats: () => apiFetch<ContainerSecurityStats>("/api/container-security/stats"),
  get: (id: string) => apiFetch<ContainerScan>(`/api/container-security/${id}`),
}

// ─── Malware Analysis ─────────────────────────────────────────────────────────

export interface MalwareSample {
  sample_id: string
  filename: string
  hash_sha256: string | null
  file_type: string | null
  verdict: string
  threat_family: string | null
  confidence: number | null
  iocs: unknown[]
  mitre_techniques: string[] | null
  sandbox_env: string | null
  analysis_duration_ms: number | null
  analyzed_at: string
  created_at: string
}

export interface MalwareStats {
  total: number
  malicious: number
  suspicious: number
  clean: number
  families: string[]
  avg_confidence: number
  top_techniques: { technique: string; count: number }[]
}

export const malwareApi = {
  list: (params?: { verdict?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.verdict) q.set("verdict", params.verdict)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; samples: MalwareSample[] }>(`/api/malware?${q}`)
  },
  stats: () => apiFetch<MalwareStats>("/api/malware/stats"),
  get: (id: string) => apiFetch<MalwareSample>(`/api/malware/${id}`),
}

// ─── Zero-Day ─────────────────────────────────────────────────────────────────

export interface ZeroDay {
  zd_id: string
  title: string
  cve_id: string | null
  affected_product: string | null
  vendor: string | null
  severity: string
  status: string
  epss_score: number | null
  exploit_maturity: string | null
  description: string | null
  behavior_signals: unknown[]
  discovered_at: string | null
  patched_at: string | null
  created_at: string
}

export interface ZeroDayStats {
  total: number
  unpatched: number
  critical: number
  weaponized: number
  avg_epss: number
  by_status: Record<string, number>
  by_severity: Record<string, number>
  by_maturity: Record<string, number>
}

export const zeroDayApi = {
  list: (params?: { status?: string; severity?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.severity) q.set("severity", params.severity)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; zero_days: ZeroDay[] }>(`/api/zero-day?${q}`)
  },
  stats: () => apiFetch<ZeroDayStats>("/api/zero-day/stats"),
  get: (id: string) => apiFetch<ZeroDay>(`/api/zero-day/${id}`),
}

// ─── Red Team ─────────────────────────────────────────────────────────────────

export interface RedTeamCampaign {
  campaign_id: string
  name: string
  status: string
  objective: string | null
  operator: string | null
  target_scope: string[] | null
  start_date: string | null
  end_date: string | null
  kill_chain_stage: string | null
  findings: number
  critical_findings: number
  description: string | null
  created_at: string
}

export interface RedTeamStats {
  total: number
  active: number
  completed: number
  planned: number
  total_findings: number
  critical_findings: number
  by_kill_chain: Record<string, number>
}

export const redTeamApi = {
  list: (params?: { status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; campaigns: RedTeamCampaign[] }>(`/api/red-team?${q}`)
  },
  stats: () => apiFetch<RedTeamStats>("/api/red-team/stats"),
  get: (id: string) => apiFetch<RedTeamCampaign>(`/api/red-team/${id}`),
  create: (body: { name: string; objective: string; operator?: string; target_scope?: string[]; start_date?: string; description?: string }) =>
    apiFetch<RedTeamCampaign>("/api/red-team", { method: "POST", body: JSON.stringify(body) }),
}

// ─── Endpoint Security (EDR) ──────────────────────────────────────────────────

export interface EdrAlert {
  alert_id: string
  endpoint: string
  hostname: string | null
  os: string | null
  severity: string
  technique_id: string | null
  technique_name: string | null
  tactic: string | null
  status: string
  process_name: string | null
  description: string | null
  detected_at: string
  resolved_at: string | null
  created_at: string
}

export interface EndpointSecurityStats {
  total_alerts: number
  active: number
  resolved: number
  false_positives: number
  critical: number
  by_severity: Record<string, number>
  by_tactic: Record<string, number>
  top_techniques: { technique: string; count: number }[]
  total_endpoints: number
  compliant_endpoints: number
}

export const endpointSecurityApi = {
  list: (params?: { status?: string; severity?: string; tactic?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.severity) q.set("severity", params.severity)
    if (params?.tactic) q.set("tactic", params.tactic)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; alerts: EdrAlert[] }>(`/api/endpoint-security?${q}`)
  },
  stats: () => apiFetch<EndpointSecurityStats>("/api/endpoint-security/stats"),
  endpoints: () => apiFetch<{ id: string; hostname: string; os: string; alerts: number; active_alerts: number; last_alert: string }[]>("/api/endpoint-security/endpoints"),
  get: (id: string) => apiFetch<EdrAlert>(`/api/endpoint-security/${id}`),
  update: (id: string, body: { status?: string }) =>
    apiFetch<EdrAlert>(`/api/endpoint-security/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
}

// ─── Dark Web ─────────────────────────────────────────────────────────────────

export interface DarkWebFinding {
  finding_id: string
  category: string
  title: string
  source: string | null
  severity: string
  status: string
  description: string | null
  affected_data: string | null
  threat_actor: string | null
  discovered_at: string
  created_at: string
}

export interface DarkWebStats {
  total: number
  new: number
  investigating: number
  critical: number
  threat_actors: number
  by_category: Record<string, number>
  by_severity: Record<string, number>
  by_status: Record<string, number>
}

export const darkWebApi = {
  list: (params?: { category?: string; severity?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set("category", params.category)
    if (params?.severity) q.set("severity", params.severity)
    if (params?.status) q.set("status", params.status)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; findings: DarkWebFinding[] }>(`/api/dark-web?${q}`)
  },
  stats: () => apiFetch<DarkWebStats>("/api/dark-web/stats"),
  get: (id: string) => apiFetch<DarkWebFinding>(`/api/dark-web/${id}`),
}

// ─── Phishing ─────────────────────────────────────────────────────────────────

export interface PhishingCampaign {
  campaign_id: string
  name: string
  status: string
  target_department: string | null
  recipients_count: number | null
  opened_count: number | null
  clicked_count: number | null
  submitted_count: number | null
  reported_count: number | null
  start_date: string | null
  end_date: string | null
  template_name: string | null
  created_at: string
}

export interface PhishingStats {
  total: number
  active: number
  completed: number
  scheduled: number
  total_recipients: number
  total_clicked: number
  total_submitted: number
  total_reported: number
  click_rate: number
  report_rate: number
  dept_risk: { department: string; click_rate: number; submitted_rate: number }[]
}

export const phishingApi = {
  list: (params?: { status?: string; department?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.department) q.set("department", params.department)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; campaigns: PhishingCampaign[] }>(`/api/phishing?${q}`)
  },
  stats: () => apiFetch<PhishingStats>("/api/phishing/stats"),
  get: (id: string) => apiFetch<PhishingCampaign>(`/api/phishing/${id}`),
  create: (body: { name: string; target_department: string; recipients_count?: number; template_name?: string; start_date?: string }) =>
    apiFetch<PhishingCampaign>("/api/phishing", { method: "POST", body: JSON.stringify(body) }),
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface OrgSettings {
  setting_id: string
  org_id: string
  org_name: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const settingsApi = {
  get: () => apiFetch<OrgSettings>("/api/settings"),
  update: (body: { org_name?: string; settings?: Record<string, unknown> }) =>
    apiFetch<OrgSettings>("/api/settings", { method: "PUT", body: JSON.stringify(body) }),
}

// ─── Infrastructure ───────────────────────────────────────────────────────────

export interface InfraNode {
  node_id: string
  org_id: string | null
  name: string
  type: string | null
  environment: string | null
  ip_address: string | null
  hostname: string | null
  os_name: string | null
  os_version: string | null
  patch_status: string | null
  known_cves: string[] | null
  external_tool: string | null
  firewall_present: boolean | null
  endpoint_agent: string | null
  description: string | null
  created_at: string
}

export interface InfraStats {
  total: number
  by_type: Record<string, number>
  by_environment: Record<string, number>
  by_patch_status: Record<string, number>
  by_source: Record<string, number>
  vulnerable: number
  behind_patches: number
}

export const infraApi = {
  list: (params?: { type?: string; environment?: string; patch_status?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.type) q.set("type", params.type)
    if (params?.environment) q.set("environment", params.environment)
    if (params?.patch_status) q.set("patch_status", params.patch_status)
    if (params?.search) q.set("search", params.search)
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<{ total: number | null; nodes: InfraNode[] }>(`/api/infrastructure?${q}`)
  },
  stats: () => apiFetch<InfraStats>("/api/infrastructure/stats"),
  get: (id: string) => apiFetch<InfraNode>(`/api/infrastructure/${id}`),
  create: (body: { name: string; type: string; environment: string; ip_address?: string; hostname?: string; os_name?: string; os_version?: string; patch_status?: string; external_tool?: string }) =>
    apiFetch<InfraNode>("/api/infrastructure", { method: "POST", body: JSON.stringify(body) }),
}
