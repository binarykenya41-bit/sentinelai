"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, Database, Wifi, Cloud, Monitor, Globe, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import Link from "next/link"
import { useApi } from "@/hooks/use-api"
import { infraApi, type InfraNode, type InfraStats } from "@/lib/api-client"

const typeIcon = (type: string) => {
  if (type === "database") return <Database className="h-3 w-3" />
  if (type === "network_device") return <Wifi className="h-3 w-3" />
  if (type === "cloud") return <Cloud className="h-3 w-3" />
  if (type === "endpoint") return <Monitor className="h-3 w-3" />
  return <Globe className="h-3 w-3" />
}

const envBadge = (e: string) => {
  if (e === "production") return "bg-primary/10 text-primary border-primary/20"
  if (e === "staging") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

const patchBadge = (s: string) => {
  if (s === "current") return "bg-success/10 text-success border-success/20"
  if (s === "behind") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function InfrastructurePage() {
  const { data: infraData, loading } = useApi(() => infraApi.list({ limit: 100 }))
  const { data: stats } = useApi<InfraStats>(() => infraApi.stats())

  const nodes = infraData?.nodes ?? []
  const total = stats?.total ?? 0
  const byType = stats?.by_type ?? {}
  const bySource = stats?.by_source ?? {}
  const behindPatches = stats?.behind_patches ?? 0
  const vulnerable = stats?.vulnerable ?? 0

  return (
    <div className="flex flex-col">
      <AppHeader title="Infrastructure" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Nodes", value: total.toString(), color: "text-primary" },
            { label: "Vulnerable", value: vulnerable.toString(), color: "text-destructive" },
            { label: "Behind Patches", value: behindPatches.toString(), color: "text-warning" },
            { label: "Types", value: Object.keys(byType).length.toString(), color: "text-success" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Node Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {typeIcon(type)}
                    <span className="text-xs text-card-foreground capitalize">{type.replace("_", " ")}s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={total > 0 ? (count / total) * 100 : 0} className="w-20 h-1.5 bg-secondary [&>div]:bg-primary" />
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Discovery Sources</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {Object.entries(bySource).length === 0 ? (
                <p className="text-xs text-muted-foreground">No sources detected</p>
              ) : Object.entries(bySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-xs text-card-foreground">{source}</span>
                  <span className="font-mono text-xs text-muted-foreground">{count} nodes</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              <Link href="/infrastructure/add">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs justify-start gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Infrastructure Node
                </Button>
              </Link>
              <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Trigger Discovery Sync
              </Button>
              <Link href="/digital-twin">
                <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                  <Server className="h-3.5 w-3.5" /> View Digital Twin
                </Button>
              </Link>
              <Link href="/sandbox">
                <Button variant="outline" className="w-full border-border text-xs justify-start gap-2">
                  <Cloud className="h-3.5 w-3.5" /> Sandbox / Clone Env
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Infrastructure Nodes {total > 0 && `(${total})`}
              </CardTitle>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-success" /> Current
                <AlertTriangle className="h-3 w-3 text-warning" /> Behind
                <XCircle className="h-3 w-3 text-muted-foreground" /> Unknown
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading infrastructure…</div>
            ) : nodes.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No nodes found. Run a discovery sync or add nodes manually.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Name", "Type", "Environment", "IP", "OS", "Patches", "CVEs", "Source"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((n: InfraNode) => (
                      <tr key={n.node_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-3">
                          <Link href={`/infrastructure/${n.node_id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{n.name}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                            {typeIcon(n.type ?? "")} <span className="capitalize">{(n.type ?? "").replace("_", " ")}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={envBadge(n.environment ?? "")}>{n.environment ?? "—"}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{n.ip_address ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-card-foreground whitespace-nowrap">
                          {n.os_name ? `${n.os_name} ${n.os_version ?? ""}`.trim() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={patchBadge(n.patch_status ?? "")}>{n.patch_status ?? "unknown"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs font-bold ${(n.known_cves?.length ?? 0) > 0 ? "text-destructive" : "text-success"}`}>
                            {n.known_cves?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{n.external_tool ?? "manual"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
