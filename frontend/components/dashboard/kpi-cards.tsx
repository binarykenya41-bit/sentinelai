import { ShieldAlert, Bug, Wrench, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const kpis = [
  {
    label: "Critical Vulnerabilities",
    value: 12,
    change: "+3",
    icon: ShieldAlert,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    label: "Actively Exploitable",
    value: 5,
    change: "-1",
    icon: Bug,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    label: "Patches Pending",
    value: 8,
    change: "+2",
    icon: Wrench,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    label: "Verified Secure",
    value: 147,
    change: "+12",
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
  },
]

export function KpiCards() {
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
