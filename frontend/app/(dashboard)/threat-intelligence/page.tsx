"use client"

import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const cisaKev = [
  { cve: "CVE-2026-21001", product: "OpenSSL", dateAdded: "2026-03-02", dueDate: "2026-03-16" },
  { cve: "CVE-2026-18823", product: "Apache Log4j", dateAdded: "2026-03-01", dueDate: "2026-03-15" },
  { cve: "CVE-2026-08112", product: "containerd", dateAdded: "2026-02-28", dueDate: "2026-03-14" },
  { cve: "CVE-2026-06221", product: "Redis", dateAdded: "2026-02-27", dueDate: "2026-03-13" },
]

const mitreTrending = [
  { technique: "T1190", name: "Exploit Public-Facing Application", trend: "up", count: 342 },
  { technique: "T1059", name: "Command and Scripting Interpreter", trend: "up", count: 287 },
  { technique: "T1068", name: "Exploitation for Privilege Escalation", trend: "up", count: 198 },
  { technique: "T1611", name: "Escape to Host", trend: "up", count: 156 },
  { technique: "T1078", name: "Valid Accounts", trend: "stable", count: 134 },
  { technique: "T1499", name: "Endpoint Denial of Service", trend: "down", count: 89 },
]

const topExploited = [
  { cve: "CVE-2026-21001", exploitCount: 1247, change: "+18%" },
  { cve: "CVE-2026-18823", exploitCount: 983, change: "+12%" },
  { cve: "CVE-2026-08112", exploitCount: 756, change: "+31%" },
  { cve: "CVE-2026-15447", exploitCount: 621, change: "+8%" },
  { cve: "CVE-2026-06221", exploitCount: 445, change: "-3%" },
]

const risingPatterns = [
  { pattern: "Supply Chain Injection via Package Registries", severity: "Critical", trend: "up" },
  { pattern: "AI Model Poisoning in CI/CD Pipelines", severity: "High", trend: "up" },
  { pattern: "Container Escape via OCI Image Layers", severity: "Critical", trend: "up" },
  { pattern: "HTTP/2 Protocol Abuse (CONTINUATION Flood)", severity: "High", trend: "stable" },
]

const allThreats = [
  { cve: "CVE-2026-21001", product: "OpenSSL 3.1.4", cvss: 9.8, epss: 0.94, cisaKev: true, exploitInWild: true, severity: "Critical", published: "2026-02-28" },
  { cve: "CVE-2026-18823", product: "Apache Log4j 2.17.1", cvss: 8.8, epss: 0.87, cisaKev: true, exploitInWild: true, severity: "High", published: "2026-02-27" },
  { cve: "CVE-2026-08112", product: "containerd 1.7.2", cvss: 8.6, epss: 0.81, cisaKev: false, exploitInWild: true, severity: "Critical", published: "2026-02-19" },
  { cve: "CVE-2026-15447", product: "Linux Kernel 6.2.14", cvss: 7.8, epss: 0.72, cisaKev: false, exploitInWild: true, severity: "High", published: "2026-02-24" },
  { cve: "CVE-2026-06221", product: "Redis 7.0.11", cvss: 7.2, epss: 0.69, cisaKev: false, exploitInWild: true, severity: "High", published: "2026-02-15" },
  { cve: "CVE-2026-12990", product: "nginx 1.24.0", cvss: 7.5, epss: 0.65, cisaKev: false, exploitInWild: false, severity: "High", published: "2026-02-22" },
  { cve: "CVE-2026-09871", product: "PostgreSQL 15.3", cvss: 6.5, epss: 0.58, cisaKev: false, exploitInWild: false, severity: "Medium", published: "2026-02-10" },
]

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "up": return <ArrowUp className="h-3.5 w-3.5 text-destructive" />
    case "down": return <ArrowDown className="h-3.5 w-3.5 text-success" />
    default: return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function cvssColor(score: number) {
  if (score >= 9.0) return "text-destructive"
  if (score >= 7.0) return "text-warning"
  return "text-chart-1"
}

