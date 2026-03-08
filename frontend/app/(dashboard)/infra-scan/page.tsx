"use client"

import { useState, useEffect, useRef } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  ScanLine, CheckCircle, XCircle, Circle, AlertTriangle,
  Shield, Network, GitBranch, Globe, Database, Activity,
  ChevronDown, ChevronRight, Zap, Lock, Server, RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { infraScanApi, type InfraScanJob, type InfraServiceResult, type InfraServiceCve } from "@/lib/api-client"

// ── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(sev: string) {
  switch (sev) {
    case "CRITICAL": return "bg-destructive/10 text-destructive border-destructive/20"
    case "HIGH":     return "bg-warning/10 text-warning border-warning/20"
    case "MEDIUM":   return "bg-chart-1/10 text-chart-1 border-chart-1/20"
    default:         return "bg-muted/50 text-muted-foreground border-border"
  }
}

function serviceIcon(id: string) {
  switch (id) {
    case "gitlab":     return <GitBranch className="h-4 w-4 text-primary" />
    case "wordpress":  return <Globe className="h-4 w-4 text-chart-2" />
    case "erpnext":    return <Server className="h-4 w-4 text-chart-3" />
    case "keycloak":   return <Lock className="h-4 w-4 text-warning" />
    case "postgresql": return <Database className="h-4 w-4 text-chart-1" />
    case "grafana":    return <Activity className="h-4 w-4 text-success" />
    case "prometheus": return <Network className="h-4 w-4 text-muted-foreground" />
    default:           return <Server className="h-4 w-4 text-muted-foreground" />
  }
}

function riskColor(score: number) {
  if (score >= 80) return "text-destructive"
  if (score >= 60) return "text-warning"
  if (score >= 30) return "text-chart-1"
  return "text-success"
}

// ── Attack Graph Visualizer ───────────────────────────────────────────────────

