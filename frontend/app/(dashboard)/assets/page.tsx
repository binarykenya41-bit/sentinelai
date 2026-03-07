import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Server, Database, Container, Globe, Cpu } from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Total Assets", value: "1,284", icon: Cpu, color: "text-primary" },
  { label: "Scanned", value: "1,201", icon: Server, color: "text-success" },
  { label: "Critical Assets", value: "38", icon: Database, color: "text-destructive" },
  { label: "Unscanned", value: "83", icon: Globe, color: "text-warning" },
]

const assets = [
  { id: "AST-001", hostname: "prod-web-01.internal", ip: "10.0.1.10", type: "Server", os: "Ubuntu 22.04", criticality: "Critical", vulns: 7, lastScan: "2026-03-06 01:00 UTC", status: "Online" },
  { id: "AST-002", hostname: "prod-db-primary.internal", ip: "10.0.2.5", type: "Database", os: "RHEL 9", criticality: "Critical", vulns: 3, lastScan: "2026-03-06 01:00 UTC", status: "Online" },
  { id: "AST-003", hostname: "k8s-node-01.internal", ip: "10.0.3.11", type: "Container Host", os: "Flatcar Linux", criticality: "High", vulns: 12, lastScan: "2026-03-05 23:00 UTC", status: "Online" },
  { id: "AST-004", hostname: "api-gateway.internal", ip: "10.0.1.50", type: "Service", os: "Alpine 3.18", criticality: "High", vulns: 5, lastScan: "2026-03-06 00:30 UTC", status: "Online" },
  { id: "AST-005", hostname: "cache-prod-01.internal", ip: "10.0.4.20", type: "Server", os: "Ubuntu 20.04", criticality: "Medium", vulns: 9, lastScan: "2026-03-05 22:00 UTC", status: "Degraded" },
  { id: "AST-006", hostname: "monitoring.internal", ip: "10.0.5.8", type: "Server", os: "Debian 12", criticality: "Medium", vulns: 2, lastScan: "2026-03-06 00:00 UTC", status: "Online" },
  { id: "AST-007", hostname: "backup-storage-01.internal", ip: "10.0.6.3", type: "Server", os: "Ubuntu 22.04", criticality: "High", vulns: 0, lastScan: "2026-03-04 18:00 UTC", status: "Offline" },
  { id: "AST-008", hostname: "mail-relay.internal", ip: "10.0.1.80", type: "Service", os: "Postfix on Debian", criticality: "Low", vulns: 1, lastScan: "2026-03-05 20:00 UTC", status: "Online" },
]

const typeIcon = (type: string) => {
  if (type === "Database") return <Database className="h-3 w-3" />
  if (type.includes("Container")) return <Container className="h-3 w-3" />
  if (type === "Service") return <Globe className="h-3 w-3" />
  return <Server className="h-3 w-3" />
}

const critColor = (c: string) => {
  if (c === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (c === "High") return "bg-warning/10 text-warning border-warning/20"
  if (c === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusColor = (s: string) => {
  if (s === "Online") return "text-success"
  if (s === "Degraded") return "text-warning"
  return "text-muted-foreground"
}

export default function AssetsPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Asset Inventory" />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[{ label: "Servers", val: 68 }, { label: "Containers", val: 82 }, { label: "Databases", val: 91 }, { label: "Services", val: 74 }].map((t) => (
            <Card key={t.label} className="border-border bg-card">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.label} scanned</span>
                  <span className="text-xs font-semibold text-card-foreground">{t.val}%</span>
                </div>
                <Progress value={t.val} className="h-1.5 bg-secondary [&>div]:bg-primary" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Assets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Hostname", "IP", "Type", "OS", "Criticality", "Vulns", "Last Scan", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer">
                      <td className="px-4 py-3">
                        <Link href={`/assets/${a.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{a.id}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/assets/${a.id}`} className="font-mono text-xs text-card-foreground hover:text-primary transition-colors">{a.hostname}</Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.ip}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {typeIcon(a.type)}{a.type}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-card-foreground">{a.os}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={critColor(a.criticality)}>{a.criticality}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-bold ${a.vulns > 5 ? "text-destructive" : a.vulns > 0 ? "text-warning" : "text-success"}`}>{a.vulns}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.lastScan}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${statusColor(a.status)}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