export default function ThreatIntelligencePage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Threat Intelligence" />
      <div className="flex flex-col gap-6 p-6">

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{allThreats.filter(t => t.severity === "Critical").length}</div>
              <div className="text-xs text-muted-foreground mt-1">Critical CVEs Active</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">{allThreats.filter(t => t.exploitInWild).length}</div>
              <div className="text-xs text-muted-foreground mt-1">Exploited in Wild</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{allThreats.filter(t => t.cisaKev).length}</div>
              <div className="text-xs text-muted-foreground mt-1">CISA KEV Entries</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{allThreats.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Feed Entries</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* CISA KEV */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent CISA KEV Additions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {cisaKev.map((item) => (
                <Link key={item.cve} href={`/threat-intelligence/${encodeURIComponent(item.cve)}`}>
                  <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-semibold text-card-foreground">{item.cve}</span>
                      <span className="text-[11px] text-muted-foreground">{item.product}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] text-muted-foreground">Added: {item.dateAdded}</span>
                      <span className="text-[10px] text-destructive">Due: {item.dueDate}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Trending MITRE Techniques */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Trending MITRE Techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {mitreTrending.map((item) => (
                <div key={item.technique} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3">
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={item.trend} />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-semibold text-primary">{item.technique}</span>
                      <span className="text-[11px] text-muted-foreground">{item.name}</span>
                    </div>
                  </div>
                  <div className="flex h-6 items-center">
                    <div className="h-1.5 rounded-full bg-primary/20" style={{ width: `${(item.count / 342) * 80}px` }}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / 342) * 100}%` }} />
                    </div>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{item.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Exploited CVEs */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Exploited CVEs This Week
                </CardTitle>
                <Button size="sm" variant="outline" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground gap-1.5"
                  onClick={() => { toast.loading("Refreshing exploit feed...", { duration: 1500 }); setTimeout(() => toast.success("Exploit data updated"), 1600) }}>
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {topExploited.map((item, i) => (
                <Link key={item.cve} href={`/threat-intelligence/${encodeURIComponent(item.cve)}`}>
                  <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3 hover:bg-secondary transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card font-mono text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="font-mono text-xs font-semibold text-primary">{item.cve}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-20 rounded-full bg-destructive/20">
                        <div className="h-full rounded-full bg-destructive" style={{ width: `${(item.exploitCount / 1247) * 100}%` }} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{item.exploitCount.toLocaleString()}</span>
                      <span className={`text-xs font-medium ${item.change.startsWith('+') ? 'text-destructive' : 'text-success'}`}>
                        {item.change}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Rising Exploit Patterns */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Rising Exploit Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {risingPatterns.map((item) => (
                <div key={item.pattern} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3">
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={item.trend} />
                    <span className="text-xs text-card-foreground">{item.pattern}</span>
                  </div>
                  <Badge variant="outline" className={item.severity === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>
                    {item.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Full CVE Feed */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Full Intelligence Feed</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVE</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVSS</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">EPSS</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">KEV</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wild</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {allThreats.map((t) => (
                  <tr key={t.cve} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{t.cve}</td>
                    <td className="px-4 py-3 text-xs text-card-foreground">{t.product}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={t.severity === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20" : t.severity === "High" ? "bg-warning/10 text-warning border-warning/20" : "bg-chart-1/10 text-chart-1 border-chart-1/20"}>
                        {t.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><span className={`font-mono text-sm font-bold ${cvssColor(t.cvss)}`}>{t.cvss}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{(t.epss * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      {t.cisaKev ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">KEV</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.exploitInWild ? <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Yes</Badge> : <span className="text-xs text-muted-foreground">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/threat-intelligence/${encodeURIComponent(t.cve)}`}>
                        <Button variant="outline" size="sm" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">Detail</Button>
                      </Link>
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
