"use client"

import { useState, useMemo } from "react"
import { AppHeader } from "@/components/app-header"
import { VulnFilters } from "@/components/vulnerabilities/vuln-filters"
import { VulnTable } from "@/components/vulnerabilities/vuln-table"
import { VulnDetail } from "@/components/vulnerabilities/vuln-detail"
import { useApi } from "@/hooks/use-api"
import { vulnsApi, type Vulnerability as ApiVuln } from "@/lib/api-client"
import type { Vulnerability as LocalVuln } from "@/lib/vuln-data"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

// Map API vulnerability shape → local Vulnerability shape used by VulnTable/VulnDetail
function mapVuln(v: ApiVuln): LocalVuln {
  const cvss = v.cvss_v3 ?? 0
  const severity: LocalVuln["severity"] =
    cvss >= 9.0 ? "Critical" : cvss >= 7.0 ? "High" : cvss >= 4.0 ? "Medium" : "Low"
  const statusMap: Record<string, LocalVuln["status"]> = {
    open: "Unpatched", in_progress: "Unpatched", patched: "Patched", verified: "Verified",
  }
  return {
    cve: v.cve_id,
    component: v.blast_radius ?? v.scan_source ?? "Unknown",
    severity,
    epss: v.epss_score ?? 0,
    exploitVerified: (v.exploit_history?.length ?? 0) > 0 && (v.exploit_history?.some((e) => e.success) ?? false),
    mitreTechnique: (v.mitre_techniques ?? []).join(", ") || "—",
    status: statusMap[v.remediation_status] ?? "Unpatched",
    environment: "Production",
    description: `CVSS ${cvss.toFixed(1)} — CWE: ${(v.cwe_ids ?? []).join(", ") || "N/A"}. ${v.kev_status ? "CISA KEV listed." : ""} Blast radius: ${v.blast_radius ?? "Unknown"}.`,
    attackScenario: `Detected via ${v.scan_source ?? "scanner"}. MITRE techniques: ${(v.mitre_techniques ?? []).join(", ") || "N/A"}. EPSS exploitation probability: ${((v.epss_score ?? 0) * 100).toFixed(1)}%.`,
    suggestedPatch: `Remediate ${v.cve_id} — apply vendor patch, update dependencies, and re-run exploit simulation to verify fix.`,
  }
}

export default function VulnerabilitiesPage() {
  const [selected, setSelected] = useState<LocalVuln | null>(null)
  const [severityFilter, setSeverityFilter] = useState("all")
  const [exploitableOnly, setExploitableOnly] = useState(false)
  const [envFilter, setEnvFilter] = useState("all")
  const [search, setSearch] = useState("")

  const { data, loading, error } = useApi(
    () => vulnsApi.list({ limit: 200 }),
    []
  )

  const mapped: LocalVuln[] = useMemo(
    () => (data?.vulnerabilities ?? []).map(mapVuln),
    [data]
  )

  const filtered = mapped.filter((v) => {
    if (severityFilter !== "all" && v.severity !== severityFilter) return false
    if (exploitableOnly && !v.exploitVerified) return false
    if (envFilter !== "all" && v.environment !== envFilter) return false
    if (
      search &&
      !v.cve.toLowerCase().includes(search.toLowerCase()) &&
      !v.component.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div className="flex flex-col">
      <AppHeader title="Vulnerabilities" />
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Stats bar */}
          {data && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {data.vulnerabilities.filter((v) => (v.cvss_v3 ?? 0) >= 9.0 && v.remediation_status === "open").length} Critical
              </Badge>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {data.vulnerabilities.filter((v) => v.kev_status && v.remediation_status === "open").length} KEV
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {data.total} Total
              </Badge>
              <span className="ml-auto">Showing {filtered.length} of {mapped.length}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Backend unreachable — showing cached data. {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-2">
              {[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : (
            <>
              <VulnFilters
                severity={severityFilter}
                onSeverityChange={setSeverityFilter}
                exploitableOnly={exploitableOnly}
                onExploitableChange={setExploitableOnly}
                env={envFilter}
                onEnvChange={setEnvFilter}
                search={search}
                onSearchChange={setSearch}
              />
              <VulnTable vulnerabilities={filtered} selected={selected} onSelect={setSelected} />
            </>
          )}
        </div>
        {selected && (
          <VulnDetail vulnerability={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  )
}
