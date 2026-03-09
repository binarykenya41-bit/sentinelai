"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GitMerge, CheckCircle, XCircle, Clock } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { devsecopsApi, type DevSecOpsPipeline, type SbomFinding, type DevSecOpsPolicy, type DevSecOpsStats } from "@/lib/api-client"

const statusIcon = (s: string) => {
  if (s === "passed") return <CheckCircle className="h-3.5 w-3.5 text-success" />
  if (s === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />
  return <Clock className="h-3.5 w-3.5 text-warning" />
}

const statusBadge = (s: string) => {
  if (s === "passed") return "bg-success/10 text-success border-success/20"
  if (s === "failed") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-warning/10 text-warning border-warning/20"
}

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function DevSecOpsPage() {
  const { data: pipelineData, loading } = useApi(() => devsecopsApi.pipelines({ limit: 50 }))
  const { data: stats } = useApi<DevSecOpsStats>(() => devsecopsApi.stats())
  const { data: sbom } = useApi<SbomFinding[]>(() => devsecopsApi.sbom())
  const { data: policies } = useApi<DevSecOpsPolicy[]>(() => devsecopsApi.policies())

  const pipelines = pipelineData?.pipelines ?? []
  const passRate = stats?.policy_pass_rate ?? 0

  return (
    <div className="flex flex-col">
      <AppHeader title="DevSecOps Pipeline" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Pipelines Total", value: stats?.total ?? 0, color: "text-primary" },
            { label: "SBOM Findings", value: stats?.sbom_findings ?? 0, color: "text-warning" },
            { label: "Secrets Detected", value: stats?.secrets_detected ?? 0, color: "text-destructive" },
            { label: "Policy Pass Rate", value: `${passRate}%`, color: passRate >= 80 ? "text-success" : "text-warning" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Pipeline Status */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {[
                { label: "Passed", value: stats?.passed ?? 0, color: "text-success" },
                { label: "Failed", value: stats?.failed ?? 0, color: "text-destructive" },
                { label: "Running", value: stats?.running ?? 0, color: "text-warning" },
                { label: "SAST Issues", value: stats?.sast_issues ?? 0, color: "text-warning" },
                { label: "DAST Issues", value: stats?.dast_issues ?? 0, color: "text-warning" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Policies */}
          <Card className="border-border bg-card col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Security Gate Policies</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {(policies ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No policies configured.</p>
              ) : (policies ?? []).map((p: DevSecOpsPolicy) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {p.status === "Passing" ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    <div>
                      <p className="text-xs font-semibold text-card-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={p.status === "Passing" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                    {p.status}{p.failures > 0 && ` (${p.failures})`}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SBOM Findings */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              SBOM Findings ({(sbom ?? []).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(sbom ?? []).length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No SBOM findings.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Component", "Version", "CVE", "Severity", "License", "Fix Version"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(sbom ?? []).map((f: SbomFinding) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 font-mono text-xs text-card-foreground">{f.component}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.version ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{f.cve_id ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={sevBadge(f.severity)}>{f.severity}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{f.license ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-success">{f.fix_version ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pipelines */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Pipelines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading pipelines…</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Pipeline", "Repo / Branch", "Status", "Stage", "SBOM", "Secrets", "SAST", "Policy", "Run At"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((p: DevSecOpsPipeline) => (
                    <tr key={p.pipeline_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(p.status)}
                          <span className="text-xs font-semibold text-card-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.repo}<br/><span className="text-[10px]">{p.branch}</span></td>
                      <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(p.status)}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.stage ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.sbom_findings > 0 ? <span className="text-warning">{p.sbom_findings}</span> : <span className="text-success">0</span>}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.secrets_count > 0 ? <span className="text-destructive">{p.secrets_count}</span> : <span className="text-success">0</span>}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.sast_issues > 0 ? <span className="text-warning">{p.sast_issues}</span> : <span className="text-success">0</span>}</td>
                      <td className="px-4 py-3">
                        {p.policy_pass === null ? <span className="text-xs text-muted-foreground">Running</span> :
                          p.policy_pass ? <span className="text-success text-xs">Pass</span> : <span className="text-destructive text-xs">Fail</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.run_at ? new Date(p.run_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
