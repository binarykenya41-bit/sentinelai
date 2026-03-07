import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Network, Server, ShieldAlert, Activity, Globe, AlertTriangle } from "lucide-react"

const host = {
  id: "NET-HOST-0091",
  ip: "10.0.5.91",
  hostname: "fin-ws-091.internal",
  mac: "00:1A:2B:3C:4D:5E",
  os: "Windows 11 Pro 22H2",
  segment: "Finance — 10.0.5.0/24",
  device: "Workstation",
  owner: "j.morrison",
  status: "Monitoring",
  riskScore: 82,
  lastScanned: "2026-03-06 01:00 UTC",
  firstSeen: "2025-09-14",
}

const openPorts = [
  { port: 22, protocol: "TCP", service: "SSH", state: "Open", banner: "OpenSSH 8.9p1 Ubuntu", risk: "Medium" },
  { port: 135, protocol: "TCP", service: "RPC", state: "Open", banner: "Microsoft Windows RPC", risk: "Medium" },
  { port: 139, protocol: "TCP", service: "NetBIOS", state: "Open", banner: "Windows NetBIOS", risk: "High" },
  { port: 445, protocol: "TCP", service: "SMB", state: "Open", banner: "Windows SMB 3.1.1", risk: "High" },
  { port: 3389, protocol: "TCP", service: "RDP", state: "Open", banner: "Microsoft Terminal Services", risk: "Critical" },
  { port: 5985, protocol: "TCP", service: "WinRM", state: "Open", banner: "Microsoft HTTPAPI 2.0", risk: "High" },
]

const vulnerabilities = [
  { cve: "CVE-2026-21001", cvss: 9.8, component: "nginx 1.24.0", status: "Open" },
  { cve: "CVE-2025-38210", cvss: 5.4, component: "glibc 2.35", status: "Open" },
  { cve: "MS-RDP-BlueKeep", cvss: 9.8, component: "RDP Service", status: "Open" },
]

const trafficAlerts = [
  { time: "02:03 UTC", direction: "Outbound", dst: "185.220.101.34:443", bytes: "1.2 MB", label: "C2 Beacon", risk: "Critical" },
  { time: "01:58 UTC", direction: "Inbound", dst: "10.0.5.91:3389", bytes: "24 KB", label: "RDP Login — Anomalous IP", risk: "Critical" },
  { time: "01:02 UTC", direction: "Lateral", dst: "10.0.5.92:445", bytes: "8 KB", label: "SMB Scan", risk: "High" },
  { time: "00:45 UTC", direction: "Outbound", dst: "8.8.8.8:53", bytes: "1 KB", label: "DNS Query", risk: "Low" },
]

const riskBadge = (r: string) =>
  r === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20"
  : r === "High" ? "bg-warning/10 text-warning border-warning/20"
  : r === "Medium" ? "bg-primary/10 text-primary border-primary/20"
  : "bg-muted text-muted-foreground border-border"

const sevColor = (n: number) => n >= 9 ? "text-destructive" : n >= 7 ? "text-warning" : "text-primary"

export default function NetworkHostDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Host — ${host.ip}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Host Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-mono text-sm font-bold text-card-foreground">{host.hostname}</p>
                      <p className="font-mono text-xs text-muted-foreground">{host.ip} · {host.mac}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{host.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  {[
                    ["OS", host.os],
                    ["Device", host.device],
                    ["Segment", host.segment],
                    ["Owner", host.owner],
                    ["First Seen", host.firstSeen],
                    ["Last Scan", host.lastScanned],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">{k}</span>
                      <span className="font-mono text-card-foreground text-[11px]">{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5" /> Risk Score
              </div>
              <p className="text-5xl font-bold font-mono text-destructive">{host.riskScore}</p>
              <div className="w-full bg-secondary h-2">
                <div className="bg-destructive h-2" style={{ width: `${host.riskScore}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5" /> Exposure
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Open Ports", value: String(openPorts.length), color: "text-warning" },
                  { label: "Open CVEs", value: String(vulnerabilities.length), color: "text-destructive" },
                  { label: "Traffic Alerts", value: String(trafficAlerts.filter(t => t.risk === "Critical").length), color: "text-destructive" },
                ].map(r => (
                  <div key={r.label}>
                    <p className="text-[10px] text-muted-foreground">{r.label}</p>
                    <p className={`text-lg font-bold font-mono ${r.color}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
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
                    {["Port", "Service", "Banner", "Risk"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openPorts.map((p) => (
                    <tr key={p.port} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-2.5 font-mono text-sm font-bold text-card-foreground">{p.port}/{p.protocol}</td>
                      <td className="px-4 py-2.5 text-xs text-primary">{p.service}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{p.banner}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={`text-[10px] ${riskBadge(p.risk)}`}>{p.risk}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Vulnerabilities */}
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
                    {["CVE", "CVSS", "Component", "Status"].map(h => (
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
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">{v.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Alerts */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Traffic Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Time", "Direction", "Destination", "Size", "Label", "Risk"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trafficAlerts.map((t, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.time}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.direction}</td>
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{t.dst}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.bytes}</td>
                    <td className="px-4 py-3 text-xs text-card-foreground">{t.label}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${riskBadge(t.risk)}`}>{t.risk}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
