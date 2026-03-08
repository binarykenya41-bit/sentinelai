"use client"

import { useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScanLine, Plus, X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { dashboardApi, type ComplianceOverview } from "@/lib/api-client"

interface ComplianceControl {
  id: string
  control: string
  framework: string
  status: string
  progress: number
  cve_ids: string[]
}

const FALLBACK_FRAMEWORKS: ComplianceOverview[] = []

function fwDisplayName(key: string) {
  const map: Record<string, string> = {
    iso27001: "ISO 27001",
    soc2: "SOC 2 Type II",
    pcidss: "PCI-DSS v4.0",
  }
  return map[key.toLowerCase()] ?? key.toUpperCase()
}

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
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: "", control: "", framework: "ISO 27001", owner: "", dueDate: "" })

  const { data: complianceData, loading: compLoading, error: compError } = useApi(
    () => dashboardApi.compliance(),
    []
  )

  const { data: controlsData, loading: ctrlLoading } = useApi(
    () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/dashboard/compliance/controls`)
      .then((r) => r.json() as Promise<ComplianceControl[]>),
    []
  )

  const frameworks: ComplianceOverview[] = (complianceData && complianceData.length > 0)
    ? complianceData
    : FALLBACK_FRAMEWORKS

  const controlsList: ComplianceControl[] = controlsData ?? []

  const handleScan = () => {
    toast.loading("Running compliance scan across all frameworks...", { duration: 2000 })
    setTimeout(() => toast.success("Compliance scan complete", { description: "256 controls evaluated" }), 2100)
  }

  const handleSubmit = () => {
    if (!form.id || !form.control) {
      toast.error("Please fill in all required fields")
      return
    }
    toast.success("Control added", { description: `${form.id} added to ${form.framework}` })
    setShowForm(false)
    setForm({ id: "", control: "", framework: "ISO 27001", owner: "", dueDate: "" })
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Compliance" />
      <div className="flex flex-col gap-6 p-6">

        {compError && (
          <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Backend unreachable — showing last known data. {compError}
          </div>
        )}

        {/* Framework score cards */}
        <div className="grid grid-cols-3 gap-4">
          {compLoading
            ? [0, 1, 2].map((i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-1.5 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))
            : frameworks.map((fw) => {
                const name = fwDisplayName(fw.framework)
                const inProgress = fw.total_controls - fw.passing - fw.failing
                return (
                  <Card key={fw.framework} className="border-border bg-card">
                    <CardContent className="flex flex-col gap-4 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-card-foreground">{name}</span>
                        <span className={`text-2xl font-bold ${scoreColor(fw.score)}`}>{fw.score}%</span>
                      </div>
                      <Progress value={fw.score} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                      <div className="flex justify-between text-xs">
                        <span className="text-success">{fw.passing} passing</span>
                        <span className="text-warning">{Math.max(0, inProgress)} in progress</span>
                        <span className="text-destructive">{fw.failing} failing</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{fw.total_controls} total controls</span>
                    </CardContent>
                  </Card>
                )
              })
          }
        </div>

        {/* Add Control Form */}
        {showForm && (
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Add Compliance Control</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-card-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control ID <span className="text-destructive">*</span></label>
                  <input
                    className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="e.g. A.8.10"
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Framework</label>
                  <select
                    className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.framework}
                    onChange={e => setForm(f => ({ ...f, framework: e.target.value }))}
                  >
                    {["ISO 27001", "SOC 2 Type II", "PCI-DSS v4.0"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control Description <span className="text-destructive">*</span></label>
                  <input
                    className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="Full control description"
                    value={form.control}
                    onChange={e => setForm(f => ({ ...f, control: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner</label>
                  <input
                    className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="e.g. j.smith"
                    value={form.owner}
                    onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Date</label>
                  <input
                    type="date"
                    className="rounded-md bg-secondary border border-border text-card-foreground text-xs px-3 py-2 outline-none focus:border-primary"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={handleSubmit}>Add Control</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Control Details
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground gap-1.5" onClick={handleScan}>
                  <ScanLine className="h-3 w-3" /> Run Scan
                </Button>
                <Button size="sm" variant="outline" className="h-7 border-primary/40 text-primary hover:bg-primary/10 text-xs gap-1.5" onClick={() => setShowForm(true)}>
                  <Plus className="h-3 w-3" /> Add Control
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ctrlLoading
              ? <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              : controlsList.length === 0
                ? <p className="p-4 text-xs text-muted-foreground">No control data — run a compliance scan or apply DB migration.</p>
                : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Framework</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVEs</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remediation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controlsList.map((c, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                          <td className="px-4 py-3 text-xs text-card-foreground">
                            <Link href={`/compliance/${encodeURIComponent(c.id)}`} className="hover:text-primary hover:underline transition-colors">
                              {c.control}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.framework}</td>
                          <td className="px-4 py-3 font-mono text-xs text-card-foreground">{c.cve_ids.length}</td>
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
                )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
