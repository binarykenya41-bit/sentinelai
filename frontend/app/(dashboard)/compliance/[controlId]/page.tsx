"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Shield } from "lucide-react"

interface ControlDetail {
  id: string
  control: string
  framework: string
  category: string
  status: string
  progress: number
  description: string
  objective: string
  relatedVulns: { cve: string; severity: string; component: string }[]
  evidence: { item: string; status: string; lastChecked: string }[]
  remediationSteps: { step: string; status: string; assignee: string }[]
  auditHistory: { date: string; auditor: string; result: string; notes: string }[]
}

const controls: Record<string, ControlDetail> = {
  "a-8-8": {
    id: "a-8-8", control: "A.8.8 - Management of technical vulnerabilities", framework: "ISO 27001",
    category: "Asset Management", status: "Failing", progress: 45,
    description: "Technical vulnerabilities of information systems being used shall be identified, the organization's exposure to such vulnerabilities shall be evaluated and appropriate measures taken.",
    objective: "Ensure all technical vulnerabilities are identified, assessed for risk, and remediated within defined SLAs based on severity.",
    relatedVulns: [
      { cve: "CVE-2026-21001", severity: "Critical", component: "OpenSSL 3.1.4" },
      { cve: "CVE-2026-18823", severity: "High", component: "log4j-core 2.17.1" },
      { cve: "CVE-2026-08112", severity: "Critical", component: "containerd 1.7.2" },
      { cve: "CVE-2026-06221", severity: "High", component: "redis 7.0.11" },
      { cve: "CVE-2026-12990", severity: "High", component: "nginx 1.24.0" },
    ],
    evidence: [
      { item: "Automated vulnerability scanning enabled", status: "pass", lastChecked: "2026-03-03" },
      { item: "Critical vulns remediated within 14-day SLA", status: "fail", lastChecked: "2026-03-03" },
      { item: "Vulnerability risk assessment documented", status: "pass", lastChecked: "2026-03-03" },
      { item: "Patch management process defined", status: "pass", lastChecked: "2026-03-02" },
      { item: "All critical patches applied", status: "fail", lastChecked: "2026-03-03" },
    ],
    remediationSteps: [
      { step: "Merge pending patches for CVE-2026-21001 and CVE-2026-08112", status: "In Progress", assignee: "platform-team" },
      { step: "Upgrade log4j-core across all Java services", status: "In Progress", assignee: "backend-team" },
      { step: "Restrict Redis EVAL permissions", status: "Pending", assignee: "infra-team" },
      { step: "Apply nginx H2 limit patch", status: "Pending", assignee: "infra-team" },
      { step: "Re-scan and verify all patches applied", status: "Pending", assignee: "security-team" },
    ],
    auditHistory: [
      { date: "2026-02-15", auditor: "Internal Audit", result: "Partial", notes: "3 critical vulns unpatched beyond SLA" },
      { date: "2026-01-15", auditor: "Internal Audit", result: "Partial", notes: "Scanning frequency improved, 2 vulns outstanding" },
      { date: "2025-12-15", auditor: "External (Deloitte)", result: "Non-Conformant", notes: "No automated scanning, manual process only" },
    ],
  },
  "cc6-1": {
    id: "cc6-1", control: "CC6.1 - Logical and Physical Access Controls", framework: "SOC 2",
    category: "Common Criteria", status: "Failing", progress: 35,
    description: "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.",
    objective: "Ensure logical access controls prevent unauthorized access to systems and data through proper authentication, authorization, and network segmentation.",
    relatedVulns: [
      { cve: "CVE-2026-09871", severity: "Medium", component: "PostgreSQL 15.3" },
      { cve: "CVE-2026-06221", severity: "High", component: "redis 7.0.11" },
      { cve: "CVE-2026-07445", severity: "Medium", component: "express 4.18.2" },
    ],
    evidence: [
      { item: "MFA enforced for all admin accounts", status: "pass", lastChecked: "2026-03-01" },
      { item: "Network segmentation between tiers", status: "fail", lastChecked: "2026-03-03" },
      { item: "RBAC enforced for database access", status: "fail", lastChecked: "2026-03-03" },
      { item: "API authentication for all endpoints", status: "pass", lastChecked: "2026-03-02" },
    ],
    remediationSteps: [
      { step: "Implement microsegmentation between Redis and database", status: "Pending", assignee: "infra-team" },
      { step: "Restrict PostgreSQL extension privileges", status: "In Progress", assignee: "dba-team" },
      { step: "Fix prototype pollution in Express middleware", status: "Complete", assignee: "backend-team" },
    ],
    auditHistory: [
      { date: "2026-02-15", auditor: "Internal Audit", result: "Failing", notes: "Redis has direct DB access, no segmentation" },
      { date: "2026-01-15", auditor: "Internal Audit", result: "Partial", notes: "MFA deployed, segmentation pending" },
    ],
  },
}

