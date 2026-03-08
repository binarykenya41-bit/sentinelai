"use client"

import { ShieldAlert, Bug, Wrench, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { dashboardApi, type DashboardStats } from "@/lib/api-client"

const FALLBACK: DashboardStats = {
  security_score: 78,
  score_delta: 4.2,
  last_scan: new Date().toISOString(),
  vulnerabilities: { total: 50, open: 38, in_progress: 6, patched: 4, verified: 2, critical_open: 12, kev_open: 8, exploitable: 5, new_today: 3 },
  assets: { total: 50, critical: 12, behind_patch: 18, by_type: {} },
  simulations: { total: 22, successful: 17, success_rate: 77, new_today: 3 },
  patches: { total: 13, pending: 5, merged: 7 },
  threat_feed: { total: 30, kev: 20, exploit_available: 18, critical: 14 },
}

export function KpiCards() {
  const { data, loading } = useApi(() => dashboardApi.stats(), [])
  const stats = data ?? FALLBACK

  const kpis = [
    {
      label: "Critical Vulnerabilities",
      value: stats.vulnerabilities.critical_open,
      sub: `${stats.vulnerabilities.kev_open} in CISA KEV`,
      icon: ShieldAlert,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Actively Exploitable",
      value: stats.vulnerabilities.exploitable,
      sub: `EPSS ≥ 70%`,
      icon: Bug,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Patches Pending",
      value: stats.patches.pending,
      sub: `${stats.patches.merged} merged`,
      icon: Wrench,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Verified Secure",
      value: stats.vulnerabilities.patched + stats.vulnerabilities.verified,
      sub: `of ${stats.vulnerabilities.total} total`,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-card-foreground">{kpi.value}</span>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <span className="text-[10px] text-muted-foreground/70">{kpi.sub}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
