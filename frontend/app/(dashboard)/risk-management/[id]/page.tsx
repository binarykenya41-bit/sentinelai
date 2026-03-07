"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, BarChart3, User, Calendar, Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

const riskData: Record<string, {
  id: string; title: string; category: string; likelihood: string; impact: string; score: number;
  owner: string; treatment: string; dueDate: string; status: string; description: string;
  relatedVulns: string[]; mitigationSteps: string[]; history: { date: string; event: string; actor: string }[]
}> = {
  "RSK-001": {
    id: "RSK-001", title: "Unpatched RCE in OpenSSL (NullRoute)", category: "Technical",
    likelihood: "Very High", impact: "Critical", score: 98,
    owner: "j.smith", treatment: "Remediate", dueDate: "2026-03-10", status: "Open",
    description: "A critical remote code execution vulnerability in OpenSSL 3.1.4 allows unauthenticated attackers to execute arbitrary code via a crafted TLS ClientHello. Affects prod-web-01, api-gateway, and all HTTPS-terminating services.",
    relatedVulns: ["CVE-2026-21001"],
    mitigationSteps: [
      "Upgrade OpenSSL to 3.1.5 on all affected hosts",
      "WAF rule deployed to block malformed ClientHello payloads",
      "Patch PR auto-generated and under CI review",
      "Incident response playbook on standby",
    ],
    history: [
      { date: "2026-03-06 03:00 UTC", event: "Risk identified via CVE scan", actor: "Sentinel AI" },
      { date: "2026-03-06 03:05 UTC", event: "Score calculated: 98 (Critical)", actor: "Sentinel AI" },
      { date: "2026-03-06 03:10 UTC", event: "Assigned to j.smith — remediation deadline set 2026-03-10", actor: "System" },
      { date: "2026-03-06 04:00 UTC", event: "Patch PR opened: security/CVE-2026-21001", actor: "j.smith" },
    ],
  },
  "RSK-002": {
    id: "RSK-002", title: "DB port exposed to internet", category: "Infrastructure",
    likelihood: "High", impact: "Critical", score: 91,
    owner: "a.chen", treatment: "Remediate", dueDate: "2026-03-08", status: "In Progress",
    description: "MySQL port 3306 on prod-db-primary.internal (10.0.2.5) is accessible from 0.0.0.0/0 due to a misconfigured security group. This exposes the production database to brute-force and direct SQL attacks from the internet.",
    relatedVulns: ["CSPM-001"],
    mitigationSteps: [
      "Update security group sg-prod-db to restrict ingress to 10.0.0.0/8 only",
      "Enable database firewall logging",
      "Audit existing connection logs for unauthorized access",
      "Enable RDS automated backups",
    ],
    history: [
      { date: "2026-03-05 18:00 UTC", event: "Misconfiguration detected via CSPM scan", actor: "Sentinel AI" },
      { date: "2026-03-05 18:10 UTC", event: "Risk score assigned: 91 (Critical)", actor: "Sentinel AI" },
      { date: "2026-03-05 18:30 UTC", event: "Firewall logging enabled as interim measure", actor: "a.chen" },
    ],
  },
}

const scoreColor = (n: number) => n >= 80 ? "text-destructive" : n >= 60 ? "text-warning" : "text-success"
const scoreBarColor = (n: number) => n >= 80 ? "[&>div]:bg-destructive" : n >= 60 ? "[&>div]:bg-warning" : "[&>div]:bg-success"

const statusBadge = (s: string) => {
  if (s === "Open") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "In Progress" || s === "Monitoring") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Accepted") return "bg-muted text-muted-foreground border-border"
  return "bg-success/10 text-success border-success/20"
}

const likelihoodColor = (l: string) => {
  if (l === "Very High" || l === "High") return "text-destructive"
  if (l === "Medium") return "text-warning"
  return "text-muted-foreground"
}

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const risk = riskData[id]

  if (!risk) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Risk Detail" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Risk not found: {id}</p>
          <Link href="/risk-management">
            <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Risk Register
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={`Risk — ${risk.id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/risk-management" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Risk Register
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold text-card-foreground">{risk.id}</span>
        </div>

        {/* Header card */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-base font-bold text-card-foreground">{risk.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{risk.category} Risk · Owner: {risk.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusBadge(risk.status)}>{risk.status}</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">{risk.treatment}</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">{risk.category}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`text-4xl font-bold font-mono ${scoreColor(risk.score)}`}>{risk.score}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</span>
              <div className="w-32">
                <Progress value={risk.score} className={`h-2 bg-secondary ${scoreBarColor(risk.score)}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Description */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-card-foreground">{risk.description}</p>
              </CardContent>
            </Card>

            {/* Mitigation Steps */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mitigation Steps</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4">
                {risk.mitigationSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    <span className="text-card-foreground">{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Risk History */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk History</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {risk.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-none bg-primary mt-1 shrink-0" />
                      {i < risk.history.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                    </div>
                    <div className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{h.date}</span>
                        <span className="text-[10px] text-primary">{h.actor}</span>
                      </div>
                      <p className="text-xs text-card-foreground leading-snug">{h.event}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">
            {/* Actions */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="sm"
                  onClick={() => toast.success("Risk assigned for remediation", { description: `${risk.id} escalated to ${risk.owner}` })}>
                  <Shield className="mr-1.5 h-3.5 w-3.5" /> Escalate Risk
                </Button>
                <Button variant="outline" size="sm" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent"
                  onClick={() => { toast.loading("Generating risk report...", { duration: 1500 }); setTimeout(() => toast.success("Report ready"), 1600) }}>
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Export Risk Report
                </Button>
                {risk.relatedVulns.map(v => (
                  <Link key={v} href={`/vulnerabilities/${encodeURIComponent(v)}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent">
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> View {v}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4">
                {[
                  { label: "Likelihood", value: risk.likelihood, icon: AlertTriangle, color: likelihoodColor(risk.likelihood) },
                  { label: "Impact", value: risk.impact, icon: AlertTriangle, color: "text-card-foreground" },
                  { label: "Owner", value: risk.owner, icon: User, color: "text-primary" },
                  { label: "Due Date", value: risk.dueDate, icon: Calendar, color: "text-muted-foreground" },
                  { label: "Category", value: risk.category, icon: BarChart3, color: "text-muted-foreground" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
                        <span className={`text-xs font-semibold ${color}`}>{value}</span>
                      </div>
                    </div>
                    <Separator className="bg-border mt-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
