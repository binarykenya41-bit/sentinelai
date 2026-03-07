import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, KeyRound, MessageSquareWarning, Database } from "lucide-react"

const stats = [
  { label: "Credential Leaks", value: "1,847", color: "text-destructive" },
  { label: "Domains Monitored", value: "12", color: "text-primary" },
  { label: "Threat Actor Mentions", value: "34", color: "text-warning" },
  { label: "Data Breaches (30d)", value: "3", color: "text-destructive" },
]

const credentialLeaks = [
  { email: "j.smith@sentinel.io", source: "Stealer log — Redline", date: "2026-03-01", password: "Hashed (bcrypt)", breach: "3rd-party SaaS breach", risk: "High", status: "Notified" },
  { email: "admin@sentinel.io", source: "Telegram dump — 'Corp Leaks'", date: "2026-02-18", password: "Plaintext exposed", breach: "Internal credential dump", risk: "Critical", status: "Reset Required" },
  { email: "svc-deploy@sentinel.io", source: "Paste site — PasteBin", date: "2026-02-05", password: "Hashed (MD5)", breach: "Forum credential stuffing", risk: "Critical", status: "Investigating" },
  { email: "a.chen@sentinel.io", source: "HaveIBeenPwned — Trello", date: "2026-01-14", password: "Not exposed", breach: "Trello public board exposure", risk: "Medium", status: "Resolved" },
  { email: "r.patel@sentinel.io", source: "Dark web market — BreachForums", date: "2025-12-20", password: "Hashed (SHA-1)", breach: "Retail breach combo list", risk: "Medium", status: "Notified" },
]

const threatActorMentions = [
  { actor: "LockBit 3.0", channel: "LockBit Telegram", mention: "sentinelai.io listed as potential target — planning phase", date: "2026-03-04", severity: "Critical" },
  { actor: "Unknown (TA-2026-07)", channel: "BreachForums", mention: "Selling alleged 'Sentinel AI internal docs' — 0.5 BTC", date: "2026-02-28", severity: "High" },
  { actor: "APT-28 adjacent", channel: "Dark web forum post", mention: "Recon activity observed against sentinel.io DNS records", date: "2026-02-20", severity: "High" },
  { actor: "Lapsus$ affiliate", channel: "Telegram group", mention: "Looking for insiders at Sentinel AI — offering payment", date: "2026-02-10", severity: "Critical" },
]

const exposedData = [
  { type: "Employee Emails", count: "284 records", source: "LinkedIn scrape + breach combo", date: "2026-03-01", risk: "Medium" },
  { type: "API Keys (expired)", count: "3 keys", source: "GitHub public repo commit", date: "2026-02-22", risk: "High" },
  { type: "Internal IP Ranges", count: "18 subnets", source: "Job posting + Shodan", date: "2026-02-14", risk: "Medium" },
  { type: "Tech Stack Details", count: "Full stack", source: "Error pages + JS source maps", date: "2026-01-30", risk: "Low" },
]

const riskBadge = (r: string) => {
  if (r === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (r === "High") return "bg-warning/10 text-warning border-warning/20"
  if (r === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusBadge = (s: string) => {
  if (s === "Reset Required" || s === "Investigating") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "Notified") return "bg-warning/10 text-warning border-warning/20"
  return "bg-success/10 text-success border-success/20"
}

export default function DarkWebPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Dark Web Monitor" />
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
              <KeyRound className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Credential Leaks Detected</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Email", "Source", "Date", "Password", "Breach", "Risk", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {credentialLeaks.map((l, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{l.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.source}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.date}</td>
                    <td className={`px-4 py-3 text-xs ${l.password === "Plaintext exposed" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{l.password}</td>
                    <td className="px-4 py-3 text-xs text-card-foreground">{l.breach}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={riskBadge(l.risk)}>{l.risk}</Badge></td>
                    <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(l.status)}>{l.status}</Badge></td>
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
                <MessageSquareWarning className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Threat Actor Mentions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {threatActorMentions.map((m, i) => (
                <div key={i} className="rounded-md border border-border bg-background p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-card-foreground">{m.actor}</span>
                    <Badge variant="outline" className={riskBadge(m.severity)}>{m.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.mention}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{m.channel}</span>
                    <span>{m.date}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exposed Data Footprint</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Data Type", "Volume", "Source", "Date", "Risk"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exposedData.map((d, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 text-xs text-card-foreground">{d.type}</td>
                      <td className="px-3 py-2 font-mono text-xs text-warning">{d.count}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{d.source}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{d.date}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={riskBadge(d.risk)}>{d.risk}</Badge></td>
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
