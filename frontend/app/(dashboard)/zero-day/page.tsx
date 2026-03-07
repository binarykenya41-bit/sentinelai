import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, AlertTriangle, Eye } from "lucide-react"

const stats = [
  { label: "Tracked Zero-Days", value: "12", color: "text-destructive" },
  { label: "Unpatched (KEV)", value: "4", color: "text-destructive" },
  { label: "Under Investigation", value: "3", color: "text-warning" },
  { label: "Mitigated", value: "5", color: "text-success" },
]

const zeroDays = [
  { id: "ZD-2026-001", nickname: "NullRoute", component: "OpenSSL 3.1.x TLS 1.3", type: "RCE", cvss: 9.8, epss: 0.97, kev: true, discovered: "2026-03-01", vendor: "OpenSSL", patch: "Unavailable", status: "Unpatched", exploitPublic: true },
  { id: "ZD-2026-002", nickname: "KernelShift", component: "Linux kernel 6.x netfilter", type: "LPE", cvss: 8.8, epss: 0.89, kev: true, discovered: "2026-02-22", vendor: "Linux", patch: "In Development", status: "Partial Mitigation", exploitPublic: false },
  { id: "ZD-2026-003", nickname: "CloudBleed-2", component: "nginx 1.24 HTTP/3", type: "Memory Leak", cvss: 7.5, epss: 0.72, kev: false, discovered: "2026-02-14", vendor: "nginx", patch: "Patch Pending", status: "Under Investigation", exploitPublic: false },
  { id: "ZD-2026-004", nickname: "ContainerBreak", component: "containerd 1.7.x runc", type: "Container Escape", cvss: 9.1, epss: 0.94, kev: true, discovered: "2026-02-08", vendor: "CNCF", patch: "Available", status: "Mitigated", exploitPublic: true },
  { id: "ZD-2026-005", nickname: "TokenForge", component: "Kubernetes kube-apiserver", type: "Auth Bypass", cvss: 9.6, epss: 0.96, kev: true, discovered: "2026-01-30", vendor: "CNCF/K8s", patch: "Available", status: "Patched", exploitPublic: false },
  { id: "ZD-2026-006", nickname: "SQLStorm", component: "PostgreSQL 15 jsonb", type: "SQLi", cvss: 8.1, epss: 0.81, kev: false, discovered: "2026-01-18", vendor: "PostgreSQL", patch: "In Development", status: "Under Investigation", exploitPublic: false },
]

const behaviorSignals = [
  { signal: "Anomalous system call sequence on prod-web-01 matching NullRoute PoC pattern", confidence: 87, asset: "prod-web-01", detected: "02:14 UTC", action: "Isolated" },
  { signal: "netfilter table modification outside maintenance window on k8s-node-03", confidence: 72, asset: "k8s-node-03", detected: "00:38 UTC", action: "Monitoring" },
  { signal: "containerd runtime unexpected namespace escape attempt", confidence: 91, asset: "k8s-node-07", detected: "23:55 UTC", action: "Blocked" },
]

const exploitIntelligence = [
  { cve: "ZD-2026-001 (NullRoute)", source: "Exploit-DB #51204", type: "Full PoC", availability: "Public", reliability: "Confirmed" },
  { cve: "ZD-2026-004 (ContainerBreak)", source: "GitHub nuclei template", type: "Detection Script", availability: "Public", reliability: "Confirmed" },
  { cve: "ZD-2026-002 (KernelShift)", source: "Private market (Zerodium)", type: "Full Exploit", availability: "Restricted", reliability: "Reported" },
]

const statusBadge = (s: string) => {
  if (s === "Unpatched") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "Partial Mitigation" || s === "Under Investigation") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Mitigated") return "bg-primary/10 text-primary border-primary/20"
  return "bg-success/10 text-success border-success/20"
}

export default function ZeroDayPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Zero-Day Tracker" />
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

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tracked Zero-Day Vulnerabilities</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Nickname", "Component", "Type", "CVSS", "EPSS", "KEV", "Exploit Public", "Patch", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zeroDays.map((z) => (
                    <tr key={z.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-primary">{z.id}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-card-foreground">{z.nickname}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{z.component}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{z.type}</td>
                      <td className={`px-3 py-2 font-mono text-xs font-bold ${z.cvss >= 9 ? "text-destructive" : "text-warning"}`}>{z.cvss}</td>
                      <td className={`px-3 py-2 font-mono text-xs ${z.epss >= 0.9 ? "text-destructive" : "text-warning"}`}>{(z.epss * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2">{z.kev ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">KEV</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2">{z.exploitPublic ? <span className="text-xs text-destructive font-semibold">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{z.patch}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={statusBadge(z.status)}>{z.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Behavior-Based Detection Signals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {behaviorSignals.map((s, i) => (
                <div key={i} className="rounded-md border border-border bg-background p-3 flex flex-col gap-2">
                  <p className="text-xs text-card-foreground leading-snug">{s.signal}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Asset: <span className="text-primary font-mono">{s.asset}</span></span>
                    <span>Confidence: <span className={`font-bold ${s.confidence >= 85 ? "text-destructive" : "text-warning"}`}>{s.confidence}%</span></span>
                    <span>{s.detected}</span>
                    <Badge variant="outline" className={s.action === "Isolated" || s.action === "Blocked" ? "bg-success/10 text-success border-success/20 text-[10px]" : "bg-warning/10 text-warning border-warning/20 text-[10px]"}>{s.action}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exploit Intelligence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Vulnerability", "Source", "Type", "Availability", "Reliability"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exploitIntelligence.map((e, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-primary">{e.cve}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{e.source}</td>
                      <td className="px-3 py-2 text-xs text-card-foreground">{e.type}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={e.availability === "Public" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>{e.availability}</Badge></td>
                      <td className="px-3 py-2"><Badge variant="outline" className={e.reliability === "Confirmed" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>{e.reliability}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
