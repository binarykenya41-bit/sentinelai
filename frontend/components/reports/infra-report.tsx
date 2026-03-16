"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, RefreshCw, Shield, Bug, Lock, AlertTriangle, CheckCircle2, Server, Database, Globe, FileCheck } from "lucide-react"
import { vulnsApi, assetsApi, simulationApi, patchesApi, dashboardApi } from "@/lib/api-client"
import type { Vulnerability, Asset, DashboardStats } from "@/lib/api-client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  generatedAt: string
  stats: DashboardStats | null
  vulns: Vulnerability[]
  assets: Asset[]
  simStats: { total_simulations: number; successful: number; success_rate: number; avg_confidence: number } | null
  patchStats: { total: number; ci_passing: number; merged: number; pending_merge: number } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cvssLabel(cvss: number) {
  if (cvss >= 9) return "Critical"
  if (cvss >= 7) return "High"
  if (cvss >= 4) return "Medium"
  return "Low"
}

function cvssColor(cvss: number) {
  if (cvss >= 9) return "#ef4444"
  if (cvss >= 7) return "#f59e0b"
  if (cvss >= 4) return "#f97316"
  return "#6b7280"
}

// ─── Print styles injected as <style> (print-only) ───────────────────────────

const PRINT_STYLE = `
@media print {
  @page { margin: 16mm 14mm; size: A4; }
  body { font-family: 'Inter', system-ui, sans-serif; font-size: 10pt; color: #111; background: white; }
  .no-print { display: none !important; }
  .print-page-break { page-break-before: always; }
  .print-avoid-break { page-break-inside: avoid; }
  .print-root { background: white !important; padding: 0 !important; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e5e7eb; padding: 4px 8px; text-align: left; font-size: 8pt; }
  th { background: #f9fafb; font-weight: 600; }
}
`

// ─── Report body (rendered both on-screen and for print) ─────────────────────

