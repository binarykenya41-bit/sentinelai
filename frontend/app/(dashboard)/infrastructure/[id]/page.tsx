import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Server, Wifi, Settings, Shield, AlertTriangle, Globe, ArrowRight, CheckCircle, XCircle, Clock, Edit, ExternalLink } from "lucide-react"
import Link from "next/link"

// In production this would be fetched by ID
const node = {
  id: "INF-001",
  name: "prod-web-cluster",
  type: "Cloud VM",
  env: "Production",
  criticality: "Critical",
  status: "Online",
  source: "AWS",
  lastSeen: "2026-03-07 01:00 UTC",
  addedAt: "2025-11-14 09:30 UTC",
  network: {
    ip: "10.0.1.10",
    hostname: "prod-web-01.internal",
    mac: "0A:1B:2C:3D:4E:5F",
    vlan: "VLAN-100 / 10.0.1.0/24",
    openPorts: ["80", "443", "8080"],
    protocols: ["TCP", "HTTPS", "HTTP"],
  },
  system: {
    os: "Ubuntu 22.04 LTS",
    osVersion: "22.04.3",
    containerPlatform: "Docker 24.0.6",
    apps: [
      { name: "nginx", version: "1.24.0" },
      { name: "node", version: "20.10.0" },
      { name: "openssl", version: "3.0.2" },
    ],
  },
  security: {
    firewallPresent: true,
    firewallType: "iptables + AWS Security Group",
    edrInstalled: true,
    edrProduct: "CrowdStrike Falcon 6.47",
    avInstalled: false,
    authType: "IAM Role (AWS)",
    encryption: "TLS 1.3, AES-256-GCM",
  },
  patch: {
    status: "Current",
    lastPatchDate: "2026-02-28",
    patchSource: "AWS Systems Manager",
    cves: ["CVE-2024-1234", "CVE-2024-5678", "CVE-2025-0012"],
    highestSeverity: "High",
  },
  integration: {
    tool: "AWS",
    endpoint: "https://ec2.eu-west-1.amazonaws.com",
    authMethod: "AWS IAM Role",
    logSource: "CloudWatch Logs / 10.0.5.8:514",
  },
  relationships: [
    { to: "INF-003", name: "core-firewall-01", type: "can_access", direction: "inbound" },
    { to: "INF-002", name: "prod-db-primary", type: "can_access", direction: "outbound" },
    { to: "INF-005", name: "k8s-worker-pool", type: "can_access", direction: "outbound" },
    { to: "INF-008", name: "identity-dc-01", type: "trusts", direction: "outbound" },
    { to: "INF-007", name: "monitoring-stack", type: "depends_on", direction: "inbound" },
  ],
  events: [
    { time: "2026-03-07 01:00 UTC", event: "Discovery sync — 3 apps updated", type: "info" },
    { time: "2026-03-06 23:45 UTC", event: "CVE-2025-0012 linked by TI pipeline", type: "warning" },
    { time: "2026-03-06 22:00 UTC", event: "Exploit simulation SBX-001 completed — Patch Passed", type: "success" },
    { time: "2026-03-05 10:00 UTC", event: "Patch applied via AWS SSM: kernel 5.15.0-92", type: "success" },
    { time: "2026-02-28 14:30 UTC", event: "Last full patch cycle completed", type: "success" },
  ],
}

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const relBadge = (type: string) => {
  if (type === "can_access") return "bg-primary/10 text-primary border-primary/20"
  if (type === "can_exploit") return "bg-destructive/10 text-destructive border-destructive/20"
  if (type === "trusts") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

const eventIcon = (type: string) => {
  if (type === "success") return <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
  if (type === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
}

export default function InfrastructureNodePage() {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Infrastructure — ${node.name}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Server className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-card-foreground font-mono">{node.name}</h2>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{node.type}</Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{node.criticality}</Badge>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">{node.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{node.id} · {node.env} · Source: {node.source} · Last seen: {node.lastSeen}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/sandbox">
              <Button variant="outline" className="border-border text-xs h-7 px-3 gap-1.5">
                <ExternalLink className="h-3 w-3" /> Clone to Sandbox
              </Button>
            </Link>
            <Button variant="outline" className="border-border text-xs h-7 px-3 gap-1.5">
              <Edit className="h-3 w-3" /> Edit Node
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Network Details */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Network</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {[
                { label: "IP Address", value: node.network.ip },
                { label: "Hostname", value: node.network.hostname },
                { label: "MAC Address", value: node.network.mac },
                { label: "VLAN / Segment", value: node.network.vlan },
                { label: "Open Ports", value: node.network.openPorts.join(", ") },
                { label: "Protocols", value: node.network.protocols.join(", ") },
              ].map(row => (
                <div key={row.label} className="flex flex-col border-b border-border last:border-0 pb-1.5 last:pb-0">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.label}</span>
                  <span className="font-mono text-xs text-card-foreground">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {[
                { label: "Operating System", value: node.system.os },
                { label: "OS Version", value: node.system.osVersion },
                { label: "Container Platform", value: node.system.containerPlatform },
              ].map(row => (
                <div key={row.label} className="flex flex-col border-b border-border pb-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.label}</span>
                  <span className="font-mono text-xs text-card-foreground">{row.value}</span>
                </div>
              ))}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Installed Applications</span>
                {node.system.apps.map(app => (
                  <div key={app.name} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-card-foreground">{app.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{app.version}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Configuration */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {[
                { label: "Firewall", value: node.security.firewallPresent ? node.security.firewallType : "None", ok: node.security.firewallPresent },
                { label: "EDR Agent", value: node.security.edrInstalled ? node.security.edrProduct : "Not installed", ok: node.security.edrInstalled },
                { label: "Antivirus", value: node.security.avInstalled ? "Installed" : "Not installed", ok: node.security.avInstalled },
                { label: "Authentication", value: node.security.authType, ok: true },
                { label: "Encryption", value: node.security.encryption, ok: true },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-2 border-b border-border last:border-0 pb-1.5 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.label}</span>
                    <span className="font-mono text-xs text-card-foreground truncate">{row.value}</span>
                  </div>
                  {row.ok
                    ? <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-2" />
                    : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-2" />
                  }
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Patch & Vuln status */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Patch & Vulnerabilities</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Patch Status</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">{node.patch.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Patched</span>
                <span className="font-mono text-xs text-card-foreground">{node.patch.lastPatchDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Patch Source</span>
                <span className="text-xs text-card-foreground">{node.patch.patchSource}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Highest CVE</span>
                <Badge variant="outline" className={sevBadge(node.patch.highestSeverity)}>{node.patch.highestSeverity}</Badge>
              </div>
              <div className="flex flex-col gap-1 pt-1 border-t border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Linked CVEs</span>
                {node.patch.cves.map(cve => (
                  <Link key={cve} href={`/vulnerabilities/${cve}`} className="font-mono text-xs text-primary hover:underline">{cve}</Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Integration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {[
                { label: "Management Tool", value: node.integration.tool },
                { label: "API Endpoint", value: node.integration.endpoint },
                { label: "Auth Method", value: node.integration.authMethod },
                { label: "Log Source", value: node.integration.logSource },
              ].map(row => (
                <div key={row.label} className="flex flex-col border-b border-border last:border-0 pb-1.5 last:pb-0">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.label}</span>
                  <span className="font-mono text-xs text-card-foreground break-all">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Relationships */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Relationships</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {node.relationships.map((rel) => (
                <div key={rel.to + rel.type} className="flex items-center gap-2 border-b border-border last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {rel.direction === "inbound"
                      ? <ArrowRight className="h-3 w-3 text-muted-foreground rotate-180 shrink-0" />
                      : <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    }
                    <Link href={`/infrastructure/${rel.to}`} className="font-mono text-xs text-primary hover:underline truncate">{rel.name}</Link>
                  </div>
                  <Badge variant="outline" className={relBadge(rel.type)}>{rel.type}</Badge>
                </div>
              ))}
              <Link href="/attack-graph">
                <Button variant="outline" className="w-full border-border text-xs mt-2 h-7">View in Attack Graph</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Event Timeline */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Node Event Timeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-4">
            {node.events.map((evt, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-border last:border-0 py-2">
                {eventIcon(evt.type)}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-card-foreground">{evt.event}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{evt.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
