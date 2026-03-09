"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ShieldAlert, Plus, X } from "lucide-react"
import { useState } from "react"
import { useApi } from "@/hooks/use-api"
import { risksApi, type Risk, type RiskStats } from "@/lib/api-client"

const riskColor = (score: number) => {
  if (score >= 15) return "bg-destructive/10 text-destructive border-destructive/20"
  if (score >= 10) return "bg-warning/10 text-warning border-warning/20"
  if (score >= 5) return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusBadge = (s: string) => {
  if (s === "Open") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "In Progress") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Mitigated") return "bg-success/10 text-success border-success/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function RiskManagementPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", category: "Vulnerability Management", likelihood: "3", impact: "3", owner: "", mitigation: "" })
  const [submitting, setSubmitting] = useState(false)

  const { data: riskData, loading, refetch } = useApi(() => risksApi.list({ limit: 100 }))
  const { data: stats } = useApi<RiskStats>(() => risksApi.stats())

  const risks = riskData?.risks ?? []
  const total = stats?.total ?? 0

  async function handleCreate() {
    if (!form.title) return
    setSubmitting(true)
    try {
      await risksApi.create({
        title: form.title, category: form.category,
        likelihood: parseInt(form.likelihood), impact: parseInt(form.impact),
        owner: form.owner || undefined, mitigation: form.mitigation || undefined,
      })
      setShowForm(false)
      setForm({ title: "", category: "Vulnerability Management", likelihood: "3", impact: "3", owner: "", mitigation: "" })
      refetch()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Risk Management" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Risks", value: total, color: "text-primary" },
            { label: "Critical (≥15)", value: stats?.critical ?? 0, color: "text-destructive" },
            { label: "High (≥10)", value: stats?.high ?? 0, color: "text-warning" },
            { label: "Mitigated", value: stats?.by_status?.Mitigated ?? 0, color: "text-success" },
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
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk by Category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {Object.entries(stats?.by_category ?? {}).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-card-foreground">{cat}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(count / Math.max(total, 1)) * 100} className="w-16 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className="font-mono text-xs text-muted-foreground w-4">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Heat Map (Likelihood × Impact)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="text-center text-xs">
                  <thead>
                    <tr>
                      <th className="text-[10px] text-muted-foreground px-2 py-1">L\I</th>
                      {[1,2,3,4,5].map(i => <th key={i} className="text-muted-foreground px-3 py-1">{i}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[5,4,3,2,1].map(likelihood => (
                      <tr key={likelihood}>
                        <td className="text-muted-foreground px-2 py-1 font-semibold">{likelihood}</td>
                        {[1,2,3,4,5].map(impact => {
                          const score = likelihood * impact
                          const count = risks.filter((r: Risk) => r.likelihood === likelihood && r.impact === impact).length
                          return (
                            <td key={impact} className={`h-8 w-10 font-bold rounded-sm ${score >= 15 ? "bg-destructive/30 text-destructive" : score >= 10 ? "bg-warning/30 text-warning" : score >= 5 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {count > 0 ? count : ""}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground mt-2">Likelihood (rows, 5=highest) × Impact (cols, 5=highest). Numbers = risk count.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Register New Risk</CardTitle>
                <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" placeholder="Risk description" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                  <select className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {["Vulnerability Management","Identity & Access","Supply Chain","Cloud Security","Human Factor","Insider Threat","Network Security","Business Continuity"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" placeholder="e.g. sec-ops" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Likelihood (1–5)</label>
                  <input type="number" min={1} max={5} className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" value={form.likelihood} onChange={e => setForm(f => ({ ...f, likelihood: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impact (1–5)</label>
                  <input type="number" min={1} max={5} className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mitigation Plan</label>
                  <textarea className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary resize-none h-16" value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={submitting}>{submitting ? "Saving…" : "Register Risk"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Register</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="h-3 w-3" /> Register Risk
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading risks…</div>
            ) : risks.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No risks registered.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Title", "Category", "L", "I", "Score", "Status", "Owner", "Review Date"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {risks.map((r: Risk) => (
                    <tr key={r.risk_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-xs text-card-foreground max-w-xs">{r.title}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.category}</td>
                      <td className="px-4 py-3 font-mono text-xs text-center text-card-foreground">{r.likelihood}</td>
                      <td className="px-4 py-3 font-mono text-xs text-center text-card-foreground">{r.impact}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={riskColor(r.risk_score)}>{r.risk_score}</Badge></td>
                      <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(r.status)}>{r.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-card-foreground">{r.owner ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.review_date ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