function statusBadge(status: string) {
  switch (status) {
    case "Passing": case "pass": case "Complete": return "bg-success/10 text-success border-success/20"
    case "In Progress": case "Partial": return "bg-warning/10 text-warning border-warning/20"
    case "Failing": case "fail": case "Non-Conformant": return "bg-destructive/10 text-destructive border-destructive/20"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "pass": return <CheckCircle className="h-3.5 w-3.5 text-success" />
    case "fail": return <XCircle className="h-3.5 w-3.5 text-destructive" />
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function sevBadge(severity: string) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/10 text-warning border-warning/20",
    Medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  }
  return map[severity] ?? "bg-muted text-muted-foreground border-border"
}

export default function ComplianceControlDetailPage({ params }: { params: Promise<{ controlId: string }> }) {
  const { controlId } = use(params)
  const control = controls[controlId]

  if (!control) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Control Detail" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Control not found: {controlId}</p>
          <Link href="/compliance">
            <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Compliance
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={`Control: ${control.control}`} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          <Link href="/compliance" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Compliance
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-semibold text-card-foreground">{control.control}</span>
        </div>

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-card-foreground">{control.control}</span>
                <Badge variant="outline" className={statusBadge(control.status)}>{control.status}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{control.framework}</span>
                <span>{control.category}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">Remediation Progress</span>
              <div className="flex items-center gap-2">
                <Progress value={control.progress} className="h-2 w-24 bg-secondary [&>div]:bg-primary" />
                <span className="font-mono text-sm font-bold text-primary">{control.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Description */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control Description</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm leading-relaxed text-card-foreground">{control.description}</p>
                <Separator className="bg-border" />
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Objective</h4>
                  <p className="text-sm leading-relaxed text-card-foreground">{control.objective}</p>
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Checklist</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {control.evidence.map((e) => (
                  <div key={e.item} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(e.status)}
                      <span className="text-xs text-card-foreground">{e.item}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{e.lastChecked}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Remediation Steps */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remediation Plan</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Step</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {control.remediationSteps.map((s) => (
                      <tr key={s.step} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5 text-card-foreground">{s.step}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className={statusBadge(s.status)}>{s.status}</Badge></td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.assignee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Audit History */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Auditor</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {control.auditHistory.map((a, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5 font-mono text-card-foreground">{a.date}</td>
                        <td className="px-4 py-2.5 text-card-foreground">{a.auditor}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className={statusBadge(a.result)}>{a.result}</Badge></td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Related Vulnerabilities */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {control.relatedVulns.map((v) => (
                  <Link key={v.cve} href={`/vulnerabilities/${encodeURIComponent(v.cve)}`}>
                    <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-2.5 transition-colors hover:bg-secondary">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-semibold text-primary">{v.cve}</span>
                        <span className="text-[10px] text-muted-foreground">{v.component}</span>
                      </div>
                      <Badge variant="outline" className={sevBadge(v.severity)}>{v.severity}</Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
