"use client"

import { useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { SecurityScore } from "@/components/dashboard/security-score"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { ExploitTimeline } from "@/components/dashboard/exploit-timeline"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ScanLine, Plus, FileBarChart2, CheckCircle, Circle, XCircle,
  Cpu, Cloud, Container, Monitor, Wifi, Server, Activity,
  AlertTriangle, TrendingUp, Shield, Network, Clock,
} from "lucide-react"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { dashboardApi, assetsApi, integrationsApi, type ComplianceOverview, type ActivityEntry } from "@/lib/api-client"

const FALLBACK_COMPLIANCE: ComplianceOverview[] = []
const FALLBACK_ACTIVITY: ActivityEntry[] = []

function activityColor(type: string) {
  switch (type) {
    case "exploit": return "text-destructive"
    case "scan": return "text-primary"
    case "patch": return "text-success"
    case "threat": return "text-warning"
    case "compliance": return "text-chart-1"
    default: return "text-muted-foreground"
  }
}

function integrationStatusIcon(status: string) {
  switch (status) {
    case "Connected": return <CheckCircle className="h-3.5 w-3.5 text-success" />
    case "Warning": return <AlertTriangle className="h-3.5 w-3.5 text-warning" />
    case "Disconnected": return <XCircle className="h-3.5 w-3.5 text-destructive" />
    default: return <Circle className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function activityEventLabel(action: string) {
  const map: Record<string, string> = {
    exploit_simulation_completed: "Exploit simulation completed",
    cve_sync_completed: "CVE sync completed",
    patch_pr_created: "Patch PR created",
    vulnerability_escalated: "Vulnerability escalated",
    integration_connected: "Integration connected",
    asset_sync_completed: "Asset sync completed",
    compliance_report_generated: "Compliance report generated",
    threat_feed_updated: "Threat feed updated",
    vulnerability_status_updated: "Vulnerability status updated",
  }
  return map[action] ?? action.replace(/_/g, " ")
}

function activityEventType(action: string) {
  if (action.includes("exploit") || action.includes("simulation")) return "exploit"
  if (action.includes("patch")) return "patch"
  if (action.includes("cve") || action.includes("threat") || action.includes("vuln")) return "threat"
  if (action.includes("compliance")) return "compliance"
  if (action.includes("sync") || action.includes("integration") || action.includes("asset")) return "monitoring"
  return "scan"
}

export default function DashboardPage() {
  const [scanning, setScanning] = useState(false)

  const { data: compliance, loading: compLoading } = useApi(() => dashboardApi.compliance(), [])
  const { data: activity, loading: actLoading } = useApi(() => dashboardApi.activity(10), [])
  const { data: assetStats, loading: assetsLoading } = useApi(() => assetsApi.stats(), [])
  const { data: integrationStatus, loading: intLoading } = useApi(() => integrationsApi.status(), [])

  const complianceData: ComplianceOverview[] = compliance ?? FALLBACK_COMPLIANCE
  const activityData: ActivityEntry[] = activity ?? FALLBACK_ACTIVITY

  const handleScanNow = () => {
    setScanning(true)
    toast.loading("Initiating vulnerability scan across all assets...", { duration: 2500 })
    setTimeout(() => {
      toast.success(`Scan queued — ${assetStats?.total ?? 50} assets targeted`)
      setScanning(false)
    }, 2600)
  }

  const byType = assetStats?.by_type ?? {}
  const digitalTwinItems = [
    { label: "Cloud Resources", count: (byType["cloud_resource"] ?? 0) + (byType["server"] ?? 0), icon: Cloud, color: "text-chart-2" },
    { label: "Network Devices", count: byType["network_device"] ?? 0, icon: Wifi, color: "text-chart-1" },
    { label: "Endpoints", count: byType["endpoint"] ?? 0, icon: Monitor, color: "text-primary" },
    { label: "Containers", count: byType["container"] ?? 0, icon: Container, color: "text-chart-3" },
    { label: "Databases", count: byType["database"] ?? 0, icon: Server, color: "text-warning" },
    { label: "Total Assets", count: assetStats?.total ?? 0, icon: Cpu, color: "text-success" },
  ]

  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">

        {/* Quick Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-card-foreground">System Operational</span>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">Live</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/incident-response">
              <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Incident
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
              onClick={handleScanNow}
              disabled={scanning}
            >
              <ScanLine className="mr-1.5 h-3.5 w-3.5" />
              {scanning ? "Scanning..." : "Run Scan Now"}
            </Button>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <FileBarChart2 className="mr-1.5 h-3.5 w-3.5" />
                Generate Report
              </Button>
            </Link>
          </div>
        </div>

        <SecurityScore />
        <KpiCards />

        {/* Digital Twin Stats */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Digital Twin Infrastructure Model
              </CardTitle>
              <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20">
                {assetStats?.total ?? "…"} Nodes
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {assetsLoading
              ? <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">{[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
              : (
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                  {digitalTwinItems.map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/50 p-3 text-center">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className={`text-xl font-bold ${stat.color}`}>{stat.count}</span>
                      <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ExploitTimeline />
          </div>
          <div className="lg:col-span-2">
            <RecentAlerts />
          </div>
        </div>

        {/* Compliance & Integrations row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Compliance Summary */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compliance Overview</CardTitle>
                </div>
                <Link href="/compliance">
                  <Button variant="outline" size="sm" className="h-6 border-border bg-secondary text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {compLoading
                ? [0,1,2,3].map((i) => <Skeleton key={i} className="h-5 w-full" />)
                : complianceData.map((fw) => {
                  const name = fw.framework.toUpperCase().replace("ISO27001","ISO 27001").replace("SOC2","SOC 2").replace("PCIDSS","PCI DSS")
                  return (
                    <div key={fw.framework} className="flex items-center gap-3">
                      <span className="w-20 text-xs font-medium text-card-foreground">{name}</span>
                      <Progress value={fw.score} className="h-1.5 flex-1 bg-secondary [&>div]:bg-primary" />
                      <span className="font-mono text-xs text-muted-foreground">{fw.passing}/{fw.total_controls}</span>
                      <span className={`font-mono text-xs font-bold ${fw.score >= 70 ? "text-success" : fw.score >= 55 ? "text-warning" : "text-destructive"}`}>{fw.score}%</span>
                    </div>
                  )
                })
              }
            </CardContent>
          </Card>

          {/* API Integration Status */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">API Integration Status</CardTitle>
                </div>
                <Link href="/integrations">
                  <Button variant="outline" size="sm" className="h-6 border-border bg-secondary text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {intLoading
                ? [0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)
                : (integrationStatus ?? []).map((int) => (
                <div key={int.service_id} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {integrationStatusIcon(int.status)}
                    <span className="text-xs font-medium text-card-foreground">{int.name}</span>
                    <Badge variant="outline" className="border-border bg-secondary text-muted-foreground text-[10px]">{int.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {int.vuln_count > 0 && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">
                        {int.vuln_count} CVEs
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {int.lastSync}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Real-time Activity Feed */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Real-Time Activity Feed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            {actLoading
              ? [0,1,2,3,4].map((i) => <Skeleton key={i} className="h-8 w-full my-1" />)
              : activityData.map((item) => {
                const type = activityEventType(item.action)
                const timeStr = new Date(item.logged_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
                const payload = item.payload as Record<string, unknown> | null
                const detail = payload
                  ? Object.entries(payload).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ")
                  : ""
                return (
                  <div key={item.log_id} className="flex items-start gap-4 border-b border-border/50 py-2.5 last:border-0">
                    <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground pt-0.5">{timeStr}</span>
                    <div className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs ${activityColor(type)}`}>{activityEventLabel(item.action)}</span>
                      {detail && <span className="text-[10px] text-muted-foreground">{detail}</span>}
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{item.actor}</span>
                  </div>
                )
              })
            }
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
