import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertOctagon, Bug, Shield, Target, Clock, Globe } from "lucide-react"

const vuln = {
  id: "ZD-2026-019",
  cve: "CVE-2026-21001",
  title: "Remote Code Execution in nginx 1.24.0 — Header Parsing OOB Write",
  cvss: 9.8,
  epss: "97%",
  kev: true,
  component: "nginx 1.24.0",
  affectedVersions: "nginx < 1.25.4",
  patchAvailable: false,
  discovered: "2026-02-18",
  publiclyKnown: "2026-02-20",
  internallyDetected: "2026-02-21 08:14 UTC",
  exploitInWild: true,
  exploitMaturity: "Weaponized",
  affectedAssets: ["prod-web-01.internal", "prod-web-02.internal", "staging-web.internal"],
  attackVector: "Network",
  attackComplexity: "Low",
  privilegesRequired: "None",
  userInteraction: "None",
  scope: "Changed",
  confidentiality: "High",
  integrity: "High",
  availability: "High",
}

const timeline = [
  { date: "2026-02-18", event: "Vulnerability discovered by security researcher (Pwn2Own)", type: "discovery" },
  { date: "2026-02-20", event: "PoC published on GitHub — public exploit code available", type: "alert" },
  { date: "2026-02-21", event: "Sentinel AI matched CVE to nginx 1.24.0 across asset inventory", type: "intel" },
  { date: "2026-02-21", event: "Added to CISA KEV catalog — exploitation confirmed in wild", type: "alert" },
  { date: "2026-02-22", event: "Web Application Firewall rule deployed to block exploit pattern", type: "action" },
  { date: "2026-02-25", event: "Vendor advisory issued — no patch ETA, mitigation config published", type: "info" },
  { date: "2026-03-01", event: "Virtual patch applied via ModSecurity rule on all nginx instances", type: "action" },
]

const mitigations = [
  { action: "WAF rule deployed blocking malformed header patterns", status: "Done", date: "2026-02-22" },
  { action: "ModSecurity virtual patch applied (nginx upstream rule)", status: "Done", date: "2026-03-01" },
  { action: "Network-level rate limiting on HTTP/S to reduce blast radius", status: "Done", date: "2026-02-23" },
  { action: "Upgrade to nginx 1.25.4 when patch released", status: "Pending", date: "—" },
  { action: "Isolate staging-web.internal from public-facing network", status: "In Progress", date: "2026-03-05" },
]

const typeColor = (t: string) => {
  if (t === "alert") return "text-destructive"
  if (t === "intel") return "text-warning"
  if (t === "action") return "text-success"
  if (t === "discovery") return "text-primary"
  return "text-muted-foreground"
}

const statusBadge = (s: string) =>
  s === "Done" ? "bg-success/10 text-success border-success/20"
  : s === "Pending" ? "bg-muted text-muted-foreground border-border"
  : "bg-warning/10 text-warning border-warning/20"

export default function ZeroDayDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Zero-Day — ${vuln.cve}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertOctagon className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{vuln.title}</p>
                  <p className="font-mono text-xs text-primary mt-0.5">{vuln.cve}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-lg font-bold font-mono px-3">{vuln.cvss}</Badge>
                {vuln.kev && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">CISA KEV</Badge>}
                {vuln.exploitInWild && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Exploit in Wild</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-xs">
              {[
                ["Component", vuln.component],
                ["Affected Versions", vuln.affectedVersions],
                ["Exploit Maturity", vuln.exploitMaturity],
                ["EPSS", vuln.epss],
                ["Attack Vector", vuln.attackVector],
                ["Complexity", vuln.attackComplexity],
                ["Privileges Required", vuln.privilegesRequired],
                ["Patch Available", vuln.patchAvailable ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-muted-foreground mb-0.5">{k}</p>
                  <p className="font-mono text-card-foreground">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Affected Internal Assets</p>
              <div className="flex gap-2 flex-wrap">
                {vuln.affectedAssets.map(a => (
                  <Badge key={a} variant="outline" className="font-mono border-border text-muted-foreground">{a}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Timeline */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vulnerability Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-4">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-none mt-1 shrink-0 ${t.type === "alert" ? "bg-destructive" : t.type === "action" ? "bg-success" : t.type === "intel" ? "bg-warning" : "bg-primary"}`} />
                    {i < timeline.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="pb-3">
                    <p className={`text-xs font-semibold ${typeColor(t.type)}`}>{t.event}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{t.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mitigations */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mitigation Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Action", "Date", "Status"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mitigations.map((m, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-xs text-card-foreground">{m.action}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.date}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] ${statusBadge(m.status)}`}>{m.status}</Badge>
                      </td>
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
