"use client"

import { useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Server, Database, Container, Globe, ArrowRight, AlertTriangle, RefreshCw, Shield, Bug } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { attackGraphApi, type AttackGraphNode } from "@/lib/api-client"

function NodeIcon({ type }: { type: string }) {
  switch (type) {
    case "cve":       return <Bug className="h-5 w-5" />
    case "tactic":    return <Shield className="h-5 w-5" />
    case "database":  return <Database className="h-5 w-5" />
    case "container": return <Container className="h-5 w-5" />
    case "asset":     return <Server className="h-5 w-5" />
    default:          return <Globe className="h-5 w-5" />
  }
}

function riskColor(score: number) {
  if (score >= 85) return "text-destructive"
  if (score >= 70) return "text-warning"
  return "text-chart-1"
}

function edgeRelationLabel(type: string): string {
  const map: Record<string, string> = {
    exploits: "Can Exploit",
    escalates: "Can Escalate",
    accesses: "Can Access",
    leads_to: "Leads To",
    enables: "Enables",
  }
  return map[type] ?? type.replace(/_/g, " ")
}

function edgeRelationColor(type: string) {
  if (type === "exploits" || type === "escalates") return "bg-destructive/10 text-destructive border-destructive/20"
  if (type === "leads_to" || type === "enables") return "bg-warning/10 text-warning border-warning/20"
  return "bg-chart-1/10 text-chart-1 border-chart-1/20"
}

export default function AttackGraphPage() {
  const [selectedNode, setSelectedNode] = useState<AttackGraphNode | null>(null)

  const { data: graph, loading, error, refetch } = useApi(
    () => attackGraphApi.buildAuto(),
    []
  )

  const topNodes = (graph?.nodes ?? [])
    .slice()
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 9)

  const displayEdges = (graph?.edges ?? []).slice(0, 20)
  const tacticFlow = graph?.tactic_flow ?? []

  return (
    <div className="flex flex-col">
      <AppHeader title="Attack Graph" />
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col gap-6 p-6">

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Backend unreachable — {error}
            </div>
          )}

          {/* Meta bar */}
          {graph && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {graph.meta.cve_count} CVEs
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {graph.meta.technique_count} Techniques
              </Badge>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {graph.meta.tactic_count} Tactics
              </Badge>
              <span className="ml-auto">{graph.nodes.length} nodes · {graph.edges.length} edges</span>
              <Button variant="outline" size="sm" className="h-6 border-border bg-secondary text-[10px] text-muted-foreground hover:bg-accent" onClick={refetch}>
                <RefreshCw className="h-3 w-3 mr-1" /> Rebuild
              </Button>
            </div>
          )}

          {/* Tactic Flow (attack kill chain) */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                MITRE ATT&CK Tactic Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <Skeleton className="h-8 w-full" />
                : tacticFlow.length > 0
                  ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {tacticFlow.map((tactic, i) => (
                        <div key={tactic} className="flex items-center gap-2">
                          <span className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-card-foreground">
                            {tactic}
                          </span>
                          {i < tacticFlow.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                  : <span className="text-xs text-muted-foreground">No tactic flow data — run a CVE sync first.</span>
              }
            </CardContent>
          </Card>

          {/* Top-risk nodes grid */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Top Risk Nodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="grid grid-cols-3 gap-3">{[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
                : topNodes.length === 0
                  ? <span className="text-xs text-muted-foreground">No graph data — run a CVE sync to populate the attack graph.</span>
                  : (
                    <div className="grid grid-cols-3 gap-3">
                      {topNodes.map((node) => (
                        <div key={node.id} className="flex flex-col gap-0">
                          <button
                            onClick={() => setSelectedNode(node)}
                            className={`flex items-center gap-3 rounded-t-lg border border-b-0 p-3 text-left transition-colors ${
                              selectedNode?.id === node.id
                                ? "border-primary/40 bg-primary/5"
                                : "border-border bg-secondary/50 hover:bg-secondary"
                            }`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card ${riskColor(node.risk_score)}`}>
                              <NodeIcon type={node.type} />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-mono text-xs font-semibold text-card-foreground truncate">{node.label}</span>
                              <span className="text-[10px] uppercase text-muted-foreground">{node.type}</span>
                              <span className={`font-mono text-xs font-bold ${riskColor(node.risk_score)}`}>
                                Risk: {node.risk_score}
                              </span>
                            </div>
                          </button>
                          <Link
                            href={`/attack-graph/${encodeURIComponent(node.id)}`}
                            className="flex items-center justify-center rounded-b-lg border border-border bg-secondary/30 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            View Detail
                          </Link>
                        </div>
                      ))}
                    </div>
                  )
              }
            </CardContent>
          </Card>

          {/* Edge / relationship table */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Attack Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading
                ? <div className="p-4 flex flex-col gap-2">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                : displayEdges.length === 0
                  ? <p className="p-4 text-xs text-muted-foreground">No edge data available.</p>
                  : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relationship</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayEdges.map((edge, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-4 py-2.5 font-mono text-xs text-card-foreground">{edge.source}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline" className={edgeRelationColor(edge.type)}>
                                {edge.label ?? edgeRelationLabel(edge.type)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-card-foreground">{edge.target}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                              {edge.weight != null ? edge.weight.toFixed(2) : "—"}
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

        {/* Node detail panel */}
        {selectedNode && (
          <div className="w-80 shrink-0 border-l border-border bg-card p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${riskColor(selectedNode.risk_score)}`}>
                  <NodeIcon type={selectedNode.type} />
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-sm font-semibold text-card-foreground block truncate">{selectedNode.label}</span>
                  <p className="text-[10px] uppercase text-muted-foreground">{selectedNode.type}</p>
                </div>
              </div>
              <Separator className="bg-border" />
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</h3>
                <span className={`text-2xl font-bold ${riskColor(selectedNode.risk_score)}`}>{selectedNode.risk_score}</span>
              </div>
              {selectedNode.cvss != null && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVSS</h3>
                  <span className="font-mono text-sm text-card-foreground">{selectedNode.cvss.toFixed(1)}</span>
                </div>
              )}
              {selectedNode.tactic_phase && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tactic Phase</h3>
                  <span className="font-mono text-xs text-primary">{selectedNode.tactic_phase}</span>
                </div>
              )}
              {selectedNode.is_kev && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 w-fit">
                  CISA KEV Listed
                </Badge>
              )}
              {selectedNode.description && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
                  <p className="text-xs leading-relaxed text-card-foreground line-clamp-4">{selectedNode.description}</p>
                </div>
              )}
              {selectedNode.url && (
                <a href={selectedNode.url} target="_blank" rel="noreferrer"
                  className="text-xs text-primary hover:underline">
                  View on MITRE ATT&CK ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
