"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

const weeklyTrend = [
  { week: "Feb 03", score: 68, critical: 18, patched: 4 },
  { week: "Feb 10", score: 70, critical: 16, patched: 6 },
  { week: "Feb 17", score: 72, critical: 15, patched: 8 },
  { week: "Feb 24", score: 74, critical: 14, patched: 10 },
  { week: "Mar 03", score: 78, critical: 12, patched: 14 },
]

const velocityMetrics = [
  { label: "Mean Time to Detect (MTTD)", current: "3.8 min", previous: "6.2 min", trend: "down" },
  { label: "Mean Time to Patch (MTTP)", current: "8 min", previous: "12 min", trend: "down" },
  { label: "Mean Time to Merge (MTTM)", current: "2.4 hrs", previous: "4.1 hrs", trend: "down" },
  { label: "Mean Time to Verify (MTTV)", current: "12 min", previous: "18 min", trend: "down" },
  { label: "Patch Auto-Generation Rate", current: "94%", previous: "87%", trend: "up" },
  { label: "CI Pipeline Pass Rate", current: "91%", previous: "89%", trend: "up" },
]

const complianceTrend = [
  { framework: "ISO 27001", current: 82, previous: 78, trend: "up" },
  { framework: "SOC 2 Type II", current: 76, previous: 74, trend: "up" },
  { framework: "PCI-DSS v4.0", current: 69, previous: 65, trend: "up" },
]

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <ArrowUp className="h-3.5 w-3.5 text-success" />
  if (trend === "down") return <ArrowDown className="h-3.5 w-3.5 text-success" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

function scoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-warning"
  return "text-destructive"
}

export function ReportMetrics() {
  return (
    <div className="flex flex-col gap-6">
      {/* Security Score Trend */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Security Score Trend (5 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Week</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Bar</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Critical Vulns</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Patched</th>
              </tr>
            </thead>
            <tbody>
              {weeklyTrend.map((w) => (
                <tr key={w.week} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-card-foreground">{w.week}</td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${scoreColor(w.score)}`}>{w.score}</td>
                  <td className="px-4 py-2.5">
                    <div className="h-2 w-32 rounded-sm bg-secondary">
                      <div className="h-full rounded-sm bg-primary" style={{ width: `${w.score}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-destructive">{w.critical}</td>
                  <td className="px-4 py-2.5 font-mono text-success">{w.patched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Patch Velocity */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Patch Velocity Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Metric</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Current</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Previous</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {velocityMetrics.map((m) => (
                <tr key={m.label} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 text-card-foreground">{m.label}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-primary">{m.current}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{m.previous}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TrendIcon trend={m.trend === "down" ? "down" : "up"} />
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">Improved</Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Compliance Trend */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Framework</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Current</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Previous</th>
                <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Change</th>
              </tr>
            </thead>
            <tbody>
              {complianceTrend.map((c) => (
                <tr key={c.framework} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-card-foreground">{c.framework}</td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${scoreColor(c.current)}`}>{c.current}%</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{c.previous}%</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <ArrowUp className="h-3.5 w-3.5 text-success" />
                      <span className="font-mono text-success">+{c.current - c.previous}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
