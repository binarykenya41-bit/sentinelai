"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Code, GitBranch, AlertCircle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { codeScanningApi, type CodeFinding, type CodeScanningStats } from "@/lib/api-client"

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusBadge = (s: string) => {
  if (s === "Open") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "In Progress") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Resolved") return "bg-success/10 text-success border-success/20"
  return "bg-muted text-muted-foreground border-border"
}

const scoreColor = (score: number) => {
  if (score >= 90) return "text-success"
  if (score >= 70) return "text-warning"
  return "text-destructive"
}

export default function CodeScanningPage() {
  const { data: findingsData, loading } = useApi(() => codeScanningApi.list({ limit: 100 }))
  const { data: stats } = useApi<CodeScanningStats>(() => codeScanningApi.stats())

  const findings = findingsData?.findings ?? []
  const repoScores = stats?.repo_scores ?? []

  return (
    <div className="flex flex-col">
      <AppHeader title="Code Scanning (SAST/DAST)" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Findings", value: stats?.total ?? 0, color: "text-primary" },
            { label: "Open", value: stats?.open ?? 0, color: "text-destructive" },
            { label: "Critical", value: stats?.critical ?? 0, color: "text-destructive" },
            { label: "Resolved", value: stats?.resolved ?? 0, color: "text-success" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Repo Scores */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Repo Security Scores</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {repoScores.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data.</p>
              ) : repoScores.map(r => (
                <div key={r.repo} className="flex items-center justify-between">
                  <span className="text-xs text-card-foreground font-mono">{r.repo.split("/").pop()}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={r.score} className="w-20 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className={`font-mono text-xs font-bold w-8 ${scoreColor(r.score)}`}>{r.score}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Tool */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By Tool</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {Object.entries(stats?.by_tool ?? {}).map(([tool, count]) => (
                <div key={tool} className="flex items-center justify-between">
                  <span className="text-xs font-mono text-card-foreground capitalize">{tool}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={stats?.total ? (count / stats.total) * 100 : 0} className="w-16 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className="font-mono text-xs text-muted-foreground w-4">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Category */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By Category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {Object.entries(stats?.by_category ?? {}).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-card-foreground">{cat}</span>
                  <span className="font-mono text-xs text-muted-foreground">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Findings Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                All Findings ({findings.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading findings…</div>
            ) : findings.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No findings.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Repo", "Tool", "Title", "Severity", "Category", "File", "Status", "Detected"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f: CodeFinding) => (
                      <tr key={f.finding_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{f.repo.split("/").pop()}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.tool}</td>
                        <td className="px-4 py-3 text-xs text-card-foreground max-w-xs">{f.title}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={sevBadge(f.severity)}>{f.severity}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{f.category ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground max-w-[140px] truncate">
                          {f.file_path ? `${f.file_path}${f.line_number ? `:${f.line_number}` : ""}` : "—"}
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(f.status)}>{f.status}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{new Date(f.detected_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
