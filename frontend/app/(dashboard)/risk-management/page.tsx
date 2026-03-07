"use client"

import { useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Plus, X } from "lucide-react"
import { toast } from "sonner"

const stats = [
  { label: "Overall Risk Score", value: "68 / 100", color: "text-warning" },
  { label: "Critical Risks", value: "12", color: "text-destructive" },
  { label: "Accepted Risks", value: "8", color: "text-muted-foreground" },
  { label: "Risk Reduction (30d)", value: "-14%", color: "text-success" },
]

const riskRegister = [
  { id: "RSK-001", title: "Unpatched RCE in OpenSSL (NullRoute)", category: "Technical", likelihood: "Very High", impact: "Critical", score: 98, owner: "j.smith", treatment: "Remediate", dueDate: "2026-03-10", status: "Open" },
  { id: "RSK-002", title: "DB port exposed to internet", category: "Infrastructure", likelihood: "High", impact: "Critical", score: 91, owner: "a.chen", treatment: "Remediate", dueDate: "2026-03-08", status: "In Progress" },
  { id: "RSK-003", title: "No MFA on 114 accounts", category: "Identity", likelihood: "High", impact: "High", score: 78, owner: "r.patel", treatment: "Remediate", dueDate: "2026-03-15", status: "In Progress" },
  { id: "RSK-004", title: "Credential leaks on dark web", category: "Human", likelihood: "Medium", impact: "High", score: 65, owner: "m.torres", treatment: "Monitor", dueDate: "Ongoing", status: "Monitoring" },
  { id: "RSK-005", title: "S3 bucket with public read access", category: "Cloud", likelihood: "High", impact: "High", score: 72, owner: "a.chen", treatment: "Remediate", dueDate: "2026-03-09", status: "Open" },
  { id: "RSK-006", title: "Docker API port 2375 exposed", category: "Container", likelihood: "Medium", impact: "Critical", score: 81, owner: "j.smith", treatment: "Remediate", dueDate: "2026-03-07", status: "Open" },
  { id: "RSK-007", title: "Stale admin accounts (90d+)", category: "Identity", likelihood: "Low", impact: "High", score: 44, owner: "r.patel", treatment: "Remediate", dueDate: "2026-03-20", status: "Open" },
  { id: "RSK-008", title: "No rate limiting on login API", category: "Application", likelihood: "Medium", impact: "Medium", score: 48, owner: "m.torres", treatment: "Accept", dueDate: "2026-04-01", status: "Accepted" },
]

const riskByCategory = [
  { category: "Technical", score: 88, risks: 18 },
  { category: "Cloud", score: 74, risks: 11 },
  { category: "Identity", score: 71, risks: 9 },
  { category: "Container", score: 82, risks: 7 },
  { category: "Application", score: 55, risks: 14 },
  { category: "Human", score: 62, risks: 6 },
]

const scoreColor = (n: number) => n >= 80 ? "text-destructive" : n >= 60 ? "text-warning" : "text-success"
const statusBadge = (s: string) => {
  if (s === "Open") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "In Progress" || s === "Monitoring") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Accepted") return "bg-muted text-muted-foreground border-border"
  return "bg-success/10 text-success border-success/20"
}

const treatmentBadge = (t: string) => {
  if (t === "Remediate") return "bg-primary/10 text-primary border-primary/20"
  if (t === "Monitor") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function RiskManagementPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", category: "Technical", likelihood: "Medium", impact: "High", owner: "", treatment: "Remediate", dueDate: "", description: "" })

  const handleSubmit = () => {
    if (!form.title || !form.owner) {
      toast.error("Please fill in all required fields")
      return
    }
    const newId = `RSK-${String(riskRegister.length + 1).padStart(3, "0")}`
    toast.success("Risk registered", { description: `${newId} added to risk register` })
    setShowForm(false)
    setForm({ title: "", category: "Technical", likelihood: "Medium", impact: "High", owner: "", treatment: "Remediate", dueDate: "", description: "" })
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Risk Management" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {riskByCategory.map((c) => (
            <Card key={c.category} className="border-border bg-card">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-card-foreground">{c.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{c.risks} risks</span>
                    <span className={`font-mono text-sm font-bold ${scoreColor(c.score)}`}>{c.score}</span>
                  </div>
                </div>
                <Progress value={c.score} className={`h-1.5 bg-secondary ${c.score >= 80 ? "[&>div]:bg-destructive" : c.score >= 60 ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Risk Form */}
        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Register New Risk</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-card-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Title <span className="text-destructive">*</span></label>
                  <input
                    className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="Brief description of the risk"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {["Technical", "Infrastructure", "Identity", "Cloud", "Container", "Application", "Human"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Likelihood</label>
                  <select className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.likelihood} onChange={e => setForm(f => ({ ...f, likelihood: e.target.value }))}>
                    {["Very High", "High", "Medium", "Low", "Very Low"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impact</label>
                  <select className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}>
                    {["Critical", "High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner <span className="text-destructive">*</span></label>
                  <input className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="e.g. j.smith" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Treatment</label>
                  <select className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}>
                    {["Remediate", "Monitor", "Transfer", "Accept"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</label>
                  <input type="date" className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                  <textarea className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground resize-none h-16"
                    placeholder="Detailed description and context..."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={handleSubmit}>Register Risk</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Register</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="h-7 border-primary/40 text-primary hover:bg-primary/10 text-xs gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="h-3 w-3" /> Register Risk
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Risk", "Category", "Likelihood", "Impact", "Score", "Owner", "Treatment", "Due", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskRegister.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-3 py-2">
                      <Link href={`/risk-management/${r.id}`} className="font-mono text-xs text-primary hover:underline">{r.id}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/risk-management/${r.id}`} className="text-xs text-card-foreground hover:text-primary transition-colors max-w-xs block">{r.title}</Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.category}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.likelihood}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.impact}</td>
                    <td className="px-3 py-2"><span className={`font-mono text-sm font-bold ${scoreColor(r.score)}`}>{r.score}</span></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.owner}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className={treatmentBadge(r.treatment)}>{r.treatment}</Badge></td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.dueDate}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className={statusBadge(r.status)}>{r.status}</Badge></td>
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
