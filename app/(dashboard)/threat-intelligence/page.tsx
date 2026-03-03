import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

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

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "up": return <ArrowUp className="h-3.5 w-3.5 text-destructive" />
    case "down": return <ArrowDown className="h-3.5 w-3.5 text-success" />
    default: return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export default function ThreatIntelligencePage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Threat Intelligence" />
      <div className="flex flex-col gap-6 p-6">
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
                <div key={item.cve} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs font-semibold text-card-foreground">{item.cve}</span>
                    <span className="text-[11px] text-muted-foreground">{item.product}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Added: {item.dateAdded}</span>
                    <span className="text-[10px] text-destructive">Due: {item.dueDate}</span>
                  </div>
                </div>
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
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Top Exploited CVEs This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {topExploited.map((item, i) => (
                <div key={item.cve} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card font-mono text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="font-mono text-xs font-semibold text-card-foreground">{item.cve}</span>
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
      </div>
    </div>
  )
}
