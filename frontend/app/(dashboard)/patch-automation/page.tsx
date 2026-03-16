"use client"

import { useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GitBranch, GitPullRequest, CheckCircle, Circle, XCircle, Loader2, AlertTriangle, RefreshCw, ExternalLink, GitMerge, ShieldCheck, Download } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { patchesApi, integrationsApi, type PatchRecord, type PatchStats } from "@/lib/api-client"
import { toast } from "sonner"

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
  const [mergingId, setMergingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [pushingLogistics, setPushingLogistics] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installResults, setInstallResults] = useState<Array<{ service: string; status: string; actions: string[]; errors: string[] }> | null>(null)

  const handleMerge = async (patch: PatchRecord) => {
    setMergingId(patch.patch_id)
    const cve = (patch.vulnerabilities as { cve_id?: string } | undefined)?.cve_id ?? patch.vuln_id.slice(0, 8)
    const toastId = toast.loading(`Merging PR for ${cve}…`)
    try {
      await patchesApi.merge(patch.patch_id)
      toast.dismiss(toastId)
      toast.success("PR merged — vulnerability marked as patched")
      refetch()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Merge failed")
    } finally {
      setMergingId(null)
    }
  }

  const handleApprove = async (patch: PatchRecord) => {
    setApprovingId(patch.patch_id)
    const cve = (patch.vulnerabilities as { cve_id?: string } | undefined)?.cve_id ?? patch.vuln_id.slice(0, 8)
    const toastId = toast.loading(`Approving PR for ${cve}…`)
    try {
      await patchesApi.approve(patch.patch_id)
      toast.dismiss(toastId)
      toast.success("PR approved")
      refetch()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Approve failed")
    } finally {
      setApprovingId(null)
    }
  }

  const handlePushLogistics = async () => {
    setPushingLogistics(true)
    const toastId = toast.loading("Committing logistics patch files to GitHub…")
    try {
      const result = await patchesApi.pushLogistics()
      toast.dismiss(toastId)
      if (result.pr_url) {
        toast.success(`PR opened: ${result.pr_url}`)
      } else {
        toast.success(`${result.records_created} patch records created (no GitHub token — saved locally)`)
      }
      refetch()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Push failed")
    } finally {
      setPushingLogistics(false)
    }
  }

  const handleInstall = async () => {
    setInstalling(true)
    setInstallResults(null)
    const toastId = toast.loading("Applying hardening to live containers…")
    try {
      const result = await patchesApi.install()
      toast.dismiss(toastId)
      const ok = result.results.filter((r) => r.status === "ok").length
      const needsRestart = result.results.filter((r) => r.status === "needs_restart").length
      toast.success(`Hardening applied: ${ok} services patched, ${needsRestart} need restart`)
      setInstallResults(result.results)
      refetch()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Install failed")
    } finally {
      setInstalling(false)
    }
  }

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

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-border text-xs gap-1.5"
            onClick={handlePushLogistics}
            disabled={pushingLogistics}
          >
            {pushingLogistics ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitMerge className="h-3 w-3" />}
            {pushingLogistics ? "Pushing…" : "Push Logistics Patches"}
          </Button>

          <Button
            size="sm"
            className="bg-warning text-warning-foreground hover:bg-warning/90 text-xs gap-1.5"
            onClick={handleInstall}
            disabled={installing}
          >
            {installing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {installing ? "Installing…" : "Install / Update System"}
          </Button>

          <Button variant="outline" size="sm" className="border-border bg-secondary text-muted-foreground hover:bg-accent ml-auto" onClick={refetch}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* Install results */}
        {installResults && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Hardening Results
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {installResults.map((r) => (
                <div key={r.service} className={`rounded border px-3 py-2 text-xs ${
                  r.status === "ok" ? "border-success/30 bg-success/5" :
                  r.status === "needs_restart" ? "border-warning/30 bg-warning/5" :
                  "border-destructive/30 bg-destructive/5"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold capitalize">{r.service}</span>
                    <Badge variant="outline" className={`text-[10px] border-0 ${
                      r.status === "ok" ? "bg-success/10 text-success" :
                      r.status === "needs_restart" ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    }`}>{r.status === "needs_restart" ? "Needs Restart" : r.status.toUpperCase()}</Badge>
                  </div>
                  {r.actions.map((a) => <p key={a} className="text-success ml-2">→ {a}</p>)}
                  {r.errors.map((e) => <p key={e} className="text-destructive ml-2">✗ {e}</p>)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Patches — {patches.length} records
          </h2>
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
                      {patch.pr_url && (
                        <a href={patch.pr_url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                            <ExternalLink className="h-3 w-3 mr-1" />PR
                          </Button>
                        </a>
                      )}
                      {patch.merge_status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-chart-1/40 text-chart-1 hover:bg-chart-1/10 text-xs"
                          onClick={() => handleApprove(patch)}
                          disabled={approvingId === patch.patch_id}
                        >
                          {approvingId === patch.patch_id
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Approving…</>
                            : <><CheckCircle className="h-3 w-3 mr-1" />Approve</>
                          }
                        </Button>
                      )}
                      {(patch.merge_status === "open" || patch.merge_status === "approved") && (
                        <Button
                          size="sm"
                          className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                          onClick={() => handleMerge(patch)}
                          disabled={mergingId === patch.patch_id}
                        >
                          {mergingId === patch.patch_id
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Merging…</>
                            : <><GitMerge className="h-3 w-3 mr-1" />Merge PR</>
                          }
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
