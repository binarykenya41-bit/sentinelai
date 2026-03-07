"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertOctagon, Clock, CheckCircle2, FileText, Plus, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const stats = [
  { label: "Active Incidents", value: "3", color: "text-destructive" },
  { label: "Avg. MTTR (h)", value: "4.2", color: "text-warning" },
  { label: "Resolved (30d)", value: "28", color: "text-success" },
  { label: "Open Playbooks", value: "12", color: "text-primary" },
]

const incidents = [
  { id: "INC-2026-041", title: "Ransomware Staging Detected — WORKSTATION-042", severity: "Critical", status: "Investigating", owner: "j.smith", opened: "2026-03-06 02:08 UTC", eta: "2026-03-06 06:00 UTC", progress: 35 },
  { id: "INC-2026-040", title: "Unauthorized DB Access from External IP", severity: "High", status: "Containment", owner: "a.chen", opened: "2026-03-06 01:30 UTC", eta: "2026-03-06 04:00 UTC", progress: 60 },
  { id: "INC-2026-039", title: "DNS Tunneling Detected — k8s-node-07", severity: "Medium", status: "Analysis", owner: "m.torres", opened: "2026-03-05 23:45 UTC", eta: "2026-03-06 05:00 UTC", progress: 45 },
  { id: "INC-2026-038", title: "Brute Force SSH — prod-web-01", severity: "High", status: "Resolved", owner: "r.patel", opened: "2026-03-05 22:10 UTC", eta: "Resolved", progress: 100 },
  { id: "INC-2026-037", title: "Exposed S3 Bucket Data Access", severity: "Critical", status: "Resolved", owner: "j.smith", opened: "2026-03-05 18:00 UTC", eta: "Resolved", progress: 100 },
]

const timeline = [
  { time: "02:08 UTC", event: "INC-2026-041 created — EDR alert triggered on WORKSTATION-042", type: "alert" },
  { time: "02:11 UTC", event: "Automated containment: endpoint isolated from network", type: "action" },
  { time: "02:14 UTC", event: "Threat Intel match: LockBit 3.0 TTPs confirmed", type: "intel" },
  { time: "02:18 UTC", event: "Forensic snapshot captured (disk + memory)", type: "action" },
  { time: "02:22 UTC", event: "Lateral movement to 3 hosts blocked by network policy", type: "action" },
  { time: "02:35 UTC", event: "IR team notified — j.smith assigned as owner", type: "notify" },
  { time: "02:40 UTC", event: "C2 domain blacklisted across all endpoints", type: "action" },
  { time: "03:01 UTC", event: "Root cause identified: malicious email attachment via T1566.001", type: "intel" },
]

const playbooks = [
  { name: "Ransomware Response", steps: 12, lastUsed: "2 hours ago", avgTime: "3.5h", status: "Active" },
  { name: "Unauthorized Access", steps: 8, lastUsed: "4 hours ago", avgTime: "2.1h", status: "Active" },
  { name: "Data Exfiltration", steps: 10, lastUsed: "3 days ago", avgTime: "4.8h", status: "Ready" },
  { name: "Malware Infection", steps: 9, lastUsed: "5 days ago", avgTime: "3.0h", status: "Ready" },
  { name: "Privilege Escalation", steps: 7, lastUsed: "1 week ago", avgTime: "1.8h", status: "Ready" },
]

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusBadge = (s: string) => {
  if (s === "Investigating") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "Containment") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Analysis") return "bg-primary/10 text-primary border-primary/20"
  if (s === "Resolved") return "bg-success/10 text-success border-success/20"
  return "bg-muted text-muted-foreground border-border"
}

const timelineColor = (t: string) => {
  if (t === "alert") return "bg-destructive"
  if (t === "intel") return "bg-warning"
  if (t === "notify") return "bg-primary"
  return "bg-success"
}

export default function IncidentResponsePage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", severity: "High", owner: "", assets: "", description: "" })

  return (
    <div className="flex flex-col">
      <AppHeader title="Incident Response" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Incident Form */}
        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Create New Incident</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-card-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                  <input
                    className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="Brief description of the incident"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</label>
                  <select
                    className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  >
                    {["Critical", "High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Owner</label>
                  <input
                    className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="e.g. j.smith"
                    value={form.owner}
                    onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affected Assets</label>
                  <input
                    className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="e.g. WORKSTATION-042, prod-web-01"
                    value={form.assets}
                    onChange={e => setForm(f => ({ ...f, assets: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initial Description</label>
                <textarea
                  className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground resize-none h-20"
                  placeholder="Describe what was detected, initial symptoms, and any actions taken so far..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-destructive text-white hover:bg-destructive/90">Create Incident</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Incidents</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="h-3 w-3" /> New Incident
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Title", "Severity", "Status", "Owner", "Opened", "Progress"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3">
                      <Link href={`/incident-response/${inc.id}`} className="font-mono text-xs text-primary hover:underline">{inc.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/incident-response/${inc.id}`} className="text-xs text-card-foreground hover:text-primary transition-colors max-w-xs block">{inc.title}</Link>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className={sevBadge(inc.severity)}>{inc.severity}</Badge></td>
                    <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(inc.status)}>{inc.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-card-foreground">{inc.owner}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inc.opened}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={inc.progress} className="h-1.5 w-20 bg-secondary [&>div]:bg-primary" />
                        <span className="font-mono text-xs text-card-foreground">{inc.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">INC-2026-041 — Live Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-4">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-none mt-0.5 shrink-0 ${timelineColor(t.type)}`} />
                    {i < timeline.length - 1 && <div className="w-px h-full bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="pb-3">
                    <span className="font-mono text-[10px] text-muted-foreground">{t.time}</span>
                    <p className="text-xs text-card-foreground leading-snug mt-0.5">{t.event}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Response Playbooks</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {playbooks.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-card-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.steps} steps · avg {p.avgTime} · last used {p.lastUsed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === "Active"
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-warning" />
                      : <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    }
                    <Badge variant="outline" className={p.status === "Active" ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
