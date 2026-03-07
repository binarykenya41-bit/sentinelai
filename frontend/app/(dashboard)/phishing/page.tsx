"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mail, UserCheck, AlertTriangle, Plus, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const stats = [
  { label: "Campaigns Run", value: "14", color: "text-primary" },
  { label: "Emails Sent", value: "2,841", color: "text-primary" },
  { label: "Click Rate", value: "22%", color: "text-destructive" },
  { label: "Credentials Submitted", value: "8%", color: "text-destructive" },
]

const campaigns = [
  { id: "PH-2026-08", name: "GitHub OAuth Lure", template: "Credential Harvest", target: "Dev Team (48)", sent: 48, opened: 41, clicked: 19, submitted: 11, reported: 6, status: "Active", date: "2026-03-05" },
  { id: "PH-2026-07", name: "IT Password Reset Lure", template: "Corporate IT", target: "All Staff (284)", sent: 284, opened: 201, clicked: 72, submitted: 18, reported: 34, status: "Completed", date: "2026-03-01" },
  { id: "PH-2026-06", name: "DocuSign Invoice Spear", template: "Spear Phishing", target: "Finance Team (22)", sent: 22, opened: 19, clicked: 12, submitted: 7, reported: 2, status: "Completed", date: "2026-02-14" },
  { id: "PH-2026-05", name: "CEO Fraud Wire Transfer", template: "BEC", target: "Finance Team (22)", sent: 22, opened: 20, clicked: 8, submitted: 4, reported: 1, status: "Completed", date: "2026-02-01" },
]

const departmentRisk = [
  { dept: "Finance", employees: 22, clickRate: 55, submitRate: 32, training: 41, risk: "Critical" },
  { dept: "Executive", employees: 8, clickRate: 38, submitRate: 25, training: 60, risk: "High" },
  { dept: "Engineering", employees: 48, clickRate: 28, submitRate: 18, training: 72, risk: "Medium" },
  { dept: "HR", employees: 14, clickRate: 43, submitRate: 21, training: 55, risk: "High" },
  { dept: "Sales", employees: 62, clickRate: 31, submitRate: 14, training: 68, risk: "Medium" },
  { dept: "IT", employees: 18, clickRate: 11, submitRate: 5, training: 91, risk: "Low" },
]

const recentClickers = [
  { user: "c.brooks@sentinel.io", dept: "Finance", campaign: "DocuSign Invoice Spear", action: "Credentials Submitted", time: "2026-02-14 14:22 UTC" },
  { user: "e.warren@sentinel.io", dept: "Finance", campaign: "CEO Fraud Wire Transfer", action: "Credentials Submitted", time: "2026-02-01 11:08 UTC" },
  { user: "p.hill@sentinel.io", dept: "Executive", campaign: "IT Password Reset Lure", action: "Clicked Link", time: "2026-03-01 09:45 UTC" },
  { user: "d.nguyen@sentinel.io", dept: "Engineering", campaign: "GitHub OAuth Lure", action: "Credentials Submitted", time: "2026-03-05 16:33 UTC" },
  { user: "s.james@sentinel.io", dept: "HR", campaign: "IT Password Reset Lure", action: "Clicked Link", time: "2026-03-01 10:12 UTC" },
]

const riskBadge = (r: string) => {
  if (r === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (r === "High") return "bg-warning/10 text-warning border-warning/20"
  if (r === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-success/10 text-success border-success/20"
}

export default function PhishingPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", template: "", target: "", subject: "", sender: "" })

  return (
    <div className="flex flex-col">
      <AppHeader title="Phishing & Social Engineering" />
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

        {/* New Campaign Form */}
        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">New Phishing Campaign</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-card-foreground"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign Name</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. Q1 Password Reset Lure" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template Type</label>
                  <select className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))}>
                    <option value="">Select template...</option>
                    {["Corporate IT", "Credential Harvest", "Spear Phishing", "BEC", "Vishing", "Smishing"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Group</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. Finance Team, All Staff" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sender Display Name</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. IT Security Team" value={form.sender} onChange={e => setForm(f => ({ ...f, sender: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Subject Line</label>
                <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. [ACTION REQUIRED] Verify your account" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Launch Campaign</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Simulation Campaigns</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="h-3 w-3" /> New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Campaign", "Target", "Sent", "Opened", "Clicked", "Creds Submitted", "Reported", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-3 py-2">
                      <Link href={`/phishing/${c.id}`} className="font-mono text-xs text-primary hover:underline">{c.id}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/phishing/${c.id}`} className="text-xs text-card-foreground hover:text-primary transition-colors">{c.name}</Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{c.target}</td>
                    <td className="px-3 py-2 font-mono text-xs text-card-foreground">{c.sent}</td>
                    <td className="px-3 py-2 font-mono text-xs text-card-foreground">{c.opened}</td>
                    <td className="px-3 py-2 font-mono text-xs text-warning font-semibold">{c.clicked}</td>
                    <td className="px-3 py-2 font-mono text-xs font-bold text-destructive">{c.submitted}</td>
                    <td className="px-3 py-2 font-mono text-xs text-success font-semibold">{c.reported}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className={c.status === "Active" ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}>{c.status}</Badge></td>
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
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Department Risk Ranking</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {departmentRisk.map((d, i) => (
                <div key={i} className="flex flex-col gap-1.5 py-2 border-b border-border last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-card-foreground">{d.dept} <span className="text-muted-foreground font-normal">({d.employees} employees)</span></span>
                    <Badge variant="outline" className={riskBadge(d.risk)}>{d.risk}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Click Rate</span><span className="text-warning">{d.clickRate}%</span>
                      </div>
                      <Progress value={d.clickRate} className="h-1 bg-secondary [&>div]:bg-destructive" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Submit Rate</span><span className="text-destructive">{d.submitRate}%</span>
                      </div>
                      <Progress value={d.submitRate} className="h-1 bg-secondary [&>div]:bg-warning" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Training</span><span className="text-success">{d.training}%</span>
                      </div>
                      <Progress value={d.training} className="h-1 bg-secondary [&>div]:bg-success" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">High-Risk Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["User", "Dept", "Campaign", "Action", "Time"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentClickers.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-3 py-2 font-mono text-xs text-primary">{r.user}</td>
                      <td className="px-3 py-2 text-xs text-card-foreground">{r.dept}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{r.campaign}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={r.action.includes("Submitted") ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>{r.action}</Badge></td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
