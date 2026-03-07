import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Activity, ShieldAlert, Clock, Cpu, HardDrive, Network } from "lucide-react"

const asset = {
  id: "AST-001",
  hostname: "prod-web-01.internal",
  ip: ["10.0.1.10", "172.16.0.2"],
  type: "Server",
  os: "Ubuntu 22.04.3 LTS",
  kernel: "5.15.0-91-generic",
  arch: "x86_64",
  cpu: "Intel Xeon E5-2686 v4 × 8",
  ram: "32 GB",
  disk: "500 GB SSD (68% used)",
  criticality: "Critical",
  owner: "platform-team",
  environment: "Production",
  tags: ["web", "nginx", "public-facing"],
  lastScan: "2026-03-06 01:00 UTC",
  firstSeen: "2025-06-12",
  uptime: "47 days",
  status: "Online",
}

const vulnerabilities = [
  { cve: "CVE-2026-21001", cvss: 9.8, component: "nginx 1.24.0", status: "Open", epss: "97%" },
  { cve: "CVE-2026-09871", cvss: 7.5, component: "openssl 3.1.4", status: "In Progress", epss: "72%" },
  { cve: "CVE-2025-44831", cvss: 6.1, component: "libcurl 7.88.1", status: "Open", epss: "41%" },
  { cve: "CVE-2025-38210", cvss: 5.4, component: "glibc 2.35", status: "Open", epss: "28%" },
]

const openPorts = [
  { port: 22, service: "SSH", state: "Open", risk: "Medium" },
  { port: 80, service: "HTTP", state: "Open", risk: "Low" },
  { port: 443, service: "HTTPS", state: "Open", risk: "Low" },
  { port: 9090, service: "Prometheus", state: "Open", risk: "Medium" },
]

const recentEvents = [
  { time: "01:14 UTC", event: "Vulnerability scan completed — 7 findings", type: "scan" },
  { time: "00:52 UTC", event: "SSH login from 10.0.0.5 (j.smith)", type: "access" },
  { time: "23:30 UTC", event: "Package update: nginx 1.24.0 → no patch available", type: "info" },
  { time: "22:18 UTC", event: "Outbound connection blocked: 185.220.101.34:4444", type: "block" },
  { time: "21:00 UTC", event: "EDR agent heartbeat OK", type: "info" },
]

const sevColor = (n: number) => n >= 9 ? "text-destructive" : n >= 7 ? "text-warning" : "text-primary"
const riskBadge = (r: string) => r === "Medium" ? "bg-warning/10 text-warning border-warning/20" : "bg-primary/10 text-primary border-primary/20"
const eventColor = (t: string) => t === "block" ? "text-destructive" : t === "access" ? "text-warning" : t === "scan" ? "text-primary" : "text-muted-foreground"

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Asset — ${asset.hostname}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Header info */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-border bg-card col-span-2">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-mono text-sm font-bold text-card-foreground">{asset.hostname}</p>
                  <p className="text-xs text-muted-foreground">{asset.ip.join(" · ")}</p>
                </div>
                <Badge variant="outline" className="ml-auto bg-success/10 text-success border-success/20">{asset.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {[
                  ["Type", asset.type], ["OS", asset.os], ["Kernel", asset.kernel],
                  ["Arch", asset.arch], ["Environment", asset.environment], ["Owner", asset.owner],
                  ["First Seen", asset.firstSeen], ["Uptime", asset.uptime],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24 shrink-0">{k}</span>
                    <span className="font-mono text-card-foreground">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {asset.tags.map((t) => <Badge key={t} variant="outline" className="border-border text-muted-foreground text-[10px]">{t}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <Cpu className="h-3.5 w-3.5" /> Hardware
              </div>
              {[["CPU", asset.cpu], ["RAM", asset.ram], ["Disk", asset.disk]].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] text-muted-foreground">{k}</p>
                  <p className="text-xs text-card-foreground font-mono">{v}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5" /> Risk Summary
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Criticality", value: asset.criticality, color: "text-destructive" },
                  { label: "Open CVEs", value: String(vulnerabilities.filter(v => v.status === "Open").length), color: "text-destructive" },
                  { label: "Last Scan", value: asset.lastScan, color: "text-muted-foreground" },
                ].map((r) => (
                  <div key={r.label}>
                    <p className="text-[10px] text-muted-foreground">{r.label}</p>
                    <p className={`text-xs font-semibold ${r.color}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Vulnerabilities */}
          <div className="col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vulnerabilities</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["CVE", "CVSS", "Component", "EPSS", "Status"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vulnerabilities.map((v) => (
                      <tr key={v.cve} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{v.cve}</td>
                        <td className={`px-4 py-3 font-mono text-sm font-bold ${sevColor(v.cvss)}`}>{v.cvss}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.component}</td>
                        <td className="px-4 py-3 font-mono text-xs text-warning">{v.epss}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={v.status === "Open" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>{v.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Open Ports */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open Ports</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Port", "Service", "Risk"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openPorts.map((p) => (
                    <tr key={p.port} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 font-mono text-sm font-bold text-card-foreground">{p.port}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.service}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={riskBadge(p.risk)}>{p.risk}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-4">
            {recentEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Clock className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${eventColor(e.type)}`} />
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">{e.time}</span>
                  <p className={`text-xs ${eventColor(e.type)}`}>{e.event}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
