import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Monitor, ShieldCheck, AlertTriangle } from "lucide-react"

const stats = [
  { label: "Endpoints Monitored", value: "1,284", color: "text-primary" },
  { label: "Agent Online", value: "1,201", color: "text-success" },
  { label: "Active Threats", value: "14", color: "text-destructive" },
  { label: "Quarantined Files", value: "38", color: "text-warning" },
]

const endpoints = [
  { host: "WORKSTATION-042", user: "j.smith", os: "Windows 11 22H2", agentVer: "5.2.1", lastSeen: "2 min ago", threats: 2, status: "Compromised" },
  { host: "LAPTOP-SEC-007", user: "a.chen", os: "macOS 14.3", agentVer: "5.2.1", lastSeen: "5 min ago", threats: 0, status: "Clean" },
  { host: "SERVER-PROD-01", user: "system", os: "Ubuntu 22.04", agentVer: "5.2.0", lastSeen: "1 min ago", threats: 1, status: "Threat Detected" },
  { host: "LAPTOP-DEV-019", user: "m.torres", os: "Windows 11 23H2", agentVer: "5.2.1", lastSeen: "12 min ago", threats: 0, status: "Clean" },
  { host: "WORKSTATION-099", user: "r.patel", os: "Windows 10 22H2", agentVer: "5.1.9", lastSeen: "3 min ago", threats: 0, status: "Outdated Agent" },
  { host: "SERVER-STAGING-04", user: "system", os: "RHEL 9.3", agentVer: "5.2.1", lastSeen: "1 min ago", threats: 0, status: "Clean" },
]

const edrAlerts = [
  { time: "02:08 UTC", host: "WORKSTATION-042", tactic: "Execution", technique: "T1059.001 - PowerShell", description: "Encoded PowerShell command executed via cmd.exe", severity: "Critical" },
  { time: "01:55 UTC", host: "WORKSTATION-042", tactic: "Persistence", technique: "T1547.001 - Registry Run Keys", description: "Startup registry key added to HKCU\\Run", severity: "High" },
  { time: "01:42 UTC", host: "SERVER-PROD-01", tactic: "Defense Evasion", technique: "T1070.004 - File Deletion", description: "Security log files deleted via cmd", severity: "High" },
  { time: "00:22 UTC", host: "WORKSTATION-099", tactic: "Discovery", technique: "T1087.002 - Domain Account Discovery", description: "net user /domain executed", severity: "Medium" },
  { time: "23:41 UTC", host: "LAPTOP-SEC-007", tactic: "Collection", technique: "T1560 - Archive Collected Data", description: "7zip archiving of documents folder", severity: "Medium" },
]

const complianceChecks = [
  { check: "Antivirus definitions up to date", pass: 1184, fail: 100 },
  { check: "Disk encryption enabled", pass: 1201, fail: 83 },
  { check: "Screen lock configured", pass: 1100, fail: 184 },
  { check: "Auto-update enabled", pass: 998, fail: 286 },
  { check: "EDR agent latest version", pass: 1080, fail: 204 },
]

const statusBadge = (s: string) => {
  if (s === "Clean") return "bg-success/10 text-success border-success/20"
  if (s === "Compromised") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "Threat Detected") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

const sevColor = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  return "bg-primary/10 text-primary border-primary/20"
}

export default function EndpointSecurityPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Endpoint Security (EDR)" />
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
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">EDR Alerts — ATT&CK Mapped</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Time", "Host", "Tactic", "Technique", "Description", "Severity"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {edrAlerts.map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.time}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{a.host}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.tactic}</td>
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{a.technique}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{a.description}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={sevColor(a.severity)}>{a.severity}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Endpoint Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Hostname", "User", "OS", "Threats", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((e, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-card-foreground">{e.host}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{e.user}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{e.os}</td>
                      <td className={`px-3 py-2 font-mono text-xs ${e.threats > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{e.threats}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={statusBadge(e.status)}>{e.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compliance Coverage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              {complianceChecks.map((c, i) => {
                const pct = Math.round((c.pass / (c.pass + c.fail)) * 100)
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-card-foreground">{c.check}</span>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span className="text-success">{c.pass.toLocaleString()} pass</span>
                      <span className="text-destructive">{c.fail} fail</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
