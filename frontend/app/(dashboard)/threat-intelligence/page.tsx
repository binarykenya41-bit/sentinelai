"use client"

import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown, Minus, RefreshCw, AlertTriangle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { threatFeedApi, type ThreatFeedEntry, type ThreatFeedStats } from "@/lib/api-client"
import { toast } from "sonner"

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "up": return <ArrowUp className="h-3.5 w-3.5 text-destructive" />
    case "down": return <ArrowDown className="h-3.5 w-3.5 text-success" />
    default: return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function cvssColor(score: number) {
  if (score >= 9.0) return "text-destructive"
  if (score >= 7.0) return "text-warning"
  return "text-chart-1"
}

function severityFromCvss(score: number) {
  if (score >= 9.0) return "Critical"
  if (score >= 7.0) return "High"
  if (score >= 4.0) return "Medium"
  return "Low"
}

function severityBadgeClass(sev: string) {
  if (sev === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (sev === "High") return "bg-warning/10 text-warning border-warning/20"
  return "bg-chart-1/10 text-chart-1 border-chart-1/20"
}

export default function ThreatIntelligencePage() {
  const { data: feedData, loading: feedLoading, error: feedError, refetch } = useApi(
    () => threatFeedApi.list({ limit: 100 }),
    []
  )
  const { data: stats, loading: statsLoading } = useApi(
    () => threatFeedApi.stats(),
    []
  )

  const entries: ThreatFeedEntry[] = feedData?.entries ?? []
  const kevEntries = entries.filter((e) => e.kev_status).slice(0, 6)
  const topExploited = [...entries]
    .filter((e) => e.exploit_available)
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 5)
  const criticalCount = entries.filter((e) => (e.cvss_v3 ?? 0) >= 9.0).length
  const wildCount = entries.filter((e) => e.exploit_available).length
  const kevCount = entries.filter((e) => e.kev_status).length

  const handleRefresh = () => {
    toast.loading("Refreshing threat feed...", { duration: 1500 })
    refetch()
    setTimeout(() => toast.success("Threat feed updated"), 1600)
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Threat Intelligence" />
      <div className="flex flex-col gap-6 p-6">

        {feedError && (
          <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Backend unreachable — showing cached data. {feedError}
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Critical CVEs Active", value: criticalCount, color: "text-destructive" },
            { label: "Exploited in Wild", value: wildCount, color: "text-warning" },
            { label: "CISA KEV Entries", value: kevCount, color: "text-destructive" },
            { label: "Total Feed Entries", value: entries.length, color: "text-primary" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-border bg-card">
              <CardContent className="p-4">
                {feedLoading
                  ? <Skeleton className="h-8 w-16 mb-1" />
                  : <div className={`text-2xl font-bold ${color}`}>{value}</div>
                }
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* CISA KEV */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent CISA KEV Additions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {feedLoading
                ? [0,1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)
                : kevEntries.map((item) => (
                  <Link key={item.cve_id} href={`/threat-intelligence/${encodeURIComponent(item.cve_id)}`}>
                    <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-semibold text-card-foreground">{item.cve_id}</span>
                        <span className="text-[11px] text-muted-foreground">{item.product ?? item.vendor ?? "—"}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          Added: {new Date(item.published_at).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">
                          CVSS {item.cvss_v3?.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              }
            </CardContent>
          </Card>

          {/* Trending MITRE Techniques */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Trending MITRE Techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {statsLoading
                ? [0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)
                : (stats as ThreatFeedStats | null)?.top_techniques.slice(0, 6).map((item, idx) => {
                  const maxCount = stats?.top_techniques[0]?.count ?? 1
                  return (
                    <div key={item.technique} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3">
                      <div className="flex items-center gap-2">
                        <TrendIcon trend={idx < 3 ? "up" : idx < 5 ? "stable" : "down"} />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-semibold text-primary">{item.technique}</span>
                        </div>
                      </div>
                      <div className="flex h-6 items-center">
                        <div className="h-1.5 rounded-full bg-primary/20" style={{ width: "80px" }}>
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{item.count}</span>
                      </div>
                    </div>
                  )
                })
              }
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Exploited CVEs */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Priority CVEs
                </CardTitle>
                <Button size="sm" variant="outline"
                  className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground gap-1.5"
                  onClick={handleRefresh}>
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {feedLoading
                ? [0,1,2,3,4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)
                : topExploited.map((item, i) => {
                  const maxPriority = topExploited[0]?.priority_score ?? 100
                  return (
                    <Link key={item.cve_id} href={`/threat-intelligence/${encodeURIComponent(item.cve_id)}`}>
                      <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3 hover:bg-secondary transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card font-mono text-xs font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-semibold text-primary">{item.cve_id}</span>
                            <span className="text-[10px] text-muted-foreground">{item.product ?? "—"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-20 rounded-full bg-destructive/20">
                            <div className="h-full rounded-full bg-destructive" style={{ width: `${((item.priority_score ?? 0) / maxPriority) * 100}%` }} />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{item.priority_score}</span>
                          <Badge variant="outline" className={item.exploit_maturity === "weaponized" ? "bg-destructive/10 text-destructive border-destructive/20 text-[9px]" : "bg-warning/10 text-warning border-warning/20 text-[9px]"}>
                            {item.exploit_maturity ?? "poc"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })
              }
            </CardContent>
          </Card>

          {/* Weaponized vs PoC breakdown */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Exploit Maturity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0">
              {statsLoading
                ? [0,1,2,3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)
                : stats && [
                  { label: "Weaponized", value: (stats as ThreatFeedStats).weaponized, color: "bg-destructive", textColor: "text-destructive" },
                  { label: "Functional PoC", value: (stats as ThreatFeedStats).functional, color: "bg-warning", textColor: "text-warning" },
                  { label: "PoC Only", value: (stats as ThreatFeedStats).poc, color: "bg-chart-1", textColor: "text-chart-1" },
                  { label: "No Exploit", value: (stats as ThreatFeedStats).total - (stats as ThreatFeedStats).exploit_available, color: "bg-muted", textColor: "text-muted-foreground" },
                ].map(({ label, value, color, textColor }) => {
                  const total = (stats as ThreatFeedStats).total || 1
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`w-28 text-xs font-medium ${textColor}`}>{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / total) * 100}%` }} />
                      </div>
                      <span className={`font-mono text-xs font-bold ${textColor}`}>{value}</span>
                    </div>
                  )
                })
              }
            </CardContent>
          </Card>
        </div>

        {/* Full CVE Feed */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Full Intelligence Feed
              </CardTitle>
              <span className="text-xs text-muted-foreground">{entries.length} entries</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {feedLoading
              ? <div className="p-4 flex flex-col gap-2">{[0,1,2,3,4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["CVE","Product","Severity","CVSS","EPSS","KEV","Exploit","Action"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, 50).map((t) => {
                      const sev = severityFromCvss(t.cvss_v3 ?? 0)
                      return (
                        <tr key={t.cve_id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{t.cve_id}</td>
                          <td className="px-4 py-3 text-xs text-card-foreground">{t.product ?? t.vendor ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={severityBadgeClass(sev)}>{sev}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono text-sm font-bold ${cvssColor(t.cvss_v3 ?? 0)}`}>{t.cvss_v3?.toFixed(1) ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-card-foreground">
                            {t.epss_score != null ? `${(t.epss_score * 100).toFixed(0)}%` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {t.kev_status
                              ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">KEV</Badge>
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            {t.exploit_available
                              ? <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{t.exploit_maturity ?? "Yes"}</Badge>
                              : <span className="text-xs text-muted-foreground">No</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/threat-intelligence/${encodeURIComponent(t.cve_id)}`}>
                              <Button variant="outline" size="sm" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">Detail</Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
