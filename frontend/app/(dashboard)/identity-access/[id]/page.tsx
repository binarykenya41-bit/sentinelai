import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, ShieldAlert, Key, Clock, Globe, AlertTriangle } from "lucide-react"

const identity = {
  id: "USR-0042",
  username: "j.morrison",
  displayName: "James Morrison",
  email: "j.morrison@corp.internal",
  department: "Finance",
  title: "Senior Financial Analyst",
  status: "Active",
  mfaEnabled: false,
  riskScore: 87,
  riskLevel: "Critical",
  lastLogin: "2026-03-06 01:58 UTC",
  lastLoginIP: "185.220.101.34",
  lastLoginGeo: "Bucharest, RO",
  normalLoginGeo: "London, UK",
  privilegedAccess: ["erp.internal (Admin)", "finance-reports S3 (Read/Write)", "payroll-db (Read)"],
  groups: ["finance-users", "erp-admins", "vpn-users"],
}

const riskFactors = [
  { factor: "Login from anomalous IP (Tor exit node: 185.220.101.34)", score: 35, severity: "Critical" },
  { factor: "MFA not enrolled", score: 20, severity: "High" },
  { factor: "Admin access to ERP with no recent access review", score: 15, severity: "High" },
  { factor: "After-hours login (01:58 UTC — user normally 09:00–18:00)", score: 12, severity: "Medium" },
  { factor: "Password not rotated in 180+ days", score: 5, severity: "Medium" },
]

const recentLogins = [
  { time: "2026-03-06 01:58 UTC", ip: "185.220.101.34", geo: "Bucharest, RO", result: "Success", risk: "Critical" },
  { time: "2026-03-05 09:14 UTC", ip: "10.0.0.55", geo: "London, UK", result: "Success", risk: "Low" },
  { time: "2026-03-04 11:32 UTC", ip: "10.0.0.55", geo: "London, UK", result: "Success", risk: "Low" },
  { time: "2026-03-03 08:55 UTC", ip: "10.0.0.55", geo: "London, UK", result: "Success", risk: "Low" },
  { time: "2026-03-01 17:02 UTC", ip: "10.0.0.55", geo: "London, UK", result: "Success", risk: "Low" },
]

const accessedResources = [
  { resource: "erp.internal", action: "Admin panel access", time: "01:59 UTC", risk: "Critical" },
  { resource: "finance-reports S3", action: "ListObjects + GetObject (142 files)", time: "02:03 UTC", risk: "Critical" },
  { resource: "payroll-db", action: "SELECT — 2,400 rows fetched", time: "02:07 UTC", risk: "Critical" },
  { resource: "VPN gateway", action: "Session established", time: "01:58 UTC", risk: "Medium" },
]

const sevColor = (s: string) =>
  s === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20"
  : s === "High" ? "bg-warning/10 text-warning border-warning/20"
  : s === "Medium" ? "bg-primary/10 text-primary border-primary/20"
  : "bg-muted text-muted-foreground border-border"

const riskText = (s: string) =>
  s === "Critical" ? "text-destructive"
  : s === "High" ? "text-warning"
  : s === "Medium" ? "text-primary"
  : "text-muted-foreground"

export default function IdentityDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Identity — ${identity.username}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Identity header */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-card-foreground">{identity.displayName}</p>
                      <p className="text-xs text-muted-foreground">{identity.title} — {identity.department}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{identity.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">{identity.status}</Badge>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{identity.riskLevel} Risk</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">Groups</p>
                    <div className="flex flex-wrap gap-1">
                      {identity.groups.map(g => <Badge key={g} variant="outline" className="border-border text-muted-foreground text-[10px]">{g}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Privileged Access</p>
                    {identity.privilegedAccess.map(p => <p key={p} className="font-mono text-[11px] text-warning">{p}</p>)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Last Login</p>
                    <p className="font-mono text-destructive">{identity.lastLogin} — {identity.lastLoginIP} ({identity.lastLoginGeo})</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">MFA</p>
                    <p className="text-destructive font-semibold">{identity.mfaEnabled ? "Enabled" : "NOT ENROLLED"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5" /> Risk Score
              </div>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-bold font-mono text-destructive">{identity.riskScore}</p>
                <p className="text-muted-foreground text-sm mb-1">/ 100</p>
              </div>
              <div className="w-full bg-secondary h-2">
                <div className="bg-destructive h-2" style={{ width: `${identity.riskScore}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Risk score based on login anomalies, privilege level, MFA status, and access patterns.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Risk Factors */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Factors</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {riskFactors.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-3 border border-border p-3">
                  <p className="text-xs text-card-foreground">{r.factor}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-xs font-bold ${riskText(r.severity)}`}>+{r.score}</span>
                    <Badge variant="outline" className={`text-[10px] ${sevColor(r.severity)}`}>{r.severity}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Logins */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Login History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Time", "IP / Geo", "Result", "Risk"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLogins.map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{l.time}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-card-foreground">{l.ip}<br /><span className="text-muted-foreground">{l.geo}</span></td>
                      <td className="px-4 py-2.5 text-xs text-success">{l.result}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={`text-[10px] ${sevColor(l.risk)}`}>{l.risk}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Accessed Resources */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resources Accessed — Anomalous Session</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Resource", "Action", "Time", "Risk"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accessedResources.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{r.resource}</td>
                    <td className="px-4 py-3 text-xs text-card-foreground">{r.action}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.time}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${sevColor(r.risk)}`}>{r.risk}</Badge>
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
