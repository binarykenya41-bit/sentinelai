import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, GitBranch, AlertTriangle, Shield, Terminal, FileCode } from "lucide-react"

const finding = {
  id: "SAST-2026-0891",
  title: "SQL Injection — Unsanitized User Input in Query Builder",
  type: "SAST",
  severity: "Critical",
  cvss: 9.1,
  cwe: "CWE-89",
  owasp: "A03:2021 — Injection",
  status: "Open",
  repo: "sentinelai/backend-api",
  branch: "main",
  file: "src/api/reports/query.py",
  line: 142,
  author: "d.kumar",
  committed: "2026-02-14 16:32 UTC",
  detectedAt: "2026-03-06 01:00 UTC",
  scanner: "Semgrep (python.django.security.injection.sql)",
}

const codeSnippet = `# Line 138 — src/api/reports/query.py
def get_report_data(report_id: str, filter_param: str):
    conn = get_db_connection()
    # VULNERABLE: filter_param is user-controlled, not parameterized
    query = f"SELECT * FROM reports WHERE id = '{report_id}' AND filter = '{filter_param}'"
    cursor = conn.execute(query)
    return cursor.fetchall()`

const fixSnippet = `# Recommended fix — use parameterized queries
def get_report_data(report_id: str, filter_param: str):
    conn = get_db_connection()
    query = "SELECT * FROM reports WHERE id = ? AND filter = ?"
    cursor = conn.execute(query, (report_id, filter_param))
    return cursor.fetchall()`

const dataFlow = [
  { step: "Source", detail: "HTTP GET /api/reports?filter=<user_input>", type: "source" },
  { step: "Propagation", detail: "filter_param passed directly to query builder without sanitization", type: "flow" },
  { step: "Sink", detail: "conn.execute(query) — raw SQL executed with user input interpolated", type: "sink" },
]

const relatedFindings = [
  { id: "SAST-2026-0892", title: "Same pattern in src/api/audit/query.py:88", severity: "Critical" },
  { id: "SAST-2026-0893", title: "Reflected XSS in src/api/reports/render.py:201", severity: "High" },
  { id: "SAST-2026-0855", title: "Hardcoded API key in src/config/settings.py:14", severity: "High" },
]

const sevColor = (s: string) =>
  s === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20"
  : s === "High" ? "bg-warning/10 text-warning border-warning/20"
  : "bg-primary/10 text-primary border-primary/20"

const flowColor = (t: string) =>
  t === "source" ? "text-warning" : t === "sink" ? "text-destructive" : "text-muted-foreground"

export default function CodeScanDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Finding — ${finding.id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{finding.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{finding.owasp} · {finding.cwe}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono font-bold">CVSS {finding.cvss}</Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{finding.severity}</Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{finding.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-xs">
              {[
                ["Repo", finding.repo],
                ["Branch", finding.branch],
                ["File", `${finding.file}:${finding.line}`],
                ["Author", finding.author],
                ["Type", finding.type],
                ["Scanner", finding.scanner],
                ["Detected", finding.detectedAt],
                ["Committed", finding.committed],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-muted-foreground mb-0.5">{k}</p>
                  <p className="font-mono text-[11px] text-card-foreground">{v}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Vulnerable code */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vulnerable Code</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <pre className="bg-secondary p-4 text-[11px] font-mono text-destructive overflow-x-auto whitespace-pre-wrap leading-relaxed">{codeSnippet}</pre>
            </CardContent>
          </Card>

          {/* Recommended fix */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recommended Fix</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <pre className="bg-secondary p-4 text-[11px] font-mono text-success overflow-x-auto whitespace-pre-wrap leading-relaxed">{fixSnippet}</pre>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Data Flow */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Data Flow Trace</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-4">
              {dataFlow.map((d, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-none mt-1 shrink-0 ${d.type === "source" ? "bg-warning" : d.type === "sink" ? "bg-destructive" : "bg-primary"}`} />
                    {i < dataFlow.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="pb-3">
                    <p className={`text-xs font-bold ${flowColor(d.type)}`}>{d.step}</p>
                    <p className="text-xs text-muted-foreground">{d.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Related Findings */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Related Findings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {relatedFindings.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-3 border border-border p-3">
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground mb-0.5">{f.id}</p>
                    <p className="text-xs text-card-foreground">{f.title}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${sevColor(f.severity)}`}>{f.severity}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
