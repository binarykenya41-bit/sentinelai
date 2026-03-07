"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Swords, Target, Activity, Plus, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const campaigns = [
  { id: "RT-2026-07", name: "APT Simulation — Finance Division", threat: "APT29", status: "Completed", phase: "Impact", start: "2026-02-28", progress: 100, findings: 5, criticals: 2 },
  { id: "RT-2026-03", name: "APT29 Emulation — Cozy Bear TTPs", threat: "APT29", status: "Active", phase: "Lateral Movement", start: "2026-03-01", progress: 68, findings: 14, criticals: 4 },
  { id: "RT-2026-02", name: "Ransomware Kill Chain — LockBit 3.0", threat: "LockBit 3.0", status: "Completed", phase: "Impact", start: "2026-02-12", progress: 100, findings: 22, criticals: 8 },
  { id: "RT-2026-01", name: "Supply Chain Attack — SolarWinds-style", threat: "Custom", status: "Completed", phase: "Exfiltration", start: "2026-01-20", progress: 100, findings: 11, criticals: 3 },
]

const killChainSteps = [
  { phase: "Reconnaissance", tactic: "TA0043", techniques: ["T1595 - Active Scanning", "T1589 - Gather Victim Identity Info"], status: "Complete", success: true },
  { phase: "Initial Access", tactic: "TA0001", techniques: ["T1566.001 - Spearphishing Attachment", "T1190 - Exploit Public-Facing App"], status: "Complete", success: true },
  { phase: "Execution", tactic: "TA0002", techniques: ["T1059.001 - PowerShell", "T1203 - Exploitation for Client Execution"], status: "Complete", success: true },
  { phase: "Persistence", tactic: "TA0003", techniques: ["T1547.001 - Registry Run Keys", "T1078 - Valid Accounts"], status: "Complete", success: true },
  { phase: "Privilege Escalation", tactic: "TA0004", techniques: ["T1068 - Exploitation for Privilege Escalation", "T1548 - Abuse Elevation Control"], status: "Complete", success: true },
  { phase: "Defense Evasion", tactic: "TA0005", techniques: ["T1070.004 - File Deletion", "T1562.001 - Disable Security Tools"], status: "Complete", success: false },
  { phase: "Lateral Movement", tactic: "TA0008", techniques: ["T1021.001 - Remote Desktop Protocol", "T1550.002 - Pass the Hash"], status: "In Progress", success: null },
  { phase: "Collection", tactic: "TA0009", techniques: ["T1560 - Archive Collected Data"], status: "Pending", success: null },
  { phase: "Exfiltration", tactic: "TA0010", techniques: ["T1048 - Exfiltration Over Alt Protocol"], status: "Pending", success: null },
  { phase: "Impact", tactic: "TA0040", techniques: ["T1486 - Data Encrypted for Impact"], status: "Pending", success: null },
]

const criticalFindings = [
  { finding: "Domain Admin obtained via Kerberoasting in 8 minutes", phase: "Privilege Escalation", cvss: 9.8, recommendation: "Enforce Kerberos AES encryption, disable RC4" },
  { finding: "EDR bypassed using living-off-the-land binaries", phase: "Defense Evasion", cvss: 8.6, recommendation: "Enable script block logging, restrict LOLBins" },
  { finding: "Lateral movement to 14 systems in 22 minutes", phase: "Lateral Movement", cvss: 9.1, recommendation: "Enforce network segmentation, disable NTLM" },
  { finding: "2.4 GB exfiltrated via HTTPS to external C2", phase: "Exfiltration", cvss: 8.8, recommendation: "DLP policy enforcement, SSL inspection" },
]

const statusBadge = (s: string) => {
  if (s === "Active") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Completed") return "bg-success/10 text-success border-success/20"
  return "bg-muted text-muted-foreground border-border"
}

const phaseStatus = (s: boolean | null, status: string) => {
  if (status === "Pending") return "text-muted-foreground"
  if (status === "In Progress") return "text-warning"
  if (s === true) return "text-success"
  return "text-destructive"
}

export default function RedTeamPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", threat: "", scope: "", operator: "", objective: "" })

  return (
    <div className="flex flex-col">
      <AppHeader title="Red Team / Adversary Emulation" />
      <div className="flex flex-col gap-6 p-6">

        {/* New Campaign Form */}
        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">New Red Team Campaign</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-card-foreground"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign Name</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. APT29 Emulation — Corp Network" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Threat Actor / TTP Source</label>
                  <select className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" value={form.threat} onChange={e => setForm(f => ({ ...f, threat: e.target.value }))}>
                    <option value="">Select threat actor...</option>
                    {["APT29 (Cozy Bear)", "APT28 (Fancy Bear)", "Lazarus Group", "LockBit 3.0", "Cl0p", "Custom TTPs"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Scope</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. 10.0.5.0/24, finance-app.internal" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead Operator</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. r.patel" value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objective</label>
                <textarea className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground resize-none h-16" placeholder="Describe the attack simulation goal..." value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Launch Campaign</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{campaigns.length} campaigns total · {campaigns.filter(c => c.status === "Active").length} active</p>
          <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-3 w-3" /> New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/red-team/${c.id}`}>
              <Card className="border-border bg-card hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-card-foreground leading-snug">{c.name}</span>
                    <Badge variant="outline" className={statusBadge(c.status)}>{c.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Threat: <span className="text-card-foreground">{c.threat}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Phase: <span className="text-primary">{c.phase}</span></span>
                    </div>
                  </div>
                  <Progress value={c.progress} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-card-foreground">{c.progress}% complete</span>
                    <span className="text-destructive font-semibold">{c.criticals} criticals</span>
                    <span>{c.findings} findings</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kill Chain — RT-2026-03 (Live)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-4">
              {killChainSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className={`mt-0.5 h-2 w-2 rounded-none shrink-0 ${step.status === "Pending" ? "bg-muted" : step.status === "In Progress" ? "bg-warning" : step.success === true ? "bg-success" : "bg-destructive"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${phaseStatus(step.success as boolean | null, step.status)}`}>{step.phase}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{step.tactic}</span>
                    </div>
                    {step.techniques.map((t) => (
                      <p key={t} className="text-[10px] text-muted-foreground leading-relaxed">{t}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Critical Findings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {criticalFindings.map((f, i) => (
                <div key={i} className="border border-destructive/20 bg-destructive/5 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">{f.phase}</Badge>
                    <span className="font-mono text-xs font-bold text-destructive">CVSS {f.cvss}</span>
                  </div>
                  <p className="text-xs text-card-foreground leading-snug">{f.finding}</p>
                  <p className="text-[10px] text-muted-foreground">Rec: {f.recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
