"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertOctagon, Clock, CheckCircle2, FileText, Plus, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useApi } from "@/hooks/use-api"
import { incidentsApi, type Incident, type IncidentStats, type IncidentPlaybook, type IncidentTimelineEvent } from "@/lib/api-client"

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
  const [submitting, setSubmitting] = useState(false)

  const { data: incData, loading, refetch } = useApi(() => incidentsApi.list({ limit: 50 }))
  const { data: stats } = useApi<IncidentStats>(() => incidentsApi.stats())
  const { data: playbooks } = useApi<IncidentPlaybook[]>(() => incidentsApi.playbooks())

  const incidents = incData?.incidents ?? []
  const activeIncident = incidents.find(i => i.status !== "Resolved")

  // Fetch timeline for the most active incident
  const { data: timelineData } = useApi<Incident>(() =>
    activeIncident ? incidentsApi.get(activeIncident.incident_id) : Promise.resolve(null as unknown as Incident),
    [activeIncident?.incident_id]
  )
  const timeline = timelineData?.timeline ?? []

  async function handleCreate() {
    if (!form.title) return
    setSubmitting(true)
    try {
      await incidentsApi.create({
        title: form.title, severity: form.severity, assigned_to: form.owner || undefined,
        affected_assets: form.assets ? form.assets.split(",").map(s => s.trim()) : [],
        description: form.description || undefined,
      })
      setShowForm(false)
      setForm({ title: "", severity: "High", owner: "", assets: "", description: "" })
      refetch()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Incident Response" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Active Incidents", value: stats?.active ?? 0, color: "text-destructive" },
            { label: "Avg. MTTR (h)", value: stats?.avg_mttr ?? "—", color: "text-warning" },
            { label: "Resolved (30d)", value: stats?.resolved_30d ?? 0, color: "text-success" },
            { label: "Open Playbooks", value: stats?.open_playbooks ?? 0, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Create New Incident</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-card-foreground"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="Brief description" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</label>
                  <select className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {["Critical", "High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Owner</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. j.smith" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affected Assets</label>
                  <input className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="e.g. WORKSTATION-042" value={form.assets} onChange={e => setForm(f => ({ ...f, assets: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea className="bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground resize-none h-20" placeholder="Describe the incident…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-destructive text-white hover:bg-destructive/90" onClick={handleCreate} disabled={submitting}>{submitting ? "Creating…" : "Create Incident"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Incidents</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="h-3 w-3" /> New Incident
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading incidents…</div>
            ) : incidents.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No incidents found.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Title", "Severity", "Status", "Owner", "Opened", "Progress"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc: Incident) => (
                    <tr key={inc.incident_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <Link href={`/incident-response/${inc.incident_id}`} className="font-mono text-xs text-primary hover:underline">{inc.incident_id.toUpperCase()}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/incident-response/${inc.incident_id}`} className="text-xs text-card-foreground hover:text-primary transition-colors max-w-xs block">{inc.title}</Link>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={sevBadge(inc.severity)}>{inc.severity}</Badge></td>
                      <td className="px-4 py-3"><Badge variant="outline" className={statusBadge(inc.status)}>{inc.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-card-foreground">{inc.assigned_to ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{new Date(inc.created_at).toLocaleString()}</td>
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
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeIncident ? `${activeIncident.incident_id.toUpperCase()} — Live Timeline` : "Timeline"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-4">
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">No timeline events yet.</p>
              ) : timeline.map((t: IncidentTimelineEvent, i: number) => (
                <div key={t.id} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-none mt-0.5 shrink-0 ${timelineColor(t.event_type)}`} />
                    {i < timeline.length - 1 && <div className="w-px h-full bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="pb-3">
                    <span className="font-mono text-[10px] text-muted-foreground">{new Date(t.time).toLocaleTimeString()} UTC</span>
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
              {(playbooks ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No playbooks found.</p>
              ) : (playbooks ?? []).map((p: IncidentPlaybook) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-card-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.steps} steps · avg {p.avg_time_hours}h · last {new Date(p.last_used).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline" className={p.status === "Active" ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />{p.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
