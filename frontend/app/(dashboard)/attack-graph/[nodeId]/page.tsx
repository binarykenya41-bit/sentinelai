"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowRight, Server, Database, Container, Globe, Shield, AlertTriangle } from "lucide-react"

interface NodeDetail {
  id: string
  label: string
  type: "server" | "application" | "database" | "container"
  riskScore: number
  ip: string
  os: string
  services: string[]
  vulnerabilities: { cve: string; severity: string; status: string }[]
  attackPath: string
  inboundConnections: { from: string; relation: string }[]
  outboundConnections: { to: string; relation: string }[]
  mitigation: string[]
}

const nodes: Record<string, NodeDetail> = {
  n1: {
    id: "n1", label: "web-prod-01", type: "application", riskScore: 92, ip: "10.0.12.44",
    os: "Ubuntu 22.04 LTS", services: ["nginx 1.24.0", "OpenSSL 3.1.4", "Node.js 20.11"],
    vulnerabilities: [
      { cve: "CVE-2026-21001", severity: "Critical", status: "Unpatched" },
      { cve: "CVE-2026-12990", severity: "High", status: "Unpatched" },
    ],
    attackPath: "Internet -> WAF -> lb-prod-01 -> web-prod-01 (CVE-2026-21001) -> RCE -> root via kernel UAF",
    inboundConnections: [{ from: "lb-prod-01", relation: "Can Access" }],
    outboundConnections: [
      { to: "api-prod-03", relation: "Can Exploit" },
      { to: "k8s-node-07", relation: "Can Escalate" },
    ],
    mitigation: [
      "Apply OpenSSL 3.1.5 patch immediately",
      "Restrict TLS cipher suites to disable vulnerable handshake paths",
      "Deploy WAF rules for malformed ClientHello detection",
      "Rotate credentials accessible from this host",
    ],
  },
  n2: {
    id: "n2", label: "api-prod-03", type: "server", riskScore: 85, ip: "10.0.12.67",
    os: "Amazon Linux 2023", services: ["Java 17 (Spring Boot)", "log4j-core 2.17.1", "Tomcat 10.1"],
    vulnerabilities: [
      { cve: "CVE-2026-18823", severity: "High", status: "Unpatched" },
    ],
    attackPath: "web-prod-01 -> api-prod-03 (CVE-2026-18823) -> JNDI RCE as app-user",
    inboundConnections: [{ from: "web-prod-01", relation: "Can Exploit" }],
    outboundConnections: [
      { to: "db-prod-01", relation: "Can Escalate" },
      { to: "cache-prod-01", relation: "Can Exploit" },
    ],
    mitigation: [
      "Update log4j-core to 2.21.0",
      "Disable JNDI lookups in log4j configuration",
      "Implement egress filtering to block outbound LDAP connections",
    ],
  },
  n3: {
    id: "n3", label: "db-prod-01", type: "database", riskScore: 78, ip: "10.0.12.100",
    os: "Ubuntu 22.04 LTS", services: ["PostgreSQL 15.3", "pg_stat_statements"],
    vulnerabilities: [
      { cve: "CVE-2026-09871", severity: "Medium", status: "Verified" },
    ],
    attackPath: "api-prod-03 -> db-prod-01 (CVE-2026-09871) -> SQL injection to superuser",
    inboundConnections: [{ from: "api-prod-03", relation: "Can Escalate" }],
    outboundConnections: [],
    mitigation: [
      "Patch pg_stat_statements extension",
      "Restrict EVAL permissions to admin roles only",
      "Enable query parameterization enforcement",
    ],
  },
  n4: {
    id: "n4", label: "k8s-node-07", type: "container", riskScore: 88, ip: "10.0.12.107",
    os: "Flatcar Container Linux", services: ["containerd 1.7.2", "kubelet 1.28.3"],
    vulnerabilities: [
      { cve: "CVE-2026-08112", severity: "Critical", status: "Unpatched" },
    ],
    attackPath: "registry -> k8s-node-07 (CVE-2026-08112) -> Host FS write -> cron persistence",
    inboundConnections: [{ from: "web-prod-01", relation: "Can Escalate" }],
    outboundConnections: [],
    mitigation: [
      "Update containerd to 1.7.3",
      "Enable OCI image signature verification (cosign/sigstore)",
      "Deploy admission controller to block unsigned images",
      "Rotate kubeconfig and all service account tokens",
    ],
  },
  n5: {
    id: "n5", label: "cache-prod-01", type: "server", riskScore: 71, ip: "10.0.12.201",
    os: "Debian 12", services: ["Redis 7.0.11"],
    vulnerabilities: [
      { cve: "CVE-2026-06221", severity: "High", status: "Unpatched" },
    ],
    attackPath: "api-prod-03 -> cache-prod-01 (CVE-2026-06221) -> Lua sandbox escape -> OS cmd exec",
    inboundConnections: [{ from: "api-prod-03", relation: "Can Exploit" }],
    outboundConnections: [],
    mitigation: [
      "Upgrade Redis to 7.0.12",
      "Restrict EVAL to admin-only ACLs",
      "Implement network segmentation to block Redis -> DB access",
    ],
  },
  n6: {
    id: "n6", label: "lb-prod-01", type: "application", riskScore: 65, ip: "10.0.12.10",
    os: "Alpine Linux 3.18", services: ["nginx 1.24.0 (reverse proxy)"],
    vulnerabilities: [
      { cve: "CVE-2026-12990", severity: "High", status: "Unpatched" },
    ],
    attackPath: "Internet -> lb-prod-01 (CVE-2026-12990) -> DoS via H2 CONTINUATION flood",
    inboundConnections: [{ from: "Internet", relation: "Can Access" }],
    outboundConnections: [{ to: "web-prod-01", relation: "Can Access" }],
    mitigation: [
      "Apply nginx H2 CONTINUATION limit patch",
      "Set http2_max_concurrent_streams to 100",
      "Enable rate limiting at load balancer level",
    ],
  },
}