function AttackGraphPanel({ graph }: { graph: InfraScanJob["attack_graph"] }) {
  if (!graph) return null
  const serviceNodes = graph.nodes.filter((n) => n.type === "service")
  const cveNodes = graph.nodes.filter((n) => n.type === "cve")
  const dataNodes = graph.nodes.filter((n) => n.type === "data")

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Attack Graph — Exploitation Paths
          </CardTitle>
          <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20">
            {graph.nodes.length} nodes · {graph.edges.length} edges
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Tactic Kill Chain */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {graph.tactic_flow.map((tactic, i) => (
            <div key={tactic} className="flex items-center gap-1 shrink-0">
              <span className="rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tactic}</span>
              {i < graph.tactic_flow.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Node layers */}
        <div className="grid grid-cols-3 gap-4">
          {/* Services */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target Services</h4>
            {serviceNodes.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded border border-border bg-secondary/50 px-2 py-1.5">
                {serviceIcon(n.id)}
                <span className="text-xs font-medium text-card-foreground">{n.label}</span>
                <span className={`ml-auto font-mono text-xs font-bold ${riskColor(n.risk_score)}`}>{n.risk_score}</span>
              </div>
            ))}
          </div>

          {/* CVEs */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exploitable CVEs</h4>
            {cveNodes.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded border border-border bg-secondary/50 px-2 py-1.5">
                <Zap className="h-3.5 w-3.5 text-destructive shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs font-semibold text-card-foreground">{n.label}</span>
                  <span className="text-[10px] text-muted-foreground">{n.tactic}</span>
                </div>
                {n.is_kev && (
                  <Badge variant="outline" className="ml-auto shrink-0 bg-destructive/10 text-destructive border-destructive/20 text-[9px]">KEV</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Impact targets */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impact Targets</h4>
            {dataNodes.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/5 px-2 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-xs font-medium text-card-foreground">{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top attack paths */}
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Critical Attack Paths</h4>
          <div className="flex flex-col gap-1">
            {graph.edges
              .filter((e) => e.type === "exploit" || e.type === "lateral_movement")
              .slice(0, 6)
              .map((edge, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-secondary/50 px-2 py-1">
                  <span className="font-mono text-[10px] text-card-foreground w-24 shrink-0">{edge.source}</span>
                  <ChevronRight className="h-3 w-3 text-destructive" />
                  <span className="font-mono text-[10px] text-card-foreground w-24 shrink-0">{edge.target}</span>
                  <Badge variant="outline" className={`ml-1 text-[9px] ${edge.type === "exploit" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                    {edge.type === "exploit" ? "Exploit" : "Pivot"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground truncate flex-1">{edge.label}</span>
                  <span className="font-mono text-[10px] text-warning">CVSS {edge.weight.toFixed(1)}</span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Service Detail Card ───────────────────────────────────────────────────────

function ServiceCard({ result }: { result: InfraServiceResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`border-border bg-card ${!result.reachable ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {serviceIcon(result.service_id)}
            <div>
              <span className="text-sm font-semibold text-card-foreground">{result.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{result.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result.reachable
              ? <CheckCircle className="h-4 w-4 text-success" />
              : <XCircle className="h-4 w-4 text-muted-foreground" />}
            <Badge variant="outline" className={result.reachable ? "bg-success/10 text-success border-success/20" : "bg-muted/50 text-muted-foreground border-border"}>
              {result.status}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">:{result.port}</span>
            <span className={`font-mono text-sm font-bold ${riskColor(result.risk_score)}`}>
              {result.risk_score}
            </span>
          </div>
        </div>

        {result.reachable && (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Response:</span>
                <span className="font-mono text-[10px] text-card-foreground">{result.response_time_ms}ms</span>
              </div>
              {result.detected_version && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Version:</span>
                  <span className="font-mono text-[10px] text-primary">{result.detected_version}</span>
                </div>
              )}
              {Object.entries(result.fingerprint).slice(0, 2).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{k}:</span>
                  <span className="font-mono text-[10px] text-card-foreground truncate max-w-32">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-muted-foreground">
                {result.vulnerabilities.length} CVEs detected
              </span>
              {result.highest_severity !== "NONE" && (
                <Badge variant="outline" className={severityColor(result.highest_severity)}>
                  {result.highest_severity}
                </Badge>
              )}
              {result.vulnerabilities.filter((v) => v.kev).length > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">
                  {result.vulnerabilities.filter((v) => v.kev).length} KEV
                </Badge>
              )}
              <button
                className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-card-foreground transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {expanded ? "Hide" : "Show"} CVEs
              </button>
            </div>

            {expanded && (
              <div className="flex flex-col gap-2 mt-2 border-t border-border pt-3">
                {result.vulnerabilities.map((cve) => (
                  <CveRow key={cve.cve_id} cve={cve} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CveRow({ cve }: { cve: InfraServiceCve }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded border border-border bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-card-foreground">{cve.cve_id}</span>
            <Badge variant="outline" className={severityColor(cve.severity)}>{cve.severity}</Badge>
            {cve.kev && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">KEV</Badge>}
            {cve.exploit_available && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[9px]">Exploit Available</Badge>}
            <span className="text-[10px] text-muted-foreground">{cve.tactic}</span>
          </div>
          <span className="text-xs text-card-foreground">{cve.title}</span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`font-mono text-sm font-bold ${riskColor(cve.cvss_v3 * 10)}`}>
            {cve.cvss_v3.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted-foreground">EPSS {(cve.epss_score * 100).toFixed(0)}%</span>
        </div>
      </div>

      <button
        className="mt-1.5 text-[10px] text-primary hover:underline"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide details" : "Show details & patch"}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-2">
          <p className="text-[11px] text-muted-foreground">{cve.description}</p>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-warning">Affected: {cve.affected_versions}</span>
            <span className="text-[10px] font-semibold text-success">Patch: {cve.patch}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {cve.mitre_techniques.map((t) => (
              <Badge key={t} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px]">{t}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function InfraScanPage() {
  const [scanJob, setScanJob] = useState<InfraScanJob | null>(null)
  const [scanning, setScanning] = useState(false)
  const [host, setHost] = useState("localhost")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load latest scan on mount
  useEffect(() => {
    infraScanApi.latest().then(setScanJob).catch(() => {})
  }, [])

  const startScan = async () => {
    setScanning(true)
    toast.loading("Launching infrastructure scan…", { id: "scan", duration: 60000 })
    try {
      const { scan_id } = await infraScanApi.run()
      // Poll until completed
      pollRef.current = setInterval(async () => {
        const job = await infraScanApi.get(scan_id)
        setScanJob(job)
        if (job.status !== "running") {
          clearInterval(pollRef.current!)
          setScanning(false)
          toast.dismiss("scan")
          if (job.status === "completed") {
            toast.success(`Scan complete — ${job.summary?.services_online ?? 0} services online, ${job.summary?.total_vulnerabilities ?? 0} CVEs found`)
          } else {
            toast.error("Scan failed")
          }
        }
      }, 2000)
    } catch (e) {
      setScanning(false)
      toast.dismiss("scan")
      toast.error("Failed to start scan")
    }
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const summary = scanJob?.summary
  const results = scanJob?.results ?? []

  return (
    <div className="flex flex-col">
      <AppHeader title="Infrastructure Scanner" />
      <div className="flex flex-col gap-6 p-6">

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="bg-transparent text-xs text-card-foreground outline-none placeholder:text-muted-foreground w-40"
              placeholder="Target host (e.g. 192.168.1.100)"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <Button
            onClick={startScan}
            disabled={scanning}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {scanning
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning…</>
              : <><ScanLine className="h-4 w-4" /> Run Infra Scan</>
            }
          </Button>
          {scanJob && (
            <div className="ml-auto flex items-center gap-2">
              <Circle className="h-2 w-2 fill-success text-success" />
              <span className="text-xs text-muted-foreground">
                Last scan: {scanJob.completed_at
                  ? new Date(scanJob.completed_at).toLocaleTimeString()
                  : "running…"}
              </span>
            </div>
          )}
        </div>

        {/* Scan pipeline steps */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {[
                { label: "Identify Services", done: !!scanJob },
                { label: "Detect CVEs", done: scanJob?.status === "completed" },
                { label: "Map Vulnerabilities", done: scanJob?.status === "completed" },
                { label: "Generate Attack Graph", done: !!scanJob?.attack_graph },
                { label: "Recommend Patches", done: !!scanJob?.attack_graph },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-0">
                  <div className="flex flex-col items-center gap-1.5">
                    {step.done
                      ? <CheckCircle className="h-5 w-5 text-success" />
                      : scanning
                        ? <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        : <Circle className="h-5 w-5 text-muted-foreground/40" />
                    }
                    <span className="text-[10px] font-medium text-card-foreground text-center max-w-16">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="mx-2 h-px w-10 bg-border lg:w-14" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 lg:grid-cols-8">
            {[
              { label: "Scanned", value: summary.services_scanned, color: "text-primary" },
              { label: "Online", value: summary.services_online, color: "text-success" },
              { label: "Total CVEs", value: summary.total_vulnerabilities, color: "text-warning" },
              { label: "Critical", value: summary.critical_vulns, color: "text-destructive" },
              { label: "High", value: summary.high_vulns, color: "text-warning" },
              { label: "KEV", value: summary.kev_count, color: "text-destructive" },
              { label: "Exploitable", value: summary.exploitable_count, color: "text-warning" },
              { label: "Risk Score", value: summary.overall_risk_score, color: riskColor(summary.overall_risk_score) },
            ].map(({ label, value, color }) => (
              <Card key={label} className="border-border bg-card">
                <CardContent className="p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Not yet scanned placeholder */}
        {!scanJob && !scanning && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Shield className="h-12 w-12 text-muted-foreground/30" />
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-semibold text-card-foreground">No scan results yet</p>
                <p className="text-xs text-muted-foreground">
                  Click "Run Infra Scan" to identify services and detect CVEs across your company stack
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["GitLab", "WordPress", "ERPNext", "Keycloak", "PostgreSQL", "Grafana", "Prometheus"].map((s) => (
                  <Badge key={s} variant="outline" className="border-border bg-secondary text-muted-foreground">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service results */}
        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Service Scan Results — {results.filter((r) => r.reachable).length}/{results.length} online
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {results.map((r) => <ServiceCard key={r.service_id} result={r} />)}
            </div>
          </div>
        )}

        {/* Attack Graph */}
        {scanJob?.attack_graph && <AttackGraphPanel graph={scanJob.attack_graph} />}

        {/* Patch Recommendations */}
        {results.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Patch Recommendations — Priority Order
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {results
                .flatMap((r) =>
                  r.vulnerabilities
                    .filter((v) => v.exploit_available || v.kev)
                    .map((v) => ({ ...v, service: r.name }))
                )
                .sort((a, b) => {
                  const scoreA = (a.kev ? 1000 : 0) + a.cvss_v3 * 10 + a.epss_score * 100
                  const scoreB = (b.kev ? 1000 : 0) + b.cvss_v3 * 10 + b.epss_score * 100
                  return scoreB - scoreA
                })
                .slice(0, 10)
                .map((v, i) => (
                  <div key={v.cve_id} className="flex items-start gap-3 rounded border border-border bg-secondary/30 p-3">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-card-foreground">{v.cve_id}</span>
                        <Badge variant="outline" className={severityColor(v.severity)}>{v.severity}</Badge>
                        {v.kev && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">KEV</Badge>}
                        <span className="text-[10px] text-muted-foreground">{v.service}</span>
                      </div>
                      <span className="text-xs text-card-foreground">{v.title}</span>
                      <span className="text-[11px] text-success">{v.patch}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono text-xs font-bold text-destructive">{v.cvss_v3.toFixed(1)}</span>
                      <Progress value={v.epss_score * 100} className="h-1 w-16 bg-secondary [&>div]:bg-warning" />
                      <span className="text-[10px] text-muted-foreground">EPSS {(v.epss_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
