"use client"

import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitBranch, GitPullRequest, CheckCircle, Circle, XCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { patchesApi, integrationsApi, type PatchRecord, type PatchStats } from "@/lib/api-client"

function mergeStatusBadge(status: string | null) {
  const s = status ?? "open"
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    open: { color: "bg-success/10 text-success border-success/20", icon: <Circle className="h-3 w-3" /> },
    approved: { color: "bg-chart-1/10 text-chart-1 border-chart-1/20", icon: <CheckCircle className="h-3 w-3" /> },
    merged: { color: "bg-primary/10 text-primary border-primary/20", icon: <CheckCircle className="h-3 w-3" /> },
    blocked: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
  }
  const style = map[s] ?? map.open
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${style.color}`}>
      {style.icon} {s.charAt(0).toUpperCase() + s.slice(1)}
    </Badge>
  )
}

function ciBadge(status: string | null) {
  switch (status) {
    case "passed": return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Passing</Badge>
    case "running": return <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Running</Badge>
    case "failed": return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>
    default: return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">Pending</Badge>
  }
}

function resimBadge(result: string | null) {
  if (!result || result === "pending") return null
  if (result === "exploit_failed") return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Fix Verified</Badge>
  return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Exploit Still Works</Badge>
}

export default function PatchAutomationPage() {
  const { data, loading, error, refetch } = useApi(() => patchesApi.list({ limit: 50 }), [])
  const { data: stats } = useApi(() => patchesApi.stats(), [])
  const { data: integrationStatus } = useApi(() => integrationsApi.status(), [])

  const patches: PatchRecord[] = data?.patches ?? []
  const patchStats = stats as PatchStats | null

  return (
    <div className="flex flex-col">
      <AppHeader title="Patch Automation" />
      <div className="flex flex-col gap-6 p-6">

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Backend unreachable — showing last known data. {error}
          </div>
        )}

        {/* Stats bar */}
        {patchStats && (
          <div className="flex items-center gap-4">
            {[
              { label: "Total Patches", value: patchStats.total, color: "text-primary" },
              { label: "CI Passing", value: patchStats.ci_passing, color: "text-success" },
              { label: "CI Failing", value: patchStats.ci_failing, color: "text-destructive" },
              { label: "Pending Merge", value: patchStats.pending_merge, color: "text-warning" },
              { label: "Merged", value: patchStats.merged, color: "text-chart-1" },
              { label: "Fix Verified", value: patchStats.exploit_confirmed_fixed, color: "text-success" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="border-border bg-card flex-1">
                <CardContent className="p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Company service integration cards */}
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-4">
          {(integrationStatus ?? []).map((int) => (
            <Card key={int.service_id} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-card-foreground truncate">{int.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">:{int.port}</span>
                </div>
                <Badge variant="outline" className={`ml-auto shrink-0 ${int.status === "Connected" ? "bg-success/10 text-success border-success/20" : int.status === "Unknown" ? "bg-muted/50 text-muted-foreground border-border" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                  {int.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AI-Generated Patches — {patches.length} records
          </h2>
          <Button variant="outline" size="sm" className="border-border bg-secondary text-muted-foreground hover:bg-accent" onClick={refetch}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* Patch list */}
        {loading
          ? [0,1,2,3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)
          : patches.map((patch) => {
            const vuln = patch.vulnerabilities as { cve_id?: string; cvss_v3?: number; blast_radius?: string } | undefined
            return (
              <Card key={patch.patch_id} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GitPullRequest className="h-4 w-4 text-primary" />
                      <CardTitle className="font-mono text-sm text-card-foreground">
                        {vuln?.cve_id ?? patch.vuln_id.slice(0, 8)}
                      </CardTitle>
                      {vuln?.cvss_v3 && (
                        <Badge variant="outline" className={`${(vuln.cvss_v3 ?? 0) >= 9 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          CVSS {vuln.cvss_v3.toFixed(1)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{vuln?.blast_radius ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {mergeStatusBadge(patch.merge_status)}
                      {ciBadge(patch.ci_status)}
                      {resimBadge(patch.resim_result)}
                      <Link href={`/patch-automation/${encodeURIComponent(vuln?.cve_id ?? patch.patch_id)}`}>
                        <Button variant="outline" size="sm" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                          Detail
                        </Button>
                      </Link>
                      {patch.merge_status === "open" && (
                        <Button size="sm" className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                          Merge
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground w-16">Branch:</span>
                    <span className="font-mono text-primary truncate">{patch.branch_name ?? "—"}</span>
                  </div>
                  {patch.commit_sha && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground w-16">Commit:</span>
                      <span className="font-mono text-card-foreground">{patch.commit_sha}</span>
                    </div>
                  )}
                  {patch.pr_url && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground w-16">PR:</span>
                      <a href={patch.pr_url} target="_blank" rel="noreferrer" className="font-mono text-primary hover:underline truncate">
                        {patch.pr_url}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground w-16">Author:</span>
                    <span className="font-mono text-card-foreground">{patch.authored_by}</span>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(patch.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        }
      </div>
    </div>
  )
}
