import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Swords, Target, Shield, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react"

const campaign = {
  id: "RT-2026-007",
  name: "APT Simulation — Finance Division",
  type: "Full Red Team",
  operator: "r.patel",
  status: "Completed",
  started: "2026-02-28 09:00 UTC",
  ended: "2026-03-01 18:00 UTC",
  targetScope: ["10.0.5.0/24", "finance-app.internal", "erp.internal"],
  objective: "Simulate APT lateral movement from a phishing foothold to exfiltration of financial records.",
  outcome: "Partial Success — Initial access achieved, lateral movement contained by EDR before exfiltration.",
  cvssImpact: 8.7,
}

const killChain = [
  {
    phase: "Initial Access",
    technique: "T1566.001 — Spearphishing Attachment",
    status: true,
    detail: "Macro-enabled Excel attachment delivered to finance@internal. 2 of 5 targets opened attachment.",
  },
  {
    phase: "Execution",
    technique: "T1059.001 — PowerShell",
    status: true,
    detail: "Encoded PowerShell payload executed via VBA macro. Reverse shell established to C2 on port 443.",
  },
  {
    phase: "Persistence",
    technique: "T1547.001 — Registry Run Keys",
    status: true,
    detail: "Persistence established via HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.",
  },
  {
    phase: "Privilege Escalation",
    technique: "T1068 — Exploitation of Vulnerability",
    status: true,
    detail: "Local privilege escalation via CVE-2025-38210 (glibc). SYSTEM context achieved.",
  },
  {
    phase: "Lateral Movement",
    technique: "T1021.002 — SMB/Windows Admin Shares",
    status: null,
    detail: "SMB lateral movement attempted to finance-app.internal. Blocked by EDR — network isolation triggered.",
  },
  {
    phase: "Collection",
    technique: "T1213 — Data from Information Repositories",
    status: false,
    detail: "Access to ERP financial records not achieved. Lateral movement was contained before collection.",
  },
  {
    phase: "Exfiltration",
    technique: "T1041 — Exfil Over C2 Channel",
    status: false,
    detail: "Exfiltration not attempted — upstream phases blocked.",
  },
]

const findings = [
  { id: "F-001", severity: "Critical", title: "Phishing susceptibility — 40% open rate in Finance", remediation: "Mandatory phishing awareness training + email gateway sandboxing" },
  { id: "F-002", severity: "Critical", title: "CVE-2025-38210 exploitable for local priv-esc", remediation: "Patch glibc 2.35 on all workstations — no patch available, apply mitigation config" },
  { id: "F-003", severity: "High", title: "PowerShell execution unrestricted on workstations", remediation: "Enforce Constrained Language Mode + AppLocker policy for PS" },
  { id: "F-004", severity: "High", title: "Persistence via registry not detected for 8 minutes", remediation: "Tune EDR rule for HKCU Run key writes with unsigned binaries" },
  { id: "F-005", severity: "Medium", title: "SMB admin shares accessible between Finance segment hosts", remediation: "Implement micro-segmentation — restrict SMB between workstations" },
]

const sevColor = (s: string) =>
  s === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20"
  : s === "High" ? "bg-warning/10 text-warning border-warning/20"
  : "bg-primary/10 text-primary border-primary/20"

const stepIcon = (s: boolean | null) =>
  s === true ? <CheckCircle2 className="h-4 w-4 text-success" />
  : s === false ? <XCircle className="h-4 w-4 text-destructive" />
  : <AlertTriangle className="h-4 w-4 text-warning" />

export default function RedTeamDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Red Team — ${campaign.id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Summary */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Swords className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{campaign.started} → {campaign.ended}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">{campaign.status}</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">{campaign.type}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Operator</p>
                <p className="text-primary font-mono">{campaign.operator}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Target Scope</p>
                {campaign.targetScope.map(s => <p key={s} className="font-mono text-card-foreground">{s}</p>)}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Outcome</p>
                <p className="text-warning">{campaign.outcome}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Objective</p>
              <p className="text-xs text-card-foreground">{campaign.objective}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Kill Chain */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kill Chain Execution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-4">
              {killChain.map((step, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="mt-0.5 shrink-0">{stepIcon(step.status)}</div>
                    {i < killChain.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[2rem]" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-card-foreground">{step.phase}</span>
                      <span className="font-mono text-[10px] text-primary">{step.technique}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Findings */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Findings & Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {findings.map((f) => (
                <div key={f.id} className="border border-border p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${sevColor(f.severity)}`}>{f.severity}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{f.id}</span>
                  </div>
                  <p className="text-xs font-semibold text-card-foreground">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground">{f.remediation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Phases Succeeded", value: `${killChain.filter(s => s.status === true).length} / ${killChain.length}`, color: "text-warning" },
            { label: "Phases Blocked", value: String(killChain.filter(s => s.status === false).length), color: "text-success" },
            { label: "Critical Findings", value: String(findings.filter(f => f.severity === "Critical").length), color: "text-destructive" },
            { label: "CVSS Impact Score", value: String(campaign.cvssImpact), color: "text-destructive" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