function ReportBody({ data }: { data: ReportData }) {
  const { stats, vulns, assets, simStats, patchStats } = data
  const criticalVulns = vulns.filter(v => (v.cvss_v3 ?? 0) >= 9.0)
  const openVulns     = vulns.filter(v => v.remediation_status === "open")
  const kevVulns      = vulns.filter(v => v.kev_status)
  const exploitedVulns = vulns.filter(v => (v.exploit_history?.length ?? 0) > 0 && v.exploit_history?.some(e => e.success))
  const score         = stats?.security_score ?? 0

  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444"

  return (
    <div className="print-root flex flex-col gap-8 bg-background p-0">
      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-8 print-avoid-break">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-card-foreground">Sentinel AI</span>
            </div>
            <h1 className="text-2xl font-black text-card-foreground mt-3">Infrastructure Security Report</h1>
            <p className="text-sm text-muted-foreground mt-1">Full vulnerability, asset & exploit posture assessment</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Generated</p>
            <p className="font-mono text-xs text-card-foreground">{new Date(data.generatedAt).toLocaleString()}</p>
            <div className="mt-3 flex flex-col items-end gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Security Score</span>
              <span className="font-mono text-4xl font-black" style={{ color: scoreColor }}>{score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Vulns",     value: vulns.length,          icon: <Bug className="h-4 w-4" />,          color: "text-destructive" },
            { label: "Critical Open",   value: criticalVulns.filter(v => v.remediation_status === "open").length, icon: <AlertTriangle className="h-4 w-4" />, color: "text-destructive" },
            { label: "CISA KEV",        value: kevVulns.length,        icon: <Shield className="h-4 w-4" />,       color: "text-warning" },
            { label: "Exploit Confirmed", value: exploitedVulns.length, icon: <Bug className="h-4 w-4" />,         color: "text-destructive" },
            { label: "Total Assets",    value: assets.length,          icon: <Server className="h-4 w-4" />,       color: "text-primary" },
            { label: "Patches Merged",  value: patchStats?.merged ?? 0, icon: <Lock className="h-4 w-4" />,       color: "text-success" },
            { label: "Simulations Run", value: simStats?.total_simulations ?? 0, icon: <Globe className="h-4 w-4" />, color: "text-chart-1" },
            { label: "Sim Success Rate", value: `${Math.round((simStats?.success_rate ?? 0) * 100)}%`, icon: <AlertTriangle className="h-4 w-4" />, color: "text-warning" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="rounded-lg border border-border bg-background p-3 print-avoid-break">
              <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span></div>
              <p className={`font-mono text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Executive Summary ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 print-avoid-break">
        <h2 className="text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" /> Executive Summary
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This report covers <strong className="text-card-foreground">{vulns.length} vulnerabilities</strong> across{" "}
          <strong className="text-card-foreground">{assets.length} infrastructure assets</strong> as of{" "}
          {new Date(data.generatedAt).toLocaleDateString()}. The organisation&rsquo;s current security score is{" "}
          <strong style={{ color: scoreColor }}>{score}/100</strong>.
          {criticalVulns.length > 0 && <> There are <strong className="text-destructive">{criticalVulns.filter(v => v.remediation_status === "open").length} critical open vulnerabilities</strong> requiring immediate remediation.</>}
          {kevVulns.length > 0 && <> <strong className="text-destructive">{kevVulns.length} CISA Known Exploited Vulnerabilities (KEV)</strong> are active in the environment — these carry the highest exploitation probability.</>}
          {exploitedVulns.length > 0 && <> Automated exploit simulation has <strong className="text-destructive">confirmed {exploitedVulns.length} vulnerabilities are exploitable</strong> in the current environment.</>}
        </p>
      </div>

      {/* ── Vulnerability Table ─────────────────────────────────────────── */}
      <div className="print-page-break">
        <h2 className="text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
          <Bug className="h-4 w-4 text-destructive" /> Vulnerability Inventory ({openVulns.length} open / {vulns.length} total)
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["CVE ID", "CVSS", "Severity", "EPSS", "Status", "CWE", "KEV", "Exploited", "Blast Radius"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vulns.slice(0, 50).map((v, i) => {
                const cvss = v.cvss_v3 ?? 0
                const exploited = v.exploit_history?.some(e => e.success)
                return (
                  <tr key={v.vuln_id} className={`border-b border-border ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                    <td className="px-3 py-2 font-mono font-semibold text-primary">{v.cve_id}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: cvssColor(cvss) }}>{cvss.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[9px]" style={{ color: cvssColor(cvss) }}>{cvssLabel(cvss)}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono">{((v.epss_score ?? 0) * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 capitalize">{v.remediation_status.replace("_", " ")}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{(v.cwe_ids ?? []).slice(0, 2).join(", ") || "—"}</td>
                    <td className="px-3 py-2">
                      {v.kev_status ? <span className="text-destructive font-bold">YES</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {exploited ? <span className="text-destructive font-bold">CONFIRMED</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground max-w-32 truncate">{v.blast_radius ?? "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {vulns.length > 50 && (
            <div className="px-3 py-2 text-[10px] text-muted-foreground bg-muted/20 border-t border-border">
              Showing 50 of {vulns.length} vulnerabilities. Export full dataset for complete list.
            </div>
          )}
        </div>
      </div>

      {/* ── Asset Inventory ─────────────────────────────────────────────── */}
      <div className="print-page-break">
        <h2 className="text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" /> Asset Inventory ({assets.length} assets)
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Hostname", "Type", "IP Address", "Criticality", "OS Version", "Patch Status", "Last Scan", "Open Vulns"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 40).map((a, i) => (
                <tr key={a.asset_id} className={`border-b border-border ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                  <td className="px-3 py-2 font-mono font-semibold text-card-foreground">{a.hostname ?? "—"}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{a.type}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">{(a.ip ?? []).join(", ") || "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`text-[9px] ${a.criticality === "critical" ? "text-destructive border-destructive/20 bg-destructive/10" : a.criticality === "high" ? "text-warning border-warning/20 bg-warning/10" : ""}`}>
                      {a.criticality ?? "—"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{a.os_version ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`text-[9px] ${a.patch_status === "behind" ? "text-destructive border-destructive/20 bg-destructive/10" : a.patch_status === "up-to-date" ? "text-success border-success/20 bg-success/10" : ""}`}>
                      {a.patch_status ?? "unknown"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{a.last_scan_at ? new Date(a.last_scan_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 font-mono">{(a.open_vulnerabilities ?? []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Critical Findings ────────────────────────────────────────────── */}
      {criticalVulns.length > 0 && (
        <div className="print-page-break">
          <h2 className="text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Critical Findings — Immediate Action Required
          </h2>
          <div className="flex flex-col gap-3">
            {criticalVulns.slice(0, 10).map(v => {
              const exploited = v.exploit_history?.some(e => e.success)
              return (
                <div key={v.vuln_id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 print-avoid-break">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-destructive">{v.cve_id}</span>
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">CVSS {v.cvss_v3?.toFixed(1)}</Badge>
                        {v.kev_status && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">KEV</Badge>}
                        {exploited && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">EXPLOITED</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{v.blast_radius ?? "Unknown blast radius"} · Source: {v.scan_source ?? "scanner"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(v.cwe_ids ?? []).map(c => <Badge key={c} variant="outline" className="text-[9px] font-mono">{c}</Badge>)}
                        {(v.mitre_techniques ?? []).map(t => <Badge key={t} variant="outline" className="text-[9px] font-mono">{t}</Badge>)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">EPSS</p>
                      <p className="font-mono text-sm font-bold text-primary">{((v.epss_score ?? 0) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-destructive/20">
                    <p className="text-[10px] text-muted-foreground"><span className="font-semibold text-card-foreground">Remediation:</span> Apply vendor security patch, verify with exploit simulation re-run, update remediation_status to &quot;patched&quot;.</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Simulation Stats ─────────────────────────────────────────────── */}
      {simStats && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 print-avoid-break">
          <div className="col-span-4">
            <h2 className="text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
              <Bug className="h-4 w-4 text-chart-1" /> Exploit Simulation Summary
            </h2>
          </div>
          {[
            { label: "Total Simulations", value: simStats.total_simulations, color: "text-card-foreground" },
            { label: "Successful Exploits", value: simStats.successful, color: "text-destructive" },
            { label: "Success Rate", value: `${Math.round(simStats.success_rate * 100)}%`, color: simStats.success_rate > 0.5 ? "text-destructive" : "text-success" },
            { label: "Avg Confidence", value: `${Math.round(simStats.avg_confidence * 100)}%`, color: "text-primary" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4 text-center print-avoid-break">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
              <p className={`font-mono text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Patch Automation Summary ─────────────────────────────────────── */}
      {patchStats && (
        <div className="rounded-xl border border-border bg-card p-6 print-avoid-break">
          <h2 className="text-base font-bold text-card-foreground mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Patch Automation Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Patches", value: patchStats.total, icon: <Lock className="h-4 w-4 text-muted-foreground" /> },
              { label: "CI Passing",    value: patchStats.ci_passing, icon: <CheckCircle2 className="h-4 w-4 text-success" /> },
              { label: "Merged",        value: patchStats.merged, icon: <CheckCircle2 className="h-4 w-4 text-primary" /> },
              { label: "Pending Merge", value: patchStats.pending_merge, icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                {icon}
                <div>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="font-mono text-lg font-bold text-card-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendations ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 print-avoid-break">
        <h2 className="text-base font-bold text-card-foreground mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Recommendations
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { priority: "P0", title: "Patch all CISA KEV vulnerabilities immediately", desc: `${kevVulns.length} KEV vulnerabilities in your environment have documented active exploitation in the wild. Apply vendor patches within 24 hours.`, color: "destructive" },
            { priority: "P1", title: "Re-run exploit simulations for all Critical findings", desc: `${criticalVulns.length} Critical CVSS vulnerabilities detected. Run sandboxed exploit simulations to confirm exploitability before prioritising patch order.`, color: "warning" },
            { priority: "P2", title: "Enable automated patch PR generation for all open vulns", desc: `${openVulns.length} vulnerabilities remain open. Use Sentinel AI patch generation to automatically create fix branches and GitHub PRs for each.`, color: "primary" },
            { priority: "P3", title: "Review assets with 'behind' patch status", desc: `${assets.filter(a => a.patch_status === "behind").length} assets are behind on system patches. Schedule maintenance window for OS-level updates.`, color: "chart-1" },
            { priority: "P4", title: "Schedule compliance evidence collection", desc: "Run compliance report seed to refresh ISO 27001, SOC 2, and PCI-DSS control mappings against current vulnerability data.", color: "muted" },
          ].map(({ priority, title, desc, color }) => (
            <div key={priority} className="flex gap-3 rounded-lg border border-border bg-background p-3">
              <Badge variant="outline" className={`h-fit shrink-0 font-mono text-[10px] text-${color} border-${color}/20 bg-${color}/10`}>{priority}</Badge>
              <div>
                <p className="text-xs font-semibold text-card-foreground mb-0.5">{title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Sentinel AI Security Platform — Confidential</span>
        <span>Report generated: {new Date(data.generatedAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

export function InfraReport() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [vulnRes, assetRes, simSt, patchSt, dashSt] = await Promise.allSettled([
        vulnsApi.list({ limit: 200 }),
        assetsApi.list({ limit: 200 }),
        simulationApi.stats(),
        patchesApi.stats(),
        dashboardApi.stats(),
      ])

      setReportData({
        generatedAt: new Date().toISOString(),
        stats: dashSt.status === "fulfilled" ? dashSt.value : null,
        vulns: vulnRes.status === "fulfilled" ? vulnRes.value.vulnerabilities : [],
        assets: assetRes.status === "fulfilled" ? assetRes.value.assets : [],
        simStats: simSt.status === "fulfilled" ? simSt.value : null,
        patchStats: patchSt.status === "fulfilled" ? patchSt.value : null,
      })
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const printReport = useCallback(() => {
    window.print()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Compiling infrastructure report from live data…</p>
    </div>
  )

  if (error) return (
    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
      <p className="text-xs text-destructive"><AlertTriangle className="inline h-3.5 w-3.5 mr-1" />{error}</p>
    </div>
  )

  if (!reportData) return (
    <div className="rounded-xl border border-dashed border-border bg-background/50 p-12 text-center">
      <Server className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-semibold text-card-foreground mb-1">Infrastructure Security Report</p>
      <p className="text-xs text-muted-foreground mb-6">Aggregates all assets, vulnerabilities, exploit results, and patch PRs into a printable PDF report</p>
      <Button size="sm" className="gap-2" onClick={fetchData}>
        <RefreshCw className="h-3.5 w-3.5" /> Generate Report
      </Button>
    </div>
  )

  return (
    <>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />Report ready
          </Badge>
          <span className="text-xs text-muted-foreground">
            {reportData.vulns.length} vulns · {reportData.assets.length} assets · {new Date(reportData.generatedAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={printReport}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div ref={printRef} id="infra-report-content">
        <ReportBody data={reportData} />
      </div>
    </>
  )
}
