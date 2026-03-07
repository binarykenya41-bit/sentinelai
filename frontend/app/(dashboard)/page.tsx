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
import {
  ScanLine, Plus, FileBarChart2, CheckCircle, Circle, XCircle,
  Cpu, Cloud, Container, Monitor, Wifi, Server, Activity,
  AlertTriangle, TrendingUp, Shield, Network, Clock,
} from "lucide-react"
import { toast } from "sonner"

const integrationStatus = [
  { name: "Splunk SIEM", status: "Connected", type: "SIEM", lastSync: "2m ago" },
  { name: "AWS Security Hub", status: "Connected", type: "Cloud", lastSync: "5m ago" },
  { name: "Cisco DNA Center", status: "Connected", type: "Network", lastSync: "1m ago" },
  { name: "Jamf MDM", status: "Connected", type: "Endpoint", lastSync: "8m ago" },
  { name: "Zabbix Monitor", status: "Warning", type: "Monitoring", lastSync: "15m ago" },
  { name: "FortiManager", status: "Disconnected", type: "Network", lastSync: "2h ago" },
]

const digitalTwinStats = [
  { label: "Cloud VMs", count: 142, icon: Cloud, color: "text-chart-2" },
  { label: "Network Devices", count: 38, icon: Wifi, color: "text-chart-1" },
  { label: "Endpoints", count: 897, icon: Monitor, color: "text-primary" },
  { label: "Containers", count: 214, icon: Container, color: "text-chart-3" },
  { label: "Databases", count: 29, icon: Server, color: "text-warning" },
  { label: "Applications", count: 67, icon: Cpu, color: "text-success" },
]

const complianceFrameworks = [
  { name: "ISO 27001", score: 72, passing: 18, total: 25 },
  { name: "SOC 2", score: 61, passing: 11, total: 18 },
  { name: "NIST CSF", score: 68, passing: 34, total: 50 },
  { name: "PCI DSS", score: 55, passing: 17, total: 31 },
]

const recentActivity = [
  { time: "02:18 UTC", event: "Exploit simulation SIM-001 completed — RCE confirmed on web-prod-01", type: "exploit" },
  { time: "02:14 UTC", event: "Vulnerability scan completed — 12 critical findings across 1,284 assets", type: "scan" },
  { time: "02:10 UTC", event: "Patch PR opened for CVE-2026-21001 (OpenSSL 3.1.5)", type: "patch" },
  { time: "01:58 UTC", event: "New CVE ingested: CVE-2026-21004 (Critical, CVSS 9.1)", type: "threat" },
  { time: "01:45 UTC", event: "Splunk SIEM: 847 security events processed in last hour", type: "monitoring" },
  { time: "01:30 UTC", event: "Compliance check: ISO 27001 A.8.8 control status updated — Failing", type: "compliance" },
  { time: "01:15 UTC", event: "Digital twin sync: 1,387 infrastructure nodes updated", type: "sync" },
]

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

export default function DashboardPage() {
  const [scanning, setScanning] = useState(false)

  const handleScanNow = () => {
    setScanning(true)
    toast.loading("Initiating vulnerability scan across all assets...", { duration: 2500 })
    setTimeout(() => {
      toast.success("Scan queued — 1,284 assets targeted")
      setScanning(false)
    }, 2600)
  }

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
              <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20">1,387 Nodes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
              {digitalTwinStats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/50 p-3 text-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className={`text-xl font-bold ${stat.color}`}>{stat.count}</span>
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
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
              {complianceFrameworks.map((fw) => (
                <div key={fw.name} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-card-foreground">{fw.name}</span>
                  <Progress value={fw.score} className="h-1.5 flex-1 bg-secondary [&>div]:bg-primary" />
                  <span className="font-mono text-xs text-muted-foreground">{fw.passing}/{fw.total}</span>
                  <span className={`font-mono text-xs font-bold ${fw.score >= 70 ? "text-success" : fw.score >= 55 ? "text-warning" : "text-destructive"}`}>{fw.score}%</span>
                </div>
              ))}
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
              {integrationStatus.map((int) => (
                <div key={int.name} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {integrationStatusIcon(int.status)}
                    <span className="text-xs font-medium text-card-foreground">{int.name}</span>
                    <Badge variant="outline" className="border-border bg-secondary text-muted-foreground text-[10px]">{int.type}</Badge>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {int.lastSync}
                  </span>
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
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-border/50 py-2.5 last:border-0">
                <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground pt-0.5">{item.time}</span>
                <div className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-primary" />
                <span className={`text-xs ${activityColor(item.type)}`}>{item.event}</span>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
