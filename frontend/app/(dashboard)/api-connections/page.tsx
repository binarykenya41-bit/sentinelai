"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Globe, Plus, RefreshCw, Trash2, CheckCircle2, XCircle, Wifi, Monitor, Server, Shield, Cloud, Activity } from "lucide-react"

type Connection = {
  id: string
  name: string
  platform: string
  category: string
  endpoint: string
  status: "Connected" | "Error" | "Pending"
  lastSync: string
  nodesDiscovered: number
  dataTypes: string[]
}

const initialConnections: Connection[] = [
  { id: "CON-001", name: "Ivanti Neurons — Corp Endpoints", platform: "Ivanti", category: "Endpoint Management", endpoint: "https://ivanti.corp.internal/api/v2", status: "Connected", lastSync: "2026-03-07 01:00 UTC", nodesDiscovered: 124, dataTypes: ["Inventory", "Patch Status", "Installed Software"] },
  { id: "CON-002", name: "Cisco DNA Center — Core Network", platform: "Cisco DNA Center", category: "Network Infrastructure", endpoint: "https://dnac.corp.internal/api/v1", status: "Connected", lastSync: "2026-03-07 00:55 UTC", nodesDiscovered: 47, dataTypes: ["Network Topology", "Device Config", "Open Ports"] },
  { id: "CON-003", name: "FortiManager — Perimeter FW", platform: "FortiManager", category: "Network Infrastructure", endpoint: "https://fortimanager.corp.internal/jsonrpc", status: "Connected", lastSync: "2026-03-07 00:50 UTC", nodesDiscovered: 12, dataTypes: ["Firewall Rules", "Device Config", "Security Events"] },
  { id: "CON-004", name: "SCCM — Windows Fleet", platform: "SCCM", category: "Endpoint Management", endpoint: "https://sccm.corp.internal/AdminService/v1.0", status: "Connected", lastSync: "2026-03-07 01:00 UTC", nodesDiscovered: 38, dataTypes: ["Inventory", "Patch Status", "Software Versions"] },
  { id: "CON-005", name: "Zabbix — Infrastructure Monitor", platform: "Zabbix", category: "Monitoring", endpoint: "https://zabbix.corp.internal/api_jsonrpc.php", status: "Error", lastSync: "2026-03-06 18:00 UTC", nodesDiscovered: 25, dataTypes: ["System Logs", "Performance Metrics", "Alerts"] },
  { id: "CON-006", name: "Splunk — SIEM Production", platform: "Splunk", category: "SIEM", endpoint: "https://splunk.corp.internal:8089", status: "Connected", lastSync: "2026-03-07 01:05 UTC", nodesDiscovered: 0, dataTypes: ["Security Events", "System Logs", "Vulnerability Reports"] },
  { id: "CON-007", name: "AWS — Production Account", platform: "AWS", category: "Cloud Provider", endpoint: "https://ec2.eu-west-1.amazonaws.com", status: "Connected", lastSync: "2026-03-07 01:00 UTC", nodesDiscovered: 89, dataTypes: ["Infrastructure Inventory", "Network Topology", "Security Events"] },
  { id: "CON-008", name: "Jamf — macOS Fleet", platform: "Jamf", category: "Endpoint Management", endpoint: "https://corp.jamfcloud.com/uapi", status: "Pending", lastSync: "—", nodesDiscovered: 0, dataTypes: ["Inventory", "Patch Status", "Installed Software"] },
]

const availablePlatforms = [
  { name: "Ivanti", category: "Endpoint Management", icon: Monitor, description: "Endpoint inventory, patch status, and installed software via REST API" },
  { name: "SCCM", category: "Endpoint Management", icon: Monitor, description: "Windows fleet inventory, software deployment, and patch compliance" },
  { name: "Jamf", category: "Endpoint Management", icon: Monitor, description: "macOS and iOS device inventory, profiles, and patch management" },
  { name: "Kaseya", category: "Endpoint Management", icon: Monitor, description: "RMM platform — agent telemetry, patch status, and remote management" },
  { name: "PDQ Deploy", category: "Endpoint Management", icon: Monitor, description: "Software deployment and patch status across Windows endpoints" },
  { name: "Cisco DNA Center", category: "Network Infrastructure", icon: Wifi, description: "Network topology, device configuration, and intent-based networking" },
  { name: "FortiManager", category: "Network Infrastructure", icon: Shield, description: "FortiGate firewall configuration, policy management, and security events" },
  { name: "Juniper APIs", category: "Network Infrastructure", icon: Wifi, description: "Network device configuration and topology via Junos REST API" },
  { name: "Zabbix", category: "Monitoring", icon: Activity, description: "Infrastructure monitoring — metrics, logs, and host inventory" },
  { name: "Nagios", category: "Monitoring", icon: Activity, description: "Network and host monitoring, service checks, and alert stream" },
  { name: "PRTG", category: "Monitoring", icon: Activity, description: "Network monitoring with bandwidth, availability, and device data" },
  { name: "Splunk", category: "SIEM", icon: Server, description: "Security events, system logs, and vulnerability report ingestion" },
  { name: "ELK Stack", category: "SIEM", icon: Server, description: "Elasticsearch-based log aggregation and security event correlation" },
  { name: "Graylog", category: "SIEM", icon: Server, description: "Syslog stream ingestion and security event management" },
  { name: "AWS", category: "Cloud Provider", icon: Cloud, description: "EC2, RDS, Lambda inventory, VPC topology, and Security Hub events" },
  { name: "Azure", category: "Cloud Provider", icon: Cloud, description: "Azure resource inventory, Defender signals, and Entra ID data" },
  { name: "Google Cloud", category: "Cloud Provider", icon: Cloud, description: "GCP resource inventory, Security Command Center, and IAM data" },
]

