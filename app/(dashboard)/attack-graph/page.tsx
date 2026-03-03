"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Server, Database, Container, Globe, ArrowRight } from "lucide-react"

interface GraphNode {
  id: string
  label: string
  type: "server" | "application" | "database" | "container"
  riskScore: number
  attackPath: string
  mitigation: string
}

const nodes: GraphNode[] = [
  { id: "n1", label: "web-prod-01", type: "application", riskScore: 92, attackPath: "Internet -> WAF -> web-prod-01 (CVE-2026-21001) -> RCE", mitigation: "Apply OpenSSL patch, restrict TLS cipher suites" },
  { id: "n2", label: "api-prod-03", type: "server", riskScore: 85, attackPath: "web-prod-01 -> api-prod-03 (CVE-2026-18823) -> JNDI RCE", mitigation: "Update log4j-core, disable JNDI lookups" },
  { id: "n3", label: "db-prod-01", type: "database", riskScore: 78, attackPath: "api-prod-03 -> db-prod-01 (CVE-2026-09871) -> SQL injection to superuser", mitigation: "Patch pg_stat_statements, restrict EVAL permissions" },
  { id: "n4", label: "k8s-node-07", type: "container", riskScore: 88, attackPath: "registry -> k8s-node-07 (CVE-2026-08112) -> Host escape", mitigation: "Update containerd, enable image verification" },
  { id: "n5", label: "cache-prod-01", type: "server", riskScore: 71, attackPath: "api-prod-03 -> cache-prod-01 (CVE-2026-06221) -> Lua sandbox escape", mitigation: "Update Redis, disable EVAL for non-admin users" },
  { id: "n6", label: "lb-prod-01", type: "application", riskScore: 65, attackPath: "Internet -> lb-prod-01 (CVE-2026-12990) -> DoS via H2 CONTINUATION flood", mitigation: "Apply nginx patch, set H2 continuation limits" },
]

const attackChain = [
  { from: "Internet", to: "lb-prod-01", relation: "Can Access" },
  { from: "lb-prod-01", to: "web-prod-01", relation: "Can Access" },
  { from: "web-prod-01", to: "api-prod-03", relation: "Can Exploit" },
  { from: "api-prod-03", to: "db-prod-01", relation: "Can Escalate" },
  { from: "api-prod-03", to: "cache-prod-01", relation: "Can Exploit" },
  { from: "web-prod-01", to: "k8s-node-07", relation: "Can Escalate" },
]

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

function relationColor(rel: string) {
  switch (rel) {
    case "Can Exploit": return "bg-destructive/10 text-destructive border-destructive/20"
    case "Can Escalate": return "bg-warning/10 text-warning border-warning/20"
    default: return "bg-chart-1/10 text-chart-1 border-chart-1/20"
  }
}

export default function AttackGraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  return (
    <div className="flex flex-col">
      <AppHeader title="Attack Graph" />
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Shortest path to critical asset */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Shortest Path to Critical Asset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {attackChain.slice(0, 4).map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-card-foreground">
                      {step.from}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`text-[10px] ${relationColor(step.relation)}`}>
                        {step.relation}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {i === 3 && (
                      <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-xs text-destructive">
                        {step.to}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network graph nodes */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Network Topology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedNode?.id === node.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card ${riskColor(node.riskScore)}`}>
                      <NodeIcon type={node.type} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-semibold text-card-foreground">{node.label}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{node.type}</span>
                      <span className={`font-mono text-xs font-bold ${riskColor(node.riskScore)}`}>
                        Risk: {node.riskScore}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attack chain table */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Attack Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relationship</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {attackChain.map((edge, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-card-foreground">{edge.from}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={relationColor(edge.relation)}>{edge.relation}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-card-foreground">{edge.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {selectedNode && (
          <div className="w-80 shrink-0 border-l border-border bg-card p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${riskColor(selectedNode.riskScore)}`}>
                  <NodeIcon type={selectedNode.type} />
                </div>
                <div>
                  <span className="font-mono text-sm font-semibold text-card-foreground">{selectedNode.label}</span>
                  <p className="text-[10px] uppercase text-muted-foreground">{selectedNode.type}</p>
                </div>
              </div>
              <Separator className="bg-border" />
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</h3>
                <span className={`text-2xl font-bold ${riskColor(selectedNode.riskScore)}`}>{selectedNode.riskScore}</span>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most Likely Attack Path</h3>
                <p className="font-mono text-xs leading-relaxed text-card-foreground">{selectedNode.attackPath}</p>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Mitigation</h3>
                <p className="text-xs leading-relaxed text-card-foreground">{selectedNode.mitigation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
