import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GitMerge, CheckCircle, XCircle, Clock } from "lucide-react"

const stats = [
  { label: "Pipelines Monitored", value: "18", color: "text-primary" },
  { label: "Security Gates Passed", value: "142", color: "text-success" },
  { label: "Blocked Builds", value: "11", color: "text-destructive" },
  { label: "Secrets in Code", value: "27", color: "text-warning" },
]

const pipelines = [
  { repo: "sentinelai/api", branch: "main", run: "#1482", sast: "Pass", deps: "Fail", secrets: "Fail", container: "Pass", policy: "Pass", overall: "Blocked", duration: "4m 12s", time: "2 min ago" },
  { repo: "sentinelai/frontend", branch: "main", run: "#934", sast: "Pass", deps: "Pass", secrets: "Pass", container: "Pass", policy: "Pass", overall: "Passed", duration: "2m 48s", time: "15 min ago" },
  { repo: "sentinelai/scanner", branch: "feature/trivy", run: "#287", sast: "Fail", deps: "Pass", secrets: "Pass", container: "Pass", policy: "Pass", overall: "Blocked", duration: "3m 05s", time: "22 min ago" },
  { repo: "sentinelai/infra", branch: "main", run: "#119", sast: "Pass", deps: "Pass", secrets: "Fail", container: "N/A", policy: "Pass", overall: "Blocked", duration: "1m 33s", time: "1 hour ago" },
  { repo: "sentinelai/api", branch: "sentinel/fix/CVE-2026-21001", run: "#1481", sast: "Pass", deps: "Pass", secrets: "Pass", container: "Pass", policy: "Pass", overall: "Passed", duration: "4m 01s", time: "2 hours ago" },
]

const sbomFindings = [
  { package: "log4j-core", version: "2.17.1", ecosystem: "Maven", cves: 2, license: "Apache-2.0", risk: "High" },
  { package: "lodash", version: "4.17.20", ecosystem: "npm", cves: 1, license: "MIT", risk: "Medium" },
  { package: "openssl", version: "3.1.4", ecosystem: "OS", cves: 1, license: "Apache-2.0", risk: "Critical" },
  { package: "requests", version: "2.28.0", ecosystem: "PyPI", cves: 0, license: "Apache-2.0", risk: "Low" },
  { package: "jackson-databind", version: "2.14.0", ecosystem: "Maven", cves: 3, license: "Apache-2.0", risk: "High" },
  { package: "pillow", version: "9.3.0", ecosystem: "PyPI", cves: 1, license: "HPND", risk: "Medium" },
]

const policyChecks = [
  { check: "No CRITICAL CVEs in production images", status: "Fail", impacted: 3 },
  { check: "All dependencies in approved license list", status: "Pass", impacted: 0 },
  { check: "No secrets committed to git", status: "Fail", impacted: 4 },
  { check: "SBOM generated for all builds", status: "Pass", impacted: 0 },
  { check: "Container base image is approved", status: "Pass", impacted: 0 },
  { check: "Signed commits only (GPG)", status: "Fail", impacted: 7 },
  { check: "PR requires security review for auth changes", status: "Pass", impacted: 0 },
]

const gateResult = (r: string) => {
  if (r === "Pass") return <span className="flex items-center gap-1 text-success text-xs"><CheckCircle className="h-3 w-3" />Pass</span>
  if (r === "Fail") return <span className="flex items-center gap-1 text-destructive text-xs"><XCircle className="h-3 w-3" />Fail</span>
  return <span className="text-xs text-muted-foreground">N/A</span>
}

const overallBadge = (o: string) => o === "Passed"
  ? "bg-success/10 text-success border-success/20"
  : "bg-destructive/10 text-destructive border-destructive/20"

const riskBadge = (r: string) => {
  if (r === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (r === "High") return "bg-warning/10 text-warning border-warning/20"
  if (r === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-success/10 text-success border-success/20"
}

export default function DevSecOpsPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="DevSecOps Pipeline" />
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
              <GitMerge className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">CI/CD Security Gate Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Repo", "Branch", "Run", "SAST", "Deps", "Secrets", "Container", "Policy", "Overall", "Time"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-card-foreground">{p.repo}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.branch}</td>
                      <td className="px-3 py-2 font-mono text-xs text-primary">{p.run}</td>
                      <td className="px-3 py-2">{gateResult(p.sast)}</td>
                      <td className="px-3 py-2">{gateResult(p.deps)}</td>
                      <td className="px-3 py-2">{gateResult(p.secrets)}</td>
                      <td className="px-3 py-2">{gateResult(p.container)}</td>
                      <td className="px-3 py-2">{gateResult(p.policy)}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={overallBadge(p.overall)}>{p.overall}</Badge></td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{p.time}</td>
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
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">SBOM — Dependency Risk</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Package", "Version", "Ecosystem", "CVEs", "Risk"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sbomFindings.map((s, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-card-foreground">{s.package}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.version}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{s.ecosystem}</td>
                      <td className={`px-3 py-2 font-mono text-xs ${s.cves > 0 ? "text-destructive font-semibold" : "text-success"}`}>{s.cves}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={riskBadge(s.risk)}>{s.risk}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Security Policy Compliance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {policyChecks.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {p.status === "Pass"
                      ? <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    }
                    <span className="text-xs text-card-foreground">{p.check}</span>
                  </div>
                  {p.impacted > 0 && <span className="font-mono text-xs text-destructive">{p.impacted} affected</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
