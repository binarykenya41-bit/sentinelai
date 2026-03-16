"use client"

import { use, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, Code, GitBranch, AlertTriangle, Shield, Terminal,
  FileCode, Loader2, XCircle, ExternalLink, Copy, RefreshCw
} from "lucide-react"
import { codeScanningApi, type CodeFinding } from "@/lib/api-client"
import { toast } from "sonner"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sevColor = (s: string) => {
  const l = s.toLowerCase()
  if (l === "critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (l === "high")     return "bg-warning/10 text-warning border-warning/20"
  if (l === "medium")   return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusColor = (s: string) => {
  const l = s.toLowerCase()
  if (l === "open")                             return "bg-destructive/10 text-destructive border-destructive/20"
  if (l === "in_progress" || l === "in progress") return "bg-warning/10 text-warning border-warning/20"
  if (l === "resolved" || l === "fixed")        return "bg-success/10 text-success border-success/20"
  return "bg-muted text-muted-foreground border-border"
}

// ─── Code snippet generators based on category / tool ────────────────────────

function buildVulnSnippet(f: CodeFinding): string {
  const cat = (f.category ?? "").toLowerCase()
  const file = f.file_path ?? "src/unknown.py"
  const line = f.line_number ?? 1

  if (cat.includes("injection") || cat.includes("sql")) {
    return `# ${file}:${line}
# VULNERABLE — unsanitized user input interpolated into SQL
def get_data(user_input: str):
    db = get_connection()
    query = f"SELECT * FROM records WHERE id = '{user_input}'"
    return db.execute(query).fetchall()`
  }
  if (cat.includes("xss") || cat.includes("cross-site")) {
    return `// ${file}:${line}
// VULNERABLE — user input reflected without escaping
app.get('/search', (req, res) => {
  const q = req.query.q
  res.send(\`<h1>Results for: \${q}</h1>\`)  // XSS
})`
  }
  if (cat.includes("secret") || cat.includes("hardcoded") || cat.includes("credential")) {
    return `# ${file}:${line}
# VULNERABLE — hardcoded secret in source code
DATABASE_URL = "postgresql://admin:P@ssw0rd123@prod-db:5432/app"
STRIPE_KEY   = "sk_live_AbCdEf1234567890"
AWS_SECRET   = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"`
  }
  if (cat.includes("path") || cat.includes("traversal")) {
    return `# ${file}:${line}
# VULNERABLE — path traversal via user-controlled filename
def read_file(filename: str):
    path = f"/var/app/uploads/{filename}"
    with open(path, 'r') as f:      # traversal: ../../etc/passwd
        return f.read()`
  }
  if (cat.includes("auth") || cat.includes("broken")) {
    return `// ${file}:${line}
// VULNERABLE — authentication check can be bypassed
function checkAuth(token) {
  const decoded = jwt.decode(token)   // NOT jwt.verify()
  if (decoded && decoded.role) {
    return true  // accepts forged tokens
  }
}`
  }
  if (cat.includes("deseri") || cat.includes("unsafe")) {
    return `# ${file}:${line}
# VULNERABLE — unsafe deserialization of user-controlled data
import pickle, base64
def load_session(data: str):
    raw = base64.b64decode(data)
    return pickle.loads(raw)  # RCE via crafted pickle`
  }
  // Generic fallback
  return `// ${file}:${line}
// VULNERABLE — ${f.title}
// Tool: ${f.tool}  Rule: ${f.rule_id ?? "N/A"}
// Status: ${f.status}  Detected: ${f.detected_at}`
}

function buildFixSnippet(f: CodeFinding): string {
  const cat = (f.category ?? "").toLowerCase()

  if (cat.includes("injection") || cat.includes("sql")) {
    return `# FIXED — parameterized query
def get_data(user_input: str):
    db = get_connection()
    query = "SELECT * FROM records WHERE id = ?"
    return db.execute(query, (user_input,)).fetchall()`
  }
  if (cat.includes("xss") || cat.includes("cross-site")) {
    return `// FIXED — escape output with trusted library
const escapeHtml = require('escape-html')
app.get('/search', (req, res) => {
  const q = escapeHtml(req.query.q)
  res.send(\`<h1>Results for: \${q}</h1>\`)
})`
  }
  if (cat.includes("secret") || cat.includes("hardcoded") || cat.includes("credential")) {
    return `# FIXED — load secrets from environment / vault
import os
DATABASE_URL = os.environ["DATABASE_URL"]
STRIPE_KEY   = os.environ["STRIPE_SECRET_KEY"]
AWS_SECRET   = os.environ["AWS_SECRET_ACCESS_KEY"]`
  }
  if (cat.includes("path") || cat.includes("traversal")) {
    return `# FIXED — validate and resolve path safely
import os
UPLOAD_DIR = "/var/app/uploads"
def read_file(filename: str):
    safe = os.path.realpath(os.path.join(UPLOAD_DIR, filename))
    if not safe.startswith(UPLOAD_DIR):
        raise ValueError("Path traversal blocked")
    with open(safe, 'r') as f:
        return f.read()`
  }
  if (cat.includes("auth") || cat.includes("broken")) {
    return `// FIXED — verify JWT signature
function checkAuth(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  if (decoded && decoded.role) {
    return true
  }
}`
  }
  if (cat.includes("deseri") || cat.includes("unsafe")) {
    return `# FIXED — use safe JSON deserialization
import json
def load_session(data: str):
    return json.loads(data)  # safe, no code execution`
  }
  return `// FIXED — apply ${f.tool} recommended remediation
// Rule: ${f.rule_id ?? "N/A"}
// Refer to: https://owasp.org/www-project-top-ten/`
}

function buildDataFlow(f: CodeFinding) {
  const cat = (f.category ?? "").toLowerCase()
  const file = f.file_path ?? "src/unknown"
  const line = f.line_number ?? 1

  if (cat.includes("injection") || cat.includes("sql")) {
    return [
      { step: "Source",      detail: `HTTP request parameter (user-controlled input at ${file}:${line})`, type: "source" },
      { step: "Propagation", detail: "Input passed to query builder without sanitization or parameterization", type: "flow" },
      { step: "Sink",        detail: "Raw SQL executed against database — data exfiltration / manipulation possible", type: "sink" },
    ]
  }
  if (cat.includes("secret") || cat.includes("hardcoded")) {
    return [
      { step: "Source",      detail: `Secret value hardcoded at ${file}:${line}`, type: "source" },
      { step: "Propagation", detail: "Committed to version control — accessible to all contributors and in git history", type: "flow" },
      { step: "Sink",        detail: "Secret exposed via public/internal repo access, potentially leaked in breach", type: "sink" },
    ]
  }
  return [
    { step: "Source",      detail: `Untrusted data enters at ${file}:${line}`, type: "source" },
    { step: "Propagation", detail: `Data flows through ${f.tool} rule ${f.rule_id ?? "N/A"} without validation`, type: "flow" },
    { step: "Sink",        detail: `Exploitable condition reached — see ${f.category ?? "finding"} category`, type: "sink" },
  ]
}

const flowColor = (t: string) =>
  t === "source" ? "text-warning" : t === "sink" ? "text-destructive" : "text-muted-foreground"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CodeScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [finding, setFinding] = useState<CodeFinding | null>(null)
  const [related, setRelated]   = useState<CodeFinding[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const f = await codeScanningApi.get(id)
      setFinding(f)
      // Fetch related findings from the same repo
      try {
        const rel = await codeScanningApi.list({ repo: f.repo, limit: 10 })
        setRelated((rel.findings ?? []).filter(r => r.finding_id !== f.finding_id).slice(0, 4))
      } catch {
        // Non-critical
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex flex-col">
      <AppHeader title="Code Scanning Detail" />
      <div className="flex flex-col items-center justify-center gap-3 p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading finding…</p>
      </div>
    </div>
  )

  if (error || !finding) return (
    <div className="flex flex-col">
      <AppHeader title="Code Scanning Detail" />
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <XCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? "Finding not found"}</p>
        <Link href="/code-scanning">
          <Button variant="outline" size="sm" className="border-border">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back
          </Button>
        </Link>
      </div>
    </div>
  )

  const dataFlow    = buildDataFlow(finding)
  const vulnSnippet = buildVulnSnippet(finding)
  const fixSnippet  = buildFixSnippet(finding)

  return (
    <div className="flex flex-col">
      <AppHeader title={`Finding — ${finding.rule_id ?? finding.finding_id.slice(0, 12)}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/code-scanning" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" />Code Scanning
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold text-card-foreground">{finding.rule_id ?? finding.finding_id.slice(0, 16)}</span>
        </div>

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{finding.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {finding.category ?? "—"} · Tool: {finding.tool}
                    {finding.rule_id && ` · Rule: ${finding.rule_id}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={sevColor(finding.severity)}>{finding.severity}</Badge>
                <Badge variant="outline" className={statusColor(finding.status)}>{finding.status}</Badge>
                <Button
                  variant="ghost" size="sm" className="h-7 px-2 text-xs"
                  onClick={() => { navigator.clipboard.writeText(finding.finding_id); toast.success("ID copied") }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={load}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
              {[
                ["Repo",      finding.repo],
                ["Branch",    finding.branch ?? "—"],
                ["File",      finding.file_path ? `${finding.file_path}${finding.line_number ? `:${finding.line_number}` : ""}` : "—"],
                ["PR",        finding.pr_url ?? "—"],
                ["Status",    finding.status],
                ["Detected",  new Date(finding.detected_at).toLocaleString()],
                ["Resolved",  finding.resolved_at ? new Date(finding.resolved_at).toLocaleString() : "—"],
                ["Finding ID", finding.finding_id.slice(0, 16) + "…"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-muted-foreground mb-0.5">{k}</p>
                  {k === "PR" && v !== "—" ? (
                    <a href={v} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-2.5 w-2.5" />View PR
                    </a>
                  ) : (
                    <p className="font-mono text-[11px] text-card-foreground break-all">{v}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Vulnerable code */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vulnerable Code</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <pre className="rounded-md bg-destructive/5 border border-destructive/20 p-4 text-[11px] font-mono text-destructive overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {vulnSnippet}
              </pre>
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
              <pre className="rounded-md bg-success/5 border border-success/20 p-4 text-[11px] font-mono text-success overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {fixSnippet}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Data flow trace */}
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
                    <div className={`h-2.5 w-2.5 rounded-sm mt-0.5 shrink-0 ${d.type === "source" ? "bg-warning" : d.type === "sink" ? "bg-destructive" : "bg-primary"}`} />
                    {i < dataFlow.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="pb-3">
                    <p className={`text-xs font-bold ${flowColor(d.type)}`}>{d.step}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{d.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Related findings */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Related Findings — {finding.repo.split("/").pop()}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {related.length === 0 ? (
                <p className="text-xs text-muted-foreground">No related findings in this repo.</p>
              ) : related.map(r => (
                <Link key={r.finding_id} href={`/code-scanning/${r.finding_id}`}>
                  <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground mb-0.5">
                        {r.rule_id ?? r.finding_id.slice(0, 12)}
                        {r.file_path && <span className="ml-2">{r.file_path.split("/").pop()}{r.line_number ? `:${r.line_number}` : ""}</span>}
                      </p>
                      <p className="text-xs text-card-foreground">{r.title}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${sevColor(r.severity)}`}>{r.severity}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Remediation actions */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remediation Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={async () => {
                try {
                  await codeScanningApi.update(finding.finding_id, { status: "in_progress" })
                  setFinding(prev => prev ? { ...prev, status: "in_progress" } : prev)
                  toast.success("Status updated to In Progress")
                } catch (e) { toast.error(String(e)) }
              }}
              disabled={finding.status === "in_progress" || finding.status === "resolved"}
            >
              Mark In Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-border"
              onClick={async () => {
                try {
                  await codeScanningApi.update(finding.finding_id, { status: "resolved" })
                  setFinding(prev => prev ? { ...prev, status: "resolved" } : prev)
                  toast.success("Finding marked as resolved")
                } catch (e) { toast.error(String(e)) }
              }}
              disabled={finding.status === "resolved"}
            >
              <Shield className="h-3 w-3 mr-1" />Mark Resolved
            </Button>
            {finding.pr_url && (
              <a href={finding.pr_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border">
                  <ExternalLink className="h-3 w-3" />View Fix PR
                </Button>
              </a>
            )}
            {finding.file_path && (
              <Link href={`/vulnerabilities?search=${encodeURIComponent(finding.repo)}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border">
                  <GitBranch className="h-3 w-3" />Find Related CVEs
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
