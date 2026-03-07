import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Key, ShieldAlert, UserX } from "lucide-react"

const stats = [
  { label: "Total Identities", value: "847", color: "text-primary" },
  { label: "Privileged Accounts", value: "38", color: "text-warning" },
  { label: "MFA Not Enrolled", value: "114", color: "text-destructive" },
  { label: "Stale Accounts (90d+)", value: "67", color: "text-warning" },
]

const users = [
  { user: "svc-deploy@sentinel.io", type: "Service Account", role: "Admin", mfa: false, lastLogin: "Never", riskScore: 94, flags: ["No MFA", "Wildcard policy", "Unused"] },
  { user: "j.smith@sentinel.io", type: "User", role: "Engineer", mfa: true, lastLogin: "2 hours ago", riskScore: 22, flags: [] },
  { user: "root@prod-db-01", type: "Local", role: "Root", mfa: false, lastLogin: "3 days ago", riskScore: 88, flags: ["Root login", "No MFA"] },
  { user: "a.chen@sentinel.io", type: "User", role: "Analyst", mfa: true, lastLogin: "1 hour ago", riskScore: 10, flags: [] },
  { user: "svc-scanner@sentinel.io", type: "Service Account", role: "Engineer", mfa: false, lastLogin: "5 min ago", riskScore: 41, flags: ["No MFA"] },
  { user: "backup-operator", type: "Local", role: "Admin", mfa: false, lastLogin: "98 days ago", riskScore: 76, flags: ["Stale", "No MFA"] },
  { user: "m.torres@sentinel.io", type: "User", role: "Viewer", mfa: true, lastLogin: "30 min ago", riskScore: 8, flags: [] },
]

const privilegedPaths = [
  { src: "svc-deploy@sentinel.io", dst: "prod-db-primary", via: "IAM Role: rds-admin", hops: 1, risk: "Critical" },
  { src: "k8s-node-07 (kubelet)", dst: "kube-apiserver", via: "Node bootstrap token", hops: 1, risk: "High" },
  { src: "j.smith@sentinel.io", dst: "AWS S3 (all buckets)", via: "Dev group → wildcard policy", hops: 2, risk: "High" },
  { src: "svc-scanner@sentinel.io", dst: "prod-web-01 (root)", via: "SUID binary → sudo -l", hops: 3, risk: "Critical" },
]

const accessKeys = [
  { keyId: "AKIA4XXXXXXXXXXXX01", user: "svc-deploy", age: "312 days", lastUsed: "2 hours ago", status: "Active", risk: "Critical" },
  { keyId: "AKIA4XXXXXXXXXXXX02", user: "backup-operator", age: "98 days", lastUsed: "98 days ago", status: "Stale", risk: "High" },
  { keyId: "AKIA4XXXXXXXXXXXX03", user: "j.smith", age: "14 days", lastUsed: "1 hour ago", status: "Active", risk: "Low" },
  { keyId: "AKIA4XXXXXXXXXXXX04", user: "svc-scanner", age: "45 days", lastUsed: "5 min ago", status: "Active", risk: "Medium" },
]

const riskColor = (n: number) => n >= 70 ? "text-destructive" : n >= 40 ? "text-warning" : "text-success"
const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-success/10 text-success border-success/20"
}

export default function IdentityAccessPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Identity & Access Management" />
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
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Identity Risk Scores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Identity", "Type", "Role", "MFA", "Last Login", "Risk Score", "Flags"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{u.user}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.type}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.mfa
                        ? <span className="text-xs text-success font-semibold">Enrolled</span>
                        : <span className="text-xs text-destructive font-semibold">Missing</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-sm font-bold ${riskColor(u.riskScore)}`}>{u.riskScore}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.flags.map((f) => (
                          <Badge key={f} variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">{f}</Badge>
                        ))}
                      </div>
                    </td>
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
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Privilege Escalation Paths</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {privilegedPaths.map((p, i) => (
                <div key={i} className="rounded-md border border-border bg-background p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary">{p.src}</span>
                    <Badge variant="outline" className={sevBadge(p.risk)}>{p.risk}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">→ <span className="text-card-foreground">{p.dst}</span></div>
                  <div className="text-[10px] text-muted-foreground">via {p.via} ({p.hops} hop{p.hops > 1 ? "s" : ""})</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Long-lived Access Keys</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Key ID", "Owner", "Age", "Last Used", "Risk"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accessKeys.map((k, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{k.keyId}</td>
                      <td className="px-3 py-2 text-xs text-card-foreground">{k.user}</td>
                      <td className="px-3 py-2 font-mono text-xs text-warning">{k.age}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{k.lastUsed}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={sevBadge(k.risk)}>{k.risk}</Badge></td>
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
