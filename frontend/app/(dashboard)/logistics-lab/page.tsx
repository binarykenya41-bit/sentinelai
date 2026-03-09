"use client"

import { useState, useCallback } from "react"
import { AppHeader } from "@/components/app-header"
import { useApi } from "@/hooks/use-api"
import {
  logisticsLabApi,
  type LogisticsServiceStatus,
  type LogisticsExploitResult,
} from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Database, Server, Flame, Shield, RefreshCw,
  Play, CheckCircle2, XCircle, Loader2, Zap,
  Terminal, ChevronDown, ChevronUp, Package,
  AlertTriangle, Activity,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceKey = "erpnext" | "redis" | "kafka" | "grafana" | "prometheus" | "postgresql"
type ExploitState = "idle" | "running" | "done" | "error"

interface ServiceMeta {
  key: ServiceKey
  label: string
  icon: React.ElementType
  cve: string
  cvss: number
  description: string
  color: string
}

const SERVICE_META: ServiceMeta[] = [
  {
    key: "erpnext",
    label: "ERPNext",
    icon: Package,
    cve: "CVE-2023-46127",
    cvss: 8.8,
    description: "Stored XSS + default credentials (Administrator:admin)",
    color: "text-destructive",
  },
  {
    key: "redis",
    label: "Redis Tracking",
    icon: Database,
    cve: "CVE-2022-0543",
    cvss: 10.0,
    description: "Unauthenticated access + CONFIG SET RCE + SLAVEOF hijack",
    color: "text-destructive",
  },
  {
    key: "kafka",
    label: "Apache Kafka",
    icon: Activity,
    cve: "CVE-2023-25194",
    cvss: 8.8,
    description: "No SASL auth — all 6 topics readable, PII exfiltration",
    color: "text-destructive",
  },
  {
    key: "grafana",
    label: "Grafana",
    icon: Server,
    cve: "CVE-2021-43798",
    cvss: 7.5,
    description: "Path traversal arbitrary file read (CISA KEV)",
    color: "text-warning",
  },
  {
    key: "prometheus",
    label: "Prometheus",
    icon: Activity,
    cve: "CVE-2019-3826",
    cvss: 6.1,
    description: "Unauthenticated metrics + internal host discovery",
    color: "text-warning",
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    icon: Database,
    cve: "CVE-2024-0985",
    cvss: 8.0,
    description: "Privilege escalation via ALTER TABLE SET SCHEMA",
    color: "text-warning",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cvssColor(cvss: number) {
  if (cvss >= 9.0) return "text-destructive"
  if (cvss >= 7.0) return "text-destructive"
  if (cvss >= 4.0) return "text-warning"
  return "text-success"
}

function cvssLabel(cvss: number) {
  if (cvss >= 9.0) return "CRITICAL"
  if (cvss >= 7.0) return "HIGH"
  if (cvss >= 4.0) return "MEDIUM"
  return "LOW"
}

function confidenceBar(confidence: number) {
  const pct = Math.round(confidence * 100)
  const color = confidence >= 0.85 ? "bg-destructive" : confidence >= 0.5 ? "bg-warning" : "bg-success"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-secondary">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono ${confidence >= 0.85 ? "text-destructive" : confidence >= 0.5 ? "text-warning" : "text-success"}`}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  meta,
  status,
  exploitState,
  result,
  onExploit,
}: {
  meta: ServiceMeta
  status: LogisticsServiceStatus | undefined
  exploitState: ExploitState
  result: LogisticsExploitResult | null
  onExploit: () => void
}) {
  const [showOutput, setShowOutput] = useState(false)
  const Icon = meta.icon
  const isUp = status?.up ?? false

  return (
    <Card className="border-border bg-card flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <CardTitle className="text-sm font-semibold text-card-foreground">{meta.label}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isUp ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={`text-xs font-medium ${isUp ? "text-success" : "text-muted-foreground"}`}>
              {status ? (isUp ? `UP :${status.port}` : "DOWN") : "checking…"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Badge variant="outline" className="border-border text-xs font-mono text-muted-foreground">
            {meta.cve}
          </Badge>
          <Badge
            variant="outline"
            className={`border-0 text-xs font-semibold ${cvssColor(meta.cvss)} bg-transparent`}
          >
            {cvssLabel(meta.cvss)} {meta.cvss}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-3 flex-1 justify-end">
        {/* Result summary */}
        {result && (
          <div className={`rounded border px-3 py-2 text-xs ${
            result.success
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-success/30 bg-success/5 text-success"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">
                {result.success ? "EXPLOITED" : "BLOCKED"}
              </span>
              <span className="text-muted-foreground font-mono">{result.duration_ms}ms</span>
            </div>
            {confidenceBar(result.confidence)}
          </div>
        )}

        {/* Output toggle */}
        {result?.output && (
          <button
            onClick={() => setShowOutput((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Terminal className="h-3 w-3" />
            {showOutput ? "Hide" : "Show"} output
            {showOutput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}

        {showOutput && result?.output && (
          <pre className="max-h-48 overflow-y-auto rounded bg-black/60 p-2 text-[10px] leading-relaxed text-green-400 font-mono whitespace-pre-wrap">
            {result.output}
          </pre>
        )}

        {/* Run button */}
        <Button
          size="sm"
          variant="outline"
          className={`w-full border-border text-xs ${
            exploitState === "running"
              ? "cursor-not-allowed opacity-60"
              : "hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5"
          }`}
          disabled={exploitState === "running" || !isUp}
          onClick={onExploit}
        >
          {exploitState === "running" ? (
            <>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1.5" />
              Run Exploit
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LogisticsLabPage() {
  const { data: statusData, loading: statusLoading, refetch: refetchStatus } =
    useApi(() => logisticsLabApi.status(), [])

  const { data: resultsData, refetch: refetchResults } =
    useApi(() => logisticsLabApi.results(), [])

  const { data: vulnsData } =
    useApi(() => logisticsLabApi.vulnerabilities(), [])

  const [exploitStates, setExploitStates] = useState<Record<ServiceKey, ExploitState>>({
    erpnext: "idle", redis: "idle", kafka: "idle",
    grafana: "idle", prometheus: "idle", postgresql: "idle",
  })

  const [exploitResults, setExploitResults] = useState<Record<ServiceKey, LogisticsExploitResult | null>>({
    erpnext: null, redis: null, kafka: null,
    grafana: null, prometheus: null, postgresql: null,
  })

  const [seedState, setSeedState] = useState<"idle" | "seeding" | "done" | "error">("idle")
  const [seedResult, setSeedResult] = useState<{ assets_seeded: number; vulns_seeded: number; total_vulns: number } | null>(null)

  const [runAllState, setRunAllState] = useState<"idle" | "running">("idle")

  const handleExploit = useCallback(async (key: ServiceKey) => {
    setExploitStates((s) => ({ ...s, [key]: "running" }))
    try {
      const result = await logisticsLabApi.exploit(key)
      setExploitResults((r) => ({ ...r, [key]: result }))
      setExploitStates((s) => ({ ...s, [key]: "done" }))
      refetchResults()
    } catch (err) {
      setExploitStates((s) => ({ ...s, [key]: "error" }))
      console.error(err)
    }
  }, [refetchResults])

  const handleRunAll = useCallback(async () => {
    setRunAllState("running")
    const keys = SERVICE_META.map((s) => s.key)
    // Run sequentially so we don't hammer the sandbox
    for (const key of keys) {
      await handleExploit(key)
    }
    setRunAllState("idle")
  }, [handleExploit])

  const handleSeed = async () => {
    setSeedState("seeding")
    try {
      const result = await logisticsLabApi.seed()
      setSeedResult(result)
      setSeedState("done")
      refetchResults()
    } catch (err) {
      setSeedState("error")
      console.error(err)
    }
  }

  // Build service status map
  const statusMap: Record<string, LogisticsServiceStatus> = {}
  for (const svc of statusData?.services ?? []) {
    statusMap[svc.service] = svc
  }

  const servicesUp = statusData?.services.filter((s) => s.up).length ?? 0
  const servicesTotal = statusData?.services.length ?? 6
  const exploitedCount = Object.values(exploitResults).filter((r) => r?.success).length
  const blockedCount = Object.values(exploitResults).filter((r) => r !== null && !r.success).length
  const vulnCount = (vulnsData?.vulnerabilities as unknown[])?.length ?? 0

  // DB results
  const dbResults = (resultsData?.results as Array<{
    result_id: string
    executed_at: string
    success: boolean
    confidence: number
    technique: string
    duration_ms: number
    vuln?: { cve_id: string; cvss_v3: number }
  }>) ?? []

  return (
    <div className="flex flex-col min-h-full">
      <AppHeader title="Logistics Lab" />

      <div className="flex flex-col gap-6 p-6">

        {/* ── Top Stats Bar ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Services Live</p>
              <div className="flex items-end gap-1.5">
                <span className={`text-2xl font-bold ${servicesUp === servicesTotal ? "text-success" : servicesUp > 0 ? "text-warning" : "text-muted-foreground"}`}>
                  {statusLoading ? "…" : servicesUp}
                </span>
                <span className="text-sm text-muted-foreground mb-0.5">/ {servicesTotal}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">CVEs in DB</p>
              <span className="text-2xl font-bold text-card-foreground">{vulnCount}</span>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Exploited</p>
              <span className="text-2xl font-bold text-destructive">{exploitedCount}</span>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Blocked</p>
              <span className="text-2xl font-bold text-success">{blockedCount}</span>
            </CardContent>
          </Card>
        </div>

        {/* ── Action Bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchStatus()}
            className="border-border text-xs gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Status
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSeed}
            disabled={seedState === "seeding"}
            className="border-border text-xs gap-1.5 hover:border-primary/40 hover:text-primary"
          >
            {seedState === "seeding" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Database className="h-3 w-3" />
            )}
            {seedState === "seeding" ? "Seeding…" : seedState === "done" ? "Seeded ✓" : "Seed Database"}
          </Button>

          <Button
            size="sm"
            onClick={handleRunAll}
            disabled={runAllState === "running"}
            className="bg-destructive hover:bg-destructive/90 text-white text-xs gap-1.5"
          >
            {runAllState === "running" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Flame className="h-3 w-3" />
            )}
            {runAllState === "running" ? "Running All Exploits…" : "Run All Exploits"}
          </Button>

          {seedResult && (
            <span className="text-xs text-success">
              +{seedResult.assets_seeded} assets, +{seedResult.vulns_seeded} CVEs ({seedResult.total_vulns} total)
            </span>
          )}

          {seedState === "error" && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> Seed failed — check backend logs
            </span>
          )}
        </div>

        {/* ── Service Grid ────────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Services &amp; Exploit Controls
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICE_META.map((meta) => (
              <ServiceCard
                key={meta.key}
                meta={meta}
                status={statusMap[meta.key]}
                exploitState={exploitStates[meta.key]}
                result={exploitResults[meta.key]}
                onExploit={() => handleExploit(meta.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Vulnerability Table ─────────────────────────────────────────── */}
        {vulnCount > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Seeded CVEs
            </h2>
            <Card className="border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["CVE", "CVSS", "Severity", "Status", "KEV", "Blast Radius"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(vulnsData?.vulnerabilities as Array<{
                      vuln_id: string; cve_id: string; cvss_v3: number
                      kev_status: boolean; remediation_status: string; blast_radius: string
                    }>)?.map((v) => (
                      <tr key={v.vuln_id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-2.5 font-mono text-primary">{v.cve_id}</td>
                        <td className={`px-4 py-2.5 font-semibold ${cvssColor(v.cvss_v3)}`}>{v.cvss_v3}</td>
                        <td className={`px-4 py-2.5 ${cvssColor(v.cvss_v3)}`}>{cvssLabel(v.cvss_v3)}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] border-0 ${
                              v.remediation_status === "open"
                                ? "bg-destructive/10 text-destructive"
                                : v.remediation_status === "patched"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {v.remediation_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {v.kev_status ? (
                            <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-0">
                              KEV
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{v.blast_radius}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── DB Exploit Results ──────────────────────────────────────────── */}
        {dbResults.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              Exploit Run History
              <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                {dbResults.length} runs
              </Badge>
            </h2>
            <Card className="border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["CVE", "Result", "Confidence", "Technique", "Duration", "Timestamp"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dbResults.slice(0, 20).map((r) => (
                      <tr key={r.result_id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-2.5 font-mono text-primary">{r.vuln?.cve_id ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] border-0 ${
                              r.success
                                ? "bg-destructive/10 text-destructive"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {r.success ? "EXPLOITED" : "BLOCKED"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {r.confidence != null ? confidenceBar(r.confidence) : "—"}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{r.technique ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground font-mono">
                          {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {new Date(r.executed_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Patch Summary ───────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            Applied Patches (Branch: logistics-patches)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { service: "ERPNext", file: "01-erpnext-hardening.md", fixes: ["Change default creds", "Upgrade >= 14.49.0", "Rate-limit /api/resource/*"] },
              { service: "Redis", file: "02-redis-hardening.md", fixes: ["requirepass", "rename-command CONFIG/SLAVEOF", "ACL per user"] },
              { service: "Kafka", file: "03-kafka-hardening.md", fixes: ["SASL/SCRAM auth", "ACLs per topic", "Remove host port"] },
              { service: "PostgreSQL", file: "04-postgresql-hardening.md", fixes: ["scram-sha-256", "Least privilege user", "SSL on"] },
              { service: "Grafana", file: "05-grafana-hardening.md", fixes: ["Pin v10.4.2+", "Strong admin creds", "Block host port"] },
              { service: "Prometheus", file: "06-prometheus-hardening.md", fixes: ["Basic auth via web-config.yml", "Remove host port", "Upgrade >= 2.7.2"] },
            ].map((patch) => (
              <Card key={patch.service} className="border-success/20 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    <span className="text-sm font-semibold text-card-foreground">{patch.service}</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mb-2">{patch.file}</p>
                  <ul className="space-y-0.5">
                    {patch.fixes.map((fix) => (
                      <li key={fix} className="text-xs text-success flex items-start gap-1">
                        <span className="mt-0.5 shrink-0">→</span> {fix}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
