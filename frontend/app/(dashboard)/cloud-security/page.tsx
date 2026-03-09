"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Cloud, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { cloudSecurityApi, type CloudFinding, type CloudSecurityStats } from "@/lib/api-client"

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusBadge = (s: string) => {
  if (s === "Open") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "In Progress") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Resolved") return "bg-success/10 text-success border-success/20"
  return "bg-muted text-muted-foreground border-border"
}

const providerColor = (p: string) => {
  if (p === "AWS") return "text-warning"
  if (p === "Azure") return "text-primary"
  if (p === "GCP") return "text-success"
  return "text-muted-foreground"
}

export default function CloudSecurityPage() {
  const { data: findingsData, loading } = useApi(() => cloudSecurityApi.list({ limit: 100 }))
  const { data: stats } = useApi<CloudSecurityStats>(() => cloudSecurityApi.stats())

  const findings = findingsData?.findings ?? []
  const providerScores = stats?.provider_scores ?? {}

  return (
    <div className="flex flex-col">
      <AppHeader title="Cloud Security (CSPM)" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Findings", value: stats?.total ?? 0, color: "text-primary" },
            { label: "Open", value: stats?.open ?? 0, color: "text-destructive" },
            { label: "Critical", value: stats?.critical ?? 0, color: "text-destructive" },
            { label: "Resolved", value: stats?.resolved ?? 0, color: "text-success" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Provider Scores */}
        <div className="grid grid-cols-3 gap-4">
          {["AWS", "Azure", "GCP"].map(provider => {
            const ps = providerScores[provider]
            const score = ps?.score ?? 100
            return (
              <Card key={provider} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className={`h-4 w-4 ${providerColor(provider)}`} />
                    <CardTitle className="text-sm font-semibold text-card-foreground">{provider}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-end gap-2 mb-2">
                    <span className={`text-3xl font-bold font-mono ${score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive"}`}>{score}</span>
                    <span className="text-sm text-muted-foreground mb-1">/100</span>
                  </div>
                  <Progress value={score} className={`h-2 bg-secondary ${score >= 80 ? "[&>div]:bg-success" : score >= 60 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`} />
                  {ps && <p className="text-[10px] text-muted-foreground mt-1">{ps.open} open findings · {ps.total} total</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Findings Breakdown */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By Severity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {Object.entries(stats?.by_severity ?? {}).map(([sev, count]) => (
                <div key={sev} className="flex items-center justify-between">
                  <Badge variant="outline" className={sevBadge(sev)}>{sev}</Badge>
                  <div className="flex items-center gap-2">
                    <Progress value={stats?.total ? (count / stats.total) * 100 : 0} className="w-20 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className="font-mono text-xs text-muted-foreground w-6">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By Provider</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {Object.entries(stats?.by_provider ?? {}).map(([prov, count]) => (
                <div key={prov} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${providerColor(prov)}`}>{prov}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={stats?.total ? (count / stats.total) * 100 : 0} className="w-20 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className="font-mono text-xs text-muted-foreground w-6">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Findings Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Misconfigurations ({findings.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading findings…</div>
            ) : findings.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-success text-sm">
                <CheckCircle className="h-4 w-4 mr-2" /> No misconfigurations found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Provider", "Resource", "Title", "Severity", "Status", "Region", "Detected"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f: CloudFinding) => (
                      <tr key={f.finding_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${providerColor(f.provider)}`}>{f.provider}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">{f.resource_type ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-card-foreground max-w-xs">{f.title}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={sevBadge(f.severity)}>{f.severity}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(f.status)}>{f.status}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{f.region ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{new Date(f.detected_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
