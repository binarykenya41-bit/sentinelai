import { google } from "googleapis"
import { getGcpAuth, getProjectId } from "./client.js"

export interface SccFinding {
  name: string
  category: string
  state: string
  severity: string
  resource_name: string
  resource_type: string
  cve_id: string | null
  description: string
  event_time: string
  create_time: string
  external_uri: string | null
  mitre_attack: string[]
}

// List Security Command Center findings for the project
export async function getSccFindings(
  state: "ACTIVE" | "INACTIVE" = "ACTIVE",
  severities: string[] = ["CRITICAL", "HIGH", "MEDIUM"],
  pageSize = 100
): Promise<SccFinding[]> {
  const auth = getGcpAuth()
  const scc = google.securitycenter({ version: "v1", auth })
  const projectId = getProjectId()

  const severityFilter = severities.map((s) => `severity="${s}"`).join(" OR ")
  const filter = `state="${state}" AND (${severityFilter})`

  const { data } = await scc.projects.findings.list({
    parent: `projects/${projectId}/sources/-`,
    filter,
    pageSize,
    orderBy: "event_time desc",
  } as Parameters<typeof scc.projects.findings.list>[0])

  return (data.listFindingsResults ?? []).map((r) => {
    const finding = r.finding!
    const vuln = finding.vulnerability as Record<string, unknown> | undefined
    const cve = (vuln?.["cve"] as Record<string, unknown>)?.["id"] as string | undefined

    const mitreTechniques: string[] = []
    const mitre = finding.mitreAttack as Record<string, unknown> | undefined
    if (mitre?.["primaryTactic"]) mitreTechniques.push(String(mitre["primaryTactic"]))
    const additionalTactics = mitre?.["additionalTactics"] as string[] | undefined
    if (additionalTactics) mitreTechniques.push(...additionalTactics)

    return {
      name: finding.name ?? "",
      category: finding.category ?? "",
      state: finding.state ?? "",
      severity: finding.severity ?? "SEVERITY_UNSPECIFIED",
      resource_name: finding.resourceName ?? "",
      resource_type: (finding.resource as Record<string, unknown>)?.["type"] as string ?? "",
      cve_id: cve ?? null,
      description: finding.description ?? "",
      event_time: finding.eventTime ?? "",
      create_time: finding.createTime ?? "",
      external_uri: finding.externalUri ?? null,
      mitre_attack: mitreTechniques,
    }
  })
}

// Map SCC findings to Sentinel vulnerability records (CVE-linked findings only)
export async function getCveFindingsFromScc(): Promise<
  { cve_id: string; severity: string; resource_name: string; event_time: string }[]
> {
  const findings = await getSccFindings("ACTIVE", ["CRITICAL", "HIGH", "MEDIUM", "LOW"])
  return findings
    .filter((f) => f.cve_id !== null)
    .map((f) => ({
      cve_id: f.cve_id!,
      severity: f.severity,
      resource_name: f.resource_name,
      event_time: f.event_time,
    }))
}

// Dashboard summary of SCC posture
export function summarizeSccFindings(findings: SccFinding[]) {
  const bySeverity: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1
  }

  return {
    total: findings.length,
    by_severity: bySeverity,
    by_category: byCategory,
    cve_linked: findings.filter((f) => f.cve_id).length,
    critical_count: bySeverity["CRITICAL"] ?? 0,
    high_count: bySeverity["HIGH"] ?? 0,
  }
}
