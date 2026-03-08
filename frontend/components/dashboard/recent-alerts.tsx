"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { threatFeedApi, type ThreatFeedEntry } from "@/lib/api-client"

function impactColor(cvss: number) {
  if (cvss >= 9.0) return "bg-destructive/10 text-destructive border-destructive/20"
  if (cvss >= 7.0) return "bg-warning/10 text-warning border-warning/20"
  return "bg-chart-1/10 text-chart-1 border-chart-1/20"
}

function severityLabel(cvss: number) {
  if (cvss >= 9.0) return "Critical"
  if (cvss >= 7.0) return "High"
  if (cvss >= 4.0) return "Medium"
  return "Low"
}

export function RecentAlerts() {
  const { data, loading } = useApi(
    () => threatFeedApi.list({ exploit: true, limit: 5 }),
    []
  )

  const alerts: ThreatFeedEntry[] = data?.entries ?? []

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          High-Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        {loading
          ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)
          : alerts.length === 0
            ? <p className="text-xs text-muted-foreground py-4 text-center">No high-risk alerts</p>
            : alerts.map((alert) => {
              const cvss = alert.cvss_v3 ?? 0
              const epss = alert.epss_score ?? 0
              const component = [alert.vendor, alert.product].filter(Boolean).join(" ") || "Unknown component"
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-card-foreground">
                        {alert.cve_id}
                      </span>
                      <Badge variant="outline" className={impactColor(cvss)}>
                        {severityLabel(cvss)}
                      </Badge>
                      {alert.kev_status && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">
                          KEV
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{component}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-card-foreground">
                        {Math.round(epss * 100)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">EPSS</span>
                    </div>
                    <Link href={`/threat-intelligence/${alert.cve_id}`}>
                      <Button variant="outline" size="sm" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })
        }
      </CardContent>
    </Card>
  )
}
