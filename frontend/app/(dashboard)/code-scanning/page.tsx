import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Code, GitBranch, AlertCircle } from "lucide-react"

const stats = [
  { label: "Repos Scanned", value: "42", color: "text-primary" },
  { label: "SAST Findings", value: "318", color: "text-warning" },
  { label: "Secrets Found", value: "27", color: "text-destructive" },
  { label: "DAST Issues", value: "84", color: "text-warning" },
]

const sastFindings = [
  { id: "SAST-001", repo: "sentinelai/api", file: "src/auth/login.ts:87", rule: "SQL Injection", cwe: "CWE-89", severity: "Critical", status: "Open" },
  { id: "SAST-002", repo: "sentinelai/api", file: "src/upload/handler.ts:142", rule: "Path Traversal", cwe: "CWE-22", severity: "High", status: "Open" },
  { id: "SAST-003", repo: "sentinelai/frontend", file: "components/editor.tsx:56", rule: "XSS via dangerouslySetInnerHTML", cwe: "CWE-79", severity: "High", status: "In Progress" },
  { id: "SAST-004", repo: "sentinelai/scanner", file: "lib/exec.py:33", rule: "OS Command Injection", cwe: "CWE-78", severity: "Critical", status: "Open" },
  { id: "SAST-005", repo: "sentinelai/api", file: "src/crypto/utils.ts:21", rule: "Weak Hash (MD5)", cwe: "CWE-327", severity: "Medium", status: "In Progress" },
  { id: "SAST-006", repo: "sentinelai/infra", file: "terraform/rds.tf:14", rule: "DB password in plaintext", cwe: "CWE-798", severity: "Critical", status: "Open" },
  { id: "SAST-007", repo: "sentinelai/api", file: "src/jwt/verify.ts:8", rule: "JWT None Algorithm", cwe: "CWE-347", severity: "Critical", status: "Patched" },
]

const secretsFound = [
  { repo: "sentinelai/api", file: ".env.example:12", type: "AWS Access Key", commit: "a3f9d12", status: "Exposed" },
  { repo: "sentinelai/frontend", file: "src/config.ts:5", type: "Supabase Anon Key", commit: "b8c1e34", status: "Exposed" },
  { repo: "sentinelai/infra", file: "scripts/deploy.sh:38", type: "GitHub PAT", commit: "cc90f11", status: "Revoked" },
  { repo: "sentinelai/scanner", file: "tests/fixtures.py:7", type: "API Key (NVD)", commit: "d12a7e3", status: "Exposed" },
]

const dastFindings = [
  { endpoint: "POST /api/auth/login", issue: "No rate limiting", owasp: "A07:2021", severity: "High" },
  { endpoint: "GET /api/vulns?search=", issue: "Reflected XSS via query param", owasp: "A03:2021", severity: "High" },
  { endpoint: "PUT /api/users/:id", issue: "IDOR — can modify other users", owasp: "A01:2021", severity: "Critical" },
  { endpoint: "POST /api/upload", issue: "Unrestricted file upload", owasp: "A04:2021", severity: "High" },
  { endpoint: "GET /api/reports/:id", issue: "Missing auth check (BOLA)", owasp: "A01:2021", severity: "Critical" },
]

const repoScores = [
  { repo: "sentinelai/api", score: 54, issues: 124 },
  { repo: "sentinelai/frontend", score: 71, issues: 43 },
  { repo: "sentinelai/scanner", score: 62, issues: 87 },
  { repo: "sentinelai/infra", score: 48, issues: 64 },
]

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const scoreColor = (n: number) => n >= 70 ? "text-success" : n >= 55 ? "text-warning" : "text-destructive"

export default function CodeScanningPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Code Scanning (SAST / DAST)" />
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

        <div className="grid grid-cols-4 gap-3">
          {repoScores.map((r) => (
            <Card key={r.repo} className="border-border bg-card">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-xs text-card-foreground">{r.repo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${scoreColor(r.score)}`}>{r.score}</span>
                  <span className="text-xs text-muted-foreground">{r.issues} issues</span>
                </div>
                <Progress value={r.score} className="h-1.5 bg-secondary [&>div]:bg-primary" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">SAST Findings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "File", "Rule", "CWE", "Severity", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sastFindings.map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-primary">{f.id}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{f.file}</td>
                      <td className="px-3 py-2 text-xs text-card-foreground">{f.rule}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.cwe}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={sevBadge(f.severity)}>{f.severity}</Badge></td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={f.status === "Open" ? "bg-destructive/10 text-destructive border-destructive/20" : f.status === "Patched" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>{f.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Secrets Detected</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Repo", "File", "Type", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {secretsFound.map((s, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.repo}</td>
                        <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{s.file}</td>
                        <td className="px-3 py-2 text-xs text-card-foreground">{s.type}</td>
                        <td className="px-3 py-2"><Badge variant="outline" className={s.status === "Exposed" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"}>{s.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">DAST Findings (OWASP Top 10)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Endpoint", "Issue", "OWASP", "Severity"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dastFindings.map((d, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-3 py-2 font-mono text-xs text-primary">{d.endpoint}</td>
                        <td className="px-3 py-2 text-xs text-card-foreground">{d.issue}</td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{d.owasp}</td>
                        <td className="px-3 py-2"><Badge variant="outline" className={sevBadge(d.severity)}>{d.severity}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