const dataFlow = [
  { step: "External Tools", desc: "Ivanti · SCCM · Cisco DNA · Zabbix · Splunk · AWS" },
  { step: "API Integration Layer", desc: "REST · Syslog · Agent Telemetry" },
  { step: "Data Normalization Engine", desc: "Deduplication · Schema mapping · Enrichment" },
  { step: "Sentinel Infrastructure Database", desc: "Live asset inventory · Digital twin model" },
]

const categoryColors: Record<string, string> = {
  "Endpoint Management": "bg-primary/10 text-primary border-primary/20",
  "Network Infrastructure": "bg-warning/10 text-warning border-warning/20",
  "Monitoring": "bg-success/10 text-success border-success/20",
  "SIEM": "bg-destructive/10 text-destructive border-destructive/20",
  "Cloud Provider": "bg-muted text-muted-foreground border-border",
}

const statusBadge = (s: Connection["status"]) => {
  if (s === "Connected") return "bg-success/10 text-success border-success/20"
  if (s === "Error") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-warning/10 text-warning border-warning/20"
}

const categories = ["All", "Endpoint Management", "Network Infrastructure", "Monitoring", "SIEM", "Cloud Provider"]

export default function APIConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [filter, setFilter] = useState("All")

  const filtered = filter === "All" ? connections : connections.filter(c => c.category === filter)

  return (
    <div className="flex flex-col">
      <AppHeader title="API Connections" />
      <div className="flex flex-col gap-6 p-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Connections", value: String(connections.length), color: "text-primary" },
            { label: "Connected", value: String(connections.filter(c => c.status === "Connected").length), color: "text-success" },
            { label: "Errors", value: String(connections.filter(c => c.status === "Error").length), color: "text-destructive" },
            { label: "Nodes Discovered", value: String(connections.reduce((a, c) => a + c.nodesDiscovered, 0)), color: "text-primary" },
          ].map(stat => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Flow */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Data Flow Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-0">
              {dataFlow.map((step, i) => (
                <div key={step.step} className="flex items-center gap-0 flex-1">
                  <div className="flex flex-col gap-1 flex-1 p-3 border border-border bg-secondary/30">
                    <span className="text-xs font-semibold text-card-foreground">{step.step}</span>
                    <span className="text-[10px] text-muted-foreground leading-snug">{step.desc}</span>
                  </div>
                  {i < dataFlow.length - 1 && (
                    <div className="text-muted-foreground px-1 shrink-0 text-sm font-bold">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Active Connections */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-[2%] border transition-colors ${filter === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Connections</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4">
                {filtered.map((conn) => (
                  <div key={conn.id} className="border border-border p-4 flex flex-col gap-2 rounded-[2%]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-card-foreground">{conn.name}</span>
                          <Badge variant="outline" className={categoryColors[conn.category]}>{conn.category}</Badge>
                          <Badge variant="outline" className={statusBadge(conn.status)}>{conn.status}</Badge>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground break-all">{conn.endpoint}</span>
                        <span className="text-[10px] text-muted-foreground">Last sync: {conn.lastSync} · {conn.nodesDiscovered} nodes discovered</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="text-muted-foreground hover:text-primary transition-colors" title="Sync now">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button className="text-muted-foreground hover:text-destructive transition-colors" title="Remove" onClick={() => setConnections(prev => prev.filter(c => c.id !== conn.id))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {conn.dataTypes.map(dt => (
                        <Badge key={dt} variant="outline" className="border-border text-muted-foreground text-[10px]">{dt}</Badge>
                      ))}
                    </div>
                    {conn.status === "Error" && (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Connection failed — check API endpoint or credentials
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Add Connection */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add Connection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 overflow-y-auto max-h-[600px]">
              {availablePlatforms.map((p) => {
                const Icon = p.icon
                const alreadyConnected = connections.some(c => c.platform === p.name)
                return (
                  <button
                    key={p.name}
                    disabled={alreadyConnected}
                    className={`border border-border p-3 text-left transition-all flex flex-col gap-1 rounded-[2%] ${alreadyConnected ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary/50 hover:border-primary/40"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold text-card-foreground">{p.name}</span>
                      </div>
                      {alreadyConnected
                        ? <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        : <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
                      }
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">{p.description}</p>
                    <Badge variant="outline" className={`w-fit text-[9px] ${categoryColors[p.category]}`}>{p.category}</Badge>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
