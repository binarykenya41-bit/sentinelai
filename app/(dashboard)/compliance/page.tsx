import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const frameworks = [
  {
    name: "ISO 27001",
    score: 82,
    controls: 114,
    passing: 94,
    failing: 12,
    inProgress: 8,
  },
  {
    name: "SOC 2 Type II",
    score: 76,
    controls: 64,
    passing: 49,
    failing: 8,
    inProgress: 7,
  },
  {
    name: "PCI-DSS v4.0",
    score: 69,
    controls: 78,
    passing: 54,
    failing: 15,
    inProgress: 9,
  },
]

const controlsList = [
  { id: "a-8-8", control: "A.8.8 - Management of technical vulnerabilities", framework: "ISO 27001", vulns: 5, status: "Failing", progress: 45 },
  { id: "a-8-9", control: "A.8.9 - Configuration management", framework: "ISO 27001", vulns: 2, status: "In Progress", progress: 70 },
  { id: "cc6-1", control: "CC6.1 - Logical and Physical Access Controls", framework: "SOC 2", vulns: 3, status: "Failing", progress: 35 },
  { id: "cc7-2", control: "CC7.2 - Monitoring of System Components", framework: "SOC 2", vulns: 1, status: "Passing", progress: 100 },
  { id: "6-2-4", control: "6.2.4 - Software on all system components is protected", framework: "PCI-DSS", vulns: 8, status: "Failing", progress: 25 },
  { id: "6-3-1", control: "6.3.1 - Security vulnerabilities identified and managed", framework: "PCI-DSS", vulns: 4, status: "In Progress", progress: 60 },
  { id: "11-3-1", control: "11.3.1 - Internal vulnerability scans performed", framework: "PCI-DSS", vulns: 0, status: "Passing", progress: 100 },
  { id: "a-12-6-1", control: "A.12.6.1 - Management of technical vulnerabilities", framework: "ISO 27001", vulns: 3, status: "In Progress", progress: 55 },
]

function scoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-warning"
  return "text-destructive"
}

function statusBadge(status: string) {
  switch (status) {
    case "Passing": return "bg-success/10 text-success border-success/20"
    case "In Progress": return "bg-warning/10 text-warning border-warning/20"
    case "Failing": return "bg-destructive/10 text-destructive border-destructive/20"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

export default function CompliancePage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Compliance" />
      <div className="flex flex-col gap-6 p-6">
        {/* Framework score cards */}
        <div className="grid grid-cols-3 gap-4">
          {frameworks.map((fw) => (
            <Card key={fw.name} className="border-border bg-card">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-card-foreground">{fw.name}</span>
                  <span className={`text-2xl font-bold ${scoreColor(fw.score)}`}>{fw.score}%</span>
                </div>
                <Progress value={fw.score} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                <div className="flex justify-between text-xs">
                  <span className="text-success">{fw.passing} passing</span>
                  <span className="text-warning">{fw.inProgress} in progress</span>
                  <span className="text-destructive">{fw.failing} failing</span>
                </div>
                <span className="text-xs text-muted-foreground">{fw.controls} total controls</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Control Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Framework</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Vulns</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remediation</th>
                </tr>
              </thead>
              <tbody>
                {controlsList.map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-xs text-card-foreground">{c.control}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.framework}</td>
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{c.vulns}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusBadge(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={c.progress} className="h-1.5 w-20 bg-secondary [&>div]:bg-primary" />
                        <span className="font-mono text-xs text-muted-foreground">{c.progress}%</span>
                      </div>
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
