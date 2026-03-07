import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, ShieldOff, AlertTriangle, CheckCircle } from "lucide-react"

const stats = [
  { label: "Open Ports Detected", value: "3,847", color: "text-warning" },
  { label: "Firewall Violations", value: "24", color: "text-destructive" },
  { label: "Subnets Monitored", value: "18", color: "text-primary" },
  { label: "Anomalies (24h)", value: "7", color: "text-warning" },
]

const openPorts = [
  { host: "10.0.1.10", port: 22, service: "SSH", proto: "TCP", risk: "Medium", state: "Open", note: "Exposed to 0.0.0.0/0" },
  { host: "10.0.1.50", port: 443, service: "HTTPS", proto: "TCP", risk: "Low", state: "Open", note: "Expected" },
  { host: "10.0.2.5", port: 3306, service: "MySQL", proto: "TCP", risk: "Critical", state: "Open", note: "DB port exposed externally" },
  { host: "10.0.3.11", port: 2375, service: "Docker API", proto: "TCP", risk: "Critical", state: "Open", note: "Unprotected Docker daemon" },
  { host: "10.0.4.20", port: 6379, service: "Redis", proto: "TCP", risk: "High", state: "Open", note: "No auth required" },
  { host: "10.0.5.8", port: 9090, service: "Prometheus", proto: "TCP", risk: "Medium", state: "Open", note: "Metrics exposed" },
  { host: "10.0.1.80", port: 25, service: "SMTP", proto: "TCP", risk: "Low", state: "Open", note: "Mail relay" },
  { host: "10.0.6.3", port: 5432, service: "PostgreSQL", proto: "TCP", risk: "High", state: "Filtered", note: "Firewall rule active" },
]

const firewallRules = [
  { rule: "DENY 0.0.0.0/0 → DB subnet 10.0.2.0/24 :3306", status: "Violated", hits: 142 },
  { rule: "ALLOW 10.0.0.0/8 → 10.0.1.0/24 :443", status: "Active", hits: 48291 },
  { rule: "DENY any → 10.0.3.0/24 :2375", status: "Violated", hits: 3 },
  { rule: "ALLOW monitoring → all :9090", status: "Active", hits: 8821 },
  { rule: "DENY 0.0.0.0/0 → 10.0.4.0/24 :6379", status: "Violated", hits: 17 },
]

const trafficAnomalies = [
  { time: "02:14 UTC", src: "185.220.101.34", dst: "10.0.2.5", proto: "TCP", bytes: "2.1 MB", type: "Port Scan", severity: "High" },
  { time: "01:52 UTC", src: "45.133.1.92", dst: "10.0.1.10", proto: "TCP", bytes: "340 KB", type: "Brute Force SSH", severity: "High" },
  { time: "00:38 UTC", src: "10.0.3.11", dst: "8.8.8.8", proto: "DNS", bytes: "18 KB", type: "DNS Tunneling", severity: "Medium" },
  { time: "23:11 UTC", src: "10.0.4.20", dst: "192.168.99.2", proto: "TCP", bytes: "780 KB", type: "Data Exfil Attempt", severity: "Critical" },
]

const riskColor = (r: string) => {
  if (r === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (r === "High") return "bg-warning/10 text-warning border-warning/20"
  if (r === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function NetworkSecurityPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Network Security" />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Open Ports */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open Port Exposure</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Host", "Port", "Service", "Risk", "Note"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openPorts.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.host}</td>
                      <td className="px-3 py-2 font-mono text-xs font-semibold text-card-foreground">{p.port}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{p.service}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={riskColor(p.risk)}>{p.risk}</Badge></td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Traffic Anomalies */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Traffic Anomalies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Time", "Source", "Destination", "Type", "Severity"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trafficAnomalies.map((a, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{a.time}</td>
                      <td className="px-3 py-2 font-mono text-xs text-destructive">{a.src}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{a.dst}</td>
                      <td className="px-3 py-2 text-xs text-card-foreground">{a.type}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={riskColor(a.severity)}>{a.severity}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Firewall Rules */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldOff className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Firewall Rule Violations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Rule", "Status", "Hit Count"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firewallRules.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{r.rule}</td>
                    <td className="px-4 py-3">
                      {r.status === "Violated"
                        ? <div className="flex items-center gap-1.5"><ShieldOff className="h-3 w-3 text-destructive" /><span className="text-xs text-destructive font-semibold">Violated</span></div>
                        : <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-success" /><span className="text-xs text-success">Active</span></div>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.hits.toLocaleString()}</td>
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
