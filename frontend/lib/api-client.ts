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
