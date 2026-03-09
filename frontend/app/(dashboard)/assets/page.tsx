"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Server, Database, Container, Globe, Cpu } from "lucide-react"
import Link from "next/link"
import { useApi } from "@/hooks/use-api"
import { assetsApi, type Asset, type AssetStats } from "@/lib/api-client"

const typeIcon = (type: string) => {
  if (type === "database") return <Database className="h-3 w-3" />
  if (type === "container") return <Container className="h-3 w-3" />
  if (type === "service") return <Globe className="h-3 w-3" />
  return <Server className="h-3 w-3" />
}

const critColor = (c: string) => {
  if (c === "critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (c === "high") return "bg-warning/10 text-warning border-warning/20"
  if (c === "medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusColor = (s: string) => {
  if (s === "current") return "text-success"
  if (s === "behind") return "text-warning"
  return "text-muted-foreground"
}

export default function AssetsPage() {
  const { data: assetsData, loading: assetsLoading } = useApi(() => assetsApi.list({ limit: 100 }))
  const { data: stats } = useApi<AssetStats>(() => assetsApi.stats())

  const assets = assetsData?.assets ?? []
  const total = stats?.total ?? 0
  const critical = stats?.by_criticality?.critical ?? 0
  const byType = stats?.by_type ?? {}
  const typeEntries = Object.entries(byType)
  const behind = stats?.by_patch_status?.behind ?? 0

  return (
    <div className="flex flex-col">
      <AppHeader title="Asset Inventory" />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Assets", value: total.toLocaleString(), icon: Cpu, color: "text-primary" },
            { label: "Critical Assets", value: critical.toString(), icon: Database, color: "text-destructive" },
            { label: "Behind on Patches", value: behind.toString(), icon: Server, color: "text-warning" },
            { label: "Asset Types", value: Object.keys(byType).length.toString(), icon: Globe, color: "text-success" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {typeEntries.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {typeEntries.slice(0, 4).map(([type, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <Card key={type} className="border-border bg-card">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{type}s</span>
                      <span className="text-xs font-semibold text-card-foreground">{count}</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              All Assets {total > 0 && `(${total})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assetsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading assets…</div>
            ) : assets.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No assets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Hostname", "IP", "Type", "OS", "Criticality", "Patch Status", "Open Vulns", "Last Scan", "Source"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a: Asset) => (
                      <tr key={a.asset_id} className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer">
                        <td className="px-4 py-3">
                          <Link href={`/assets/${a.asset_id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{a.hostname ?? a.asset_id}</Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{(a.ip ?? []).join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {typeIcon(a.type)}<span className="capitalize">{a.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-card-foreground">{a.os_version ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={critColor(a.criticality ?? "low")}>{a.criticality ?? "low"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold capitalize ${statusColor(a.patch_status ?? "unknown")}`}>{a.patch_status ?? "unknown"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs font-bold ${(a.open_vulnerabilities?.length ?? 0) > 5 ? "text-destructive" : (a.open_vulnerabilities?.length ?? 0) > 0 ? "text-warning" : "text-success"}`}>
                            {a.open_vulnerabilities?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {a.last_scan_at ? new Date(a.last_scan_at).toLocaleString() : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{a.source ?? "manual"}</Badge>
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