function NodeIcon({ type }: { type: string }) {
  switch (type) {
    case "server": return <Server className="h-5 w-5" />
    case "application": return <Globe className="h-5 w-5" />
    case "database": return <Database className="h-5 w-5" />
    case "container": return <Container className="h-5 w-5" />
    default: return <Server className="h-5 w-5" />
  }
}

function riskColor(score: number) {
  if (score >= 85) return "text-destructive"
  if (score >= 70) return "text-warning"
  return "text-chart-1"
}

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/10 text-warning border-warning/20",
    Medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  }
  return map[severity] ?? "bg-muted text-muted-foreground border-border"
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Unpatched: "bg-destructive/10 text-destructive border-destructive/20",
    Patched: "bg-warning/10 text-warning border-warning/20",
    Verified: "bg-success/10 text-success border-success/20",
  }
  return map[status] ?? ""
}

function relationBadge(rel: string) {
  switch (rel) {
    case "Can Exploit": return "bg-destructive/10 text-destructive border-destructive/20"
    case "Can Escalate": return "bg-warning/10 text-warning border-warning/20"
    default: return "bg-chart-1/10 text-chart-1 border-chart-1/20"
  }
}

export default function AttackNodeDetailPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = use(params)
  const node = nodes[nodeId]

  if (!node) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Node Detail" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Node not found: {nodeId}</p>
          <Link href="/attack-graph">
            <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Attack Graph
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={`Node: ${node.label}`} />
      <div className="flex flex-col gap-6 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/attack-graph" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Attack Graph
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold text-card-foreground">{node.label}</span>
        </div>

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-5">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-secondary ${riskColor(node.riskScore)}`}>
                <NodeIcon type={node.type} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-card-foreground">{node.label}</span>
                  <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border uppercase text-[10px]">{node.type}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>IP: <span className="font-mono text-card-foreground">{node.ip}</span></span>
                  <span>OS: <span className="text-card-foreground">{node.os}</span></span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Risk Score</span>
              <span className={`font-mono text-3xl font-bold ${riskColor(node.riskScore)}`}>{node.riskScore}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Attack Path */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most Likely Attack Path</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {node.attackPath.split(" -> ").map((step, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`rounded-md border px-2.5 py-1 font-mono text-xs ${
                        i === arr.length - 1 ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-secondary text-card-foreground"
                      }`}>
                        {step}
                      </span>
                      {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vulnerabilities on this node */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">CVE</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {node.vulnerabilities.map((v) => (
                      <tr key={v.cve} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">{v.cve}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className={severityBadge(v.severity)}>{v.severity}</Badge></td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className={statusBadge(v.status)}>{v.status}</Badge></td>
                        <td className="px-4 py-2.5">
                          <Link href={`/vulnerabilities/${encodeURIComponent(v.cve)}`}>
                            <Button variant="outline" size="sm" className="h-6 border-border bg-secondary text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                              View Detail
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Connections */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Connections</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inbound</h4>
                  <div className="flex flex-col gap-1.5">
                    {node.inboundConnections.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 p-2.5">
                        <span className="font-mono text-xs text-card-foreground">{c.from}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className={relationBadge(c.relation)}>{c.relation}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs font-semibold text-primary">{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {node.outboundConnections.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Outbound</h4>
                    <div className="flex flex-col gap-1.5">
                      {node.outboundConnections.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 p-2.5">
                          <span className="font-mono text-xs font-semibold text-primary">{node.label}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className={relationBadge(c.relation)}>{c.relation}</Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs text-card-foreground">{c.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Services */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Running Services</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {node.services.map((s) => (
                  <div key={s} className="rounded-md border border-border bg-secondary/50 px-3 py-2">
                    <span className="font-mono text-xs text-card-foreground">{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Mitigation */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended Mitigations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {node.mitigation.map((m, i) => (
                  <div key={i} className="flex gap-2 rounded-md border border-border bg-background p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 font-mono text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-card-foreground">{m}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
