import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, Database, Wifi, Cloud, Monitor, Globe, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Total Nodes", value: "342", color: "text-primary" },
  { label: "Online", value: "318", color: "text-success" },
  { label: "Offline / Degraded", value: "24", color: "text-destructive" },
  { label: "Unscanned Nodes", value: "11", color: "text-warning" },
]

const nodes = [
  { id: "INF-001", name: "prod-web-cluster", type: "Cloud VM", env: "Production", ip: "10.0.1.10", os: "Ubuntu 22.04", status: "Online", patchStatus: "Current", vulns: 3, lastSeen: "2026-03-07 01:00 UTC", source: "AWS" },
  { id: "INF-002", name: "prod-db-primary", type: "Database", env: "Production", ip: "10.0.2.5", os: "RHEL 9", status: "Online", patchStatus: "Current", vulns: 1, lastSeen: "2026-03-07 01:00 UTC", source: "Manual" },
  { id: "INF-003", name: "core-firewall-01", type: "Firewall", env: "Production", ip: "10.0.0.1", os: "FortiOS 7.4", status: "Online", patchStatus: "Behind", vulns: 7, lastSeen: "2026-03-07 00:55 UTC", source: "FortiManager" },
  { id: "INF-004", name: "edge-router-01", type: "Router", env: "Production", ip: "10.0.0.2", os: "Cisco IOS-XE 17.9", status: "Online", patchStatus: "Current", vulns: 2, lastSeen: "2026-03-07 00:58 UTC", source: "Cisco DNA" },
  { id: "INF-005", name: "k8s-worker-pool", type: "Container Host", env: "Production", ip: "10.0.3.0/24", os: "Flatcar Linux 3.6", status: "Online", patchStatus: "Current", vulns: 9, lastSeen: "2026-03-07 01:00 UTC", source: "Kubernetes" },
  { id: "INF-006", name: "dev-jumpbox", type: "Endpoint", env: "Development", ip: "10.10.1.5", os: "Windows 11 23H2", status: "Online", patchStatus: "Behind", vulns: 5, lastSeen: "2026-03-07 00:30 UTC", source: "Ivanti" },
  { id: "INF-007", name: "monitoring-stack", type: "API Service", env: "Production", ip: "10.0.5.8", os: "Debian 12", status: "Degraded", patchStatus: "Current", vulns: 0, lastSeen: "2026-03-06 23:10 UTC", source: "Zabbix" },
  { id: "INF-008", name: "backup-nas-01", type: "Endpoint", env: "Production", ip: "10.0.6.20", os: "TrueNAS 13.0", status: "Offline", patchStatus: "Unknown", vulns: 0, lastSeen: "2026-03-05 18:00 UTC", source: "Manual" },
  { id: "INF-009", name: "identity-dc-01", type: "Identity System", env: "Production", ip: "10.0.7.1", os: "Windows Server 2022", status: "Online", patchStatus: "Current", vulns: 2, lastSeen: "2026-03-07 01:00 UTC", source: "SCCM" },
  { id: "INF-010", name: "staging-api", type: "API Service", env: "Staging", ip: "10.20.1.8", os: "Alpine 3.18", status: "Online", patchStatus: "Current", vulns: 4, lastSeen: "2026-03-07 00:45 UTC", source: "AWS" },
]

const typeBreakdown = [
  { type: "Cloud VMs", count: 89, icon: Cloud, color: "text-primary" },
  { type: "Network Devices", count: 47, icon: Wifi, color: "text-warning" },
  { type: "Endpoints", count: 124, icon: Monitor, color: "text-success" },
  { type: "Databases", count: 31, icon: Database, color: "text-destructive" },
  { type: "Servers", count: 38, icon: Server, color: "text-primary" },
  { type: "API Services", count: 13, icon: Globe, color: "text-muted-foreground" },
]

const typeIcon = (type: string) => {
  if (type === "Database") return <Database className="h-3 w-3" />
  if (type === "Firewall" || type === "Router") return <Wifi className="h-3 w-3" />
  if (type.includes("Container")) return <Server className="h-3 w-3" />
  if (type === "Cloud VM") return <Cloud className="h-3 w-3" />
  if (type === "Endpoint" || type === "Identity System") return <Monitor className="h-3 w-3" />
  return <Globe className="h-3 w-3" />
}

const statusBadge = (s: string) => {
  if (s === "Online") return "bg-success/10 text-success border-success/20"
  if (s === "Degraded") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

const patchBadge = (s: string) => {
  if (s === "Current") return "bg-success/10 text-success border-success/20"
  if (s === "Behind") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-muted text-muted-foreground border-border"
}

const envBadge = (e: string) => {
  if (e === "Production") return "bg-primary/10 text-primary border-primary/20"
  if (e === "Staging") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function InfrastructurePage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Infrastructure" />
      <div className="flex flex-col gap-6 p-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Node type breakdown */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Node Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {typeBreakdown.map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                    <span className="text-xs text-card-foreground">{t.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(t.count / 342) * 100} className="w-20 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Discovery Sources</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {[
                { source: "AWS", nodes: 89, status: "Live" },
                { source: "Ivanti", nodes: 124, status: "Live" },
                { source: "Cisco DNA Center", nodes: 47, status: "Live" },
                { source: "FortiManager", nodes: 12, status: "Live" },
                { source: "SCCM", nodes: 38, status: "Live" },
                { source: "Zabbix", nodes: 25, status: "Degraded" },
                { source: "Manual Entry", nodes: 7, status: "—" },
              ].map((d) => (
                <div key={d.source} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-xs text-card-foreground">{d.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{d.nodes} nodes</span>
                    <span className={`text-[10px] font-semibold ${d.status === "Live" ? "text-success" : d.status === "Degraded" ? "text-warning" : "text-muted-foreground"}`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              <Link href="/infrastructure/add">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs justify-start gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Infrastructure Node
                </Button>
              </Link>
              <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Trigger Discovery Sync
              </Button>
              <Link href="/api-connections">
                <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                  <Globe className="h-3.5 w-3.5" /> Manage API Connections
                </Button>
              </Link>
              <Link href="/digital-twin">
                <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                  <Server className="h-3.5 w-3.5" /> View Digital Twin
                </Button>
              </Link>
              <Link href="/sandbox">
                <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                  <Cloud className="h-3.5 w-3.5" /> Sandbox / Clone Env
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Nodes Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Infrastructure Nodes</CardTitle>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-success" /> Online
                <AlertTriangle className="h-3 w-3 text-warning" /> Degraded
                <XCircle className="h-3 w-3 text-muted-foreground" /> Offline
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Name", "Type", "Environment", "IP", "OS", "Status", "Patches", "Vulns", "Source", "Last Seen"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((n) => (
                    <tr key={n.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <Link href={`/infrastructure/${n.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{n.id}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/infrastructure/${n.id}`} className="font-mono text-xs text-card-foreground hover:text-primary transition-colors">{n.name}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          {typeIcon(n.type)} {n.type}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={envBadge(n.env)}>{n.env}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{n.ip}</td>
                      <td className="px-4 py-3 text-xs text-card-foreground whitespace-nowrap">{n.os}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadge(n.status)}>{n.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={patchBadge(n.patchStatus)}>{n.patchStatus}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-bold ${n.vulns > 5 ? "text-destructive" : n.vulns > 0 ? "text-warning" : "text-success"}`}>{n.vulns}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{n.source}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{n.lastSeen}</td>
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
