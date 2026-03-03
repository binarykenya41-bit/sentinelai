import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const alerts = [
  {
    cve: "CVE-2026-21001",
    probability: 94,
    impact: "Critical",
    component: "OpenSSL 3.1.x",
  },
  {
    cve: "CVE-2026-18823",
    probability: 87,
    impact: "High",
    component: "log4j-core 2.17",
  },
  {
    cve: "CVE-2026-15447",
    probability: 72,
    impact: "Critical",
    component: "linux-kernel 6.2",
  },
  {
    cve: "CVE-2026-12990",
    probability: 65,
    impact: "High",
    component: "nginx 1.24",
  },
  {
    cve: "CVE-2026-09871",
    probability: 58,
    impact: "Medium",
    component: "postgres 15.3",
  },
]

function impactColor(impact: string) {
  switch (impact) {
    case "Critical":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "High":
      return "bg-warning/10 text-warning border-warning/20"
    default:
      return "bg-chart-1/10 text-chart-1 border-chart-1/20"
  }
}

export function RecentAlerts() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          High-Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        {alerts.map((alert) => (
          <div
            key={alert.cve}
            className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-card-foreground">
                  {alert.cve}
                </span>
                <Badge variant="outline" className={impactColor(alert.impact)}>
                  {alert.impact}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">{alert.component}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-card-foreground">
                  {alert.probability}%
                </span>
                <span className="text-[10px] text-muted-foreground">EPSS</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                Details
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
