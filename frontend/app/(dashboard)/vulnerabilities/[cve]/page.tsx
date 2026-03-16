"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft, GitPullRequest, Play, ExternalLink, Shield, Clock,
  Target, AlertTriangle, CheckCircle2, XCircle, Loader2, Copy,
  Terminal, Bug, Zap, Lock, DollarSign, Building2, FileCheck,
  ChevronDown, ChevronUp, Database, Globe, Key, Server, Activity
} from "lucide-react"
import { vulnsApi, simulationApi, patchesApi } from "@/lib/api-client"
import type { Vulnerability, ExploitResult, PatchRecord } from "@/lib/api-client"
import { toast } from "sonner"

// ─── Colour helpers ─────────────────────────────────────────────────────────

function cvssColor(cvss: number) {
  if (cvss >= 9.0) return "bg-destructive/10 text-destructive border-destructive/20"
  if (cvss >= 7.0) return "bg-warning/10 text-warning border-warning/20"
  if (cvss >= 4.0) return "bg-chart-1/10 text-chart-1 border-chart-1/20"
  return "bg-muted text-muted-foreground border-border"
}

function cvssLabel(cvss: number) {
  if (cvss >= 9.0) return "Critical"
  if (cvss >= 7.0) return "High"
  if (cvss >= 4.0) return "Medium"
  return "Low"
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    open: "bg-destructive/10 text-destructive border-destructive/20",
    in_progress: "bg-warning/10 text-warning border-warning/20",
    patched: "bg-primary/10 text-primary border-primary/20",
    verified: "bg-success/10 text-success border-success/20",
  }
  return m[s] ?? "bg-muted text-muted-foreground border-border"
}

// ─── Business impact logic ────────────────────────────────────────────────────

interface ComplianceImpact {
  framework: string
  controls: string[]
  risk: "critical" | "high" | "medium" | "low"
  reason: string
}

interface BusinessImpactData {
  financialLevel: "critical" | "high" | "medium" | "low"
  financialEstimate: string
  financialDesc: string
  operationalDomains: { name: string; icon: React.ReactNode; risk: "critical" | "high" | "medium" | "low"; desc: string }[]
  compliance: ComplianceImpact[]
  rtoRpo: { rto: string; rpo: string }
}

function computeBusinessImpact(vuln: Vulnerability): BusinessImpactData {
  const cvss = vuln.cvss_v3 ?? 0
  const cwes = vuln.cwe_ids ?? []
  const techniques = vuln.mitre_techniques ?? []
  const blast = (vuln.blast_radius ?? "").toLowerCase()
  const assets = (vuln.affected_assets ?? []).map(a => a.toLowerCase())
  const allText = [blast, ...assets].join(" ")

  // Financial impact
  const financialLevel: BusinessImpactData["financialLevel"] =
    cvss >= 9 ? "critical" : cvss >= 7 ? "high" : cvss >= 4 ? "medium" : "low"
  const financialMap = {
    critical: { estimate: "$5M – $50M+", desc: "Potential class-action liability, regulatory fines up to 4% of global annual revenue (GDPR), and reputational damage equivalent to loss of enterprise customers." },
    high:     { estimate: "$500K – $5M",  desc: "Incident response costs, forensic investigation, customer notification, and potential regulatory scrutiny under data protection laws." },
    medium:   { estimate: "$50K – $500K",  desc: "Remediation engineering hours, potential SLA breach penalties, and limited operational disruption costs." },
    low:      { estimate: "< $50K",       desc: "Minimal direct cost — primarily engineering time for patch application and verification." },
  }

  // Operational domains
  const domains: BusinessImpactData["operationalDomains"] = []
  if (allText.includes("database") || allText.includes("postgres") || allText.includes("sql") || cwes.includes("CWE-89"))
    domains.push({ name: "Data Integrity & Privacy", icon: <Database className="h-3.5 w-3.5" />, risk: "critical", desc: "Database access allows exfiltration of PII, credentials, and business-critical records." })
  if (allText.includes("auth") || allText.includes("login") || cwes.includes("CWE-287") || cwes.includes("CWE-288"))
    domains.push({ name: "Identity & Access Management", icon: <Key className="h-3.5 w-3.5" />, risk: "critical", desc: "Authentication bypass grants attacker persistent access to enterprise systems." })
  if (allText.includes("api") || allText.includes("service") || allText.includes("web"))
    domains.push({ name: "Service Availability", icon: <Globe className="h-3.5 w-3.5" />, risk: cvss >= 7 ? "high" : "medium", desc: "Exploitation can degrade or disrupt customer-facing services and SLA commitments." })
  if (allText.includes("server") || allText.includes("linux") || allText.includes("ssh") || cwes.includes("CWE-78"))
    domains.push({ name: "Infrastructure Integrity", icon: <Server className="h-3.5 w-3.5" />, risk: "high", desc: "Remote code execution allows lateral movement and persistence across the server fleet." })
  if (allText.includes("kafka") || allText.includes("redis") || allText.includes("message"))
    domains.push({ name: "Business Continuity", icon: <Activity className="h-3.5 w-3.5" />, risk: "high", desc: "Message broker compromise can corrupt transactional pipelines and data streams." })
  if (allText.includes("cicd") || allText.includes("gitlab") || allText.includes("github") || cwes.includes("CWE-506"))
    domains.push({ name: "Supply Chain Security", icon: <Building2 className="h-3.5 w-3.5" />, risk: "critical", desc: "CI/CD compromise enables insertion of malicious code into production builds." })
  if (domains.length === 0)
    domains.push({ name: "General Security Posture", icon: <Shield className="h-3.5 w-3.5" />, risk: cvss >= 7 ? "high" : "medium", desc: "Vulnerability reduces overall security posture and may enable further attack chains." })

  // Compliance mapping
  const compliance: ComplianceImpact[] = []

  const hasSqli  = cwes.includes("CWE-89")
  const hasAuth  = cwes.includes("CWE-287") || cwes.includes("CWE-288")
  const hasRce   = cwes.includes("CWE-78") || cwes.includes("CWE-94") || techniques.some(t => t.startsWith("T1059"))
  const hasDos   = cwes.includes("CWE-400")
  const hasPii   = allText.includes("pii") || allText.includes("database") || allText.includes("postgres")

  if (hasSqli || hasPii || hasAuth) {
    compliance.push({
      framework: "PCI-DSS v4.0",
      controls: hasSqli ? ["Req 6.3.3 — Injection defences", "Req 6.4.1 — Web app protection"] : ["Req 8.2 — User ID management", "Req 1.3 — Inbound traffic restriction"],
      risk: cvss >= 7 ? "critical" : "high",
      reason: hasSqli ? "SQL injection directly violates PCI-DSS requirements for input validation and web application firewalls." : "Auth bypass violates PCI-DSS access control requirements.",
    })
  }
  if (hasPii || hasSqli || cvss >= 7) {
    compliance.push({
      framework: "GDPR",
      controls: ["Art. 32 — Technical security measures", "Art. 33 — Breach notification (72h)"],
      risk: hasPii ? "critical" : "high",
      reason: "Any breach of personal data requires mandatory 72-hour notification to supervisory authority and potential fines of up to 4% of global revenue.",
    })
  }
  compliance.push({
    framework: "SOC 2 Type II",
    controls: hasRce
      ? ["CC7.1 — System monitoring", "CC6.1 — Logical access", "CC6.7 — Data transmission"]
      : hasDos
      ? ["A1.2 — Availability capacity", "CC7.2 — Security event monitoring"]
      : ["CC6.1 — Logical access controls", "CC9.1 — Risk mitigation"],
    risk: cvss >= 7 ? "high" : "medium",
    reason: "Unmitigated vulnerabilities represent a material finding in SOC 2 Type II audits and may result in a qualified opinion.",
  })
  compliance.push({
    framework: "ISO 27001:2022",
    controls: ["A.12.6.1 — Technical vulnerability management", hasRce ? "A.14.2.1 — Secure development" : "A.9.4.2 — Secure log-on"],
    risk: cvss >= 9 ? "critical" : cvss >= 7 ? "high" : "medium",
    reason: "ISO 27001 Annex A.12.6 mandates timely patching of technical vulnerabilities within risk-accepted timeframes.",
  })

  // RTO / RPO based on severity
  const rtoMap = { critical: "< 4 hours", high: "< 24 hours", medium: "< 72 hours", low: "< 7 days" }
  const rpoMap = { critical: "< 1 hour",  high: "< 4 hours",  medium: "< 24 hours", low: "< 48 hours" }

  return {
    financialLevel,
    financialEstimate: financialMap[financialLevel].estimate,
    financialDesc: financialMap[financialLevel].desc,
    operationalDomains: domains,
    compliance,
    rtoRpo: { rto: rtoMap[financialLevel], rpo: rpoMap[financialLevel] },
  }
}

// ─── Terminal types & helpers ────────────────────────────────────────────────

type LineType = "info" | "success" | "error" | "warn" | "phase" | "data" | "dim" | "exploit"

interface TermLine { text: string; type: LineType }

function lineClass(t: LineType) {
  switch (t) {
    case "phase":   return "text-[#fbbf24] font-bold"
    case "success": return "text-[#4ade80]"
    case "error":   return "text-[#f87171]"
    case "warn":    return "text-[#fb923c]"
    case "info":    return "text-[#7dd3fc]"
    case "data":    return "text-[#c084fc]"
    case "exploit": return "text-[#e5e7eb] font-semibold"
    case "dim":     return "text-[#4b5563]"
    default:        return "text-[#e5e7eb]"
  }
}

function buildExploitScript(cveId: string, techniques: string[], cweIds: string[], blast: string | null): TermLine[] {
  const tech  = techniques[0] ?? "T1190"
  const cwe   = cweIds[0] ?? "CWE-79"
  const scope = blast ?? "web-application"
  const ts    = new Date().toISOString().replace("T", " ").slice(0, 19)

  return [
    { text: "╔══════════════════════════════════════════════════╗", type: "dim" },
    { text: "║  Sentinel AI  ·  Exploit Simulation Engine       ║", type: "dim" },
    { text: "║  Mode: sandboxed / dry-run  (no real systems)    ║", type: "dim" },
    { text: "╚══════════════════════════════════════════════════╝", type: "dim" },
    { text: "", type: "dim" },
    { text: `[${ts}] Initialising simulation for ${cveId}`, type: "info" },
    { text: `[*] MITRE : ${tech}   CWE: ${cwe}`, type: "info" },
    { text: `[*] Scope : ${scope}`, type: "info" },
    { text: "", type: "dim" },
    { text: "── PHASE 1  RECONNAISSANCE ─────────────────────────", type: "phase" },
    { text: "[*] Fingerprinting target stack…", type: "info" },
    { text: "[+] HTTP/1.1 200  X-Powered-By: Express 4.18.2", type: "success" },
    { text: "[+] Server: nginx/1.24.0 (Ubuntu)", type: "success" },
    { text: "[*] Crawling API surface…", type: "info" },
    { text: "[+] /api/v1 → 22 routes    /admin → 4 routes", type: "success" },
    { text: `[+] ${cweIds.includes("CWE-89") ? "UNION-injectable param: ?id=" : cweIds.includes("CWE-78") ? "OS cmd-injection vector: ?cmd=" : "Deserialisation endpoint: /api/deserialize"}`, type: "success" },
    { text: "[+] Vulnerable version banner confirmed", type: "exploit" },
    { text: "", type: "dim" },
    { text: "── PHASE 2  WEAPONISATION ──────────────────────────", type: "phase" },
    { text: "[*] Resolving module from catalog…", type: "info" },
    { text: `[+] Module: exploit/multi/${tech.toLowerCase().replace(".", "_")}`, type: "success" },
    { text: "[*] Generating payload…", type: "info" },
    { text: `[+] Payload: ${Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join("")}`, type: "data" },
    { text: "[*] Staging listener on 127.0.0.1:4444…", type: "info" },
    { text: "", type: "dim" },
    { text: "── PHASE 3  EXPLOITATION ───────────────────────────", type: "phase" },
    { text: "[*] Sending crafted request…", type: "info" },
    { text: "[!] HTTP 200 — payload accepted by target", type: "warn" },
    { text: `[+] Remote code execution triggered via ${cwe}`, type: "exploit" },
    { text: "[+] Callback received from sandbox environment", type: "success" },
    { text: "", type: "dim" },
    { text: "── PHASE 4  POST-EXPLOITATION ──────────────────────", type: "phase" },
    { text: "[*] Enumerating local environment…", type: "info" },
    { text: "[+] whoami → www-data", type: "data" },
    { text: "[+] uname -r → 5.15.0-1045-azure", type: "data" },
    { text: "[*] Checking privilege escalation paths…", type: "info" },
    { text: "[+] SUID: /usr/bin/pkexec — CVE-2021-4034 candidate", type: "warn" },
    { text: "[*] Attempting lateral movement to DB tier…", type: "info" },
    { text: "[+] DB creds extracted from environment variables", type: "exploit" },
    { text: "", type: "dim" },
    { text: "── PHASE 5  DATA ACCESS ────────────────────────────", type: "phase" },
    { text: "[*] Connecting to internal database…", type: "info" },
    { text: "[+] SELECT * FROM users LIMIT 5 → 5 rows returned", type: "data" },
    { text: `[+] { id:1, email:'admin@corp.internal', role:'admin' }`, type: "data" },
    { text: "[*] Exfil proof captured in simulation artefacts", type: "info" },
    { text: "", type: "dim" },
  ]
}

function buildResultLines(result: ExploitResult): TermLine[] {
  const success = result.success
  const conf    = Math.round((result.confidence ?? 0) * 100)
  const dur     = ((result.duration_ms ?? 0) / 1000).toFixed(1)
  return [
    { text: "── SIMULATION COMPLETE ─────────────────────────────", type: "phase" },
    { text: "", type: "dim" },
    { text: success
        ? `[✓] EXPLOIT SUCCESSFUL  confidence:${conf}%  duration:${dur}s`
        : `[✗] EXPLOIT BLOCKED     confidence:${conf}%  duration:${dur}s`,
      type: success ? "exploit" : "success" },
    { text: success
        ? "[!] This vulnerability is actively exploitable — patch immediately"
        : "[✓] Target appears mitigated or patched",
      type: success ? "error" : "success" },
    { text: `[*] Technique : ${result.technique ?? "T1190"}`, type: "info" },
    { text: `[*] Sandbox   : ${result.sandbox_id}`, type: "dim" },
    { text: `[*] Result ID : ${result.result_id}`, type: "dim" },
    { text: "", type: "dim" },
    { text: success
        ? "⚠  Recommend generating patch PR immediately"
        : "✓  No immediate action required — continue monitoring",
      type: success ? "warn" : "success" },
  ]
}

// Parse stored output_log_ref text back to TermLines (best-effort)
function parseStoredOutput(raw: string): TermLine[] {
  return raw.split("\n").map(line => {
    if (line.startsWith("[✓]") || line.startsWith("[+]") || line.startsWith("✓")) return { text: line, type: "success" as LineType }
    if (line.startsWith("[✗]") || line.startsWith("[-]")) return { text: line, type: "error" as LineType }
    if (line.startsWith("[!]") || line.startsWith("⚠")) return { text: line, type: "warn" as LineType }
    if (line.startsWith("[*]")) return { text: line, type: "info" as LineType }
    if (line.startsWith("──") || line.startsWith("╔") || line.startsWith("╚")) return { text: line, type: line.startsWith("──") ? "phase" as LineType : "dim" as LineType }
    if (line.startsWith("[SEED]")) return { text: line, type: "dim" as LineType }
    return { text: line, type: "info" as LineType }
  })
}

// ─── Terminal component ───────────────────────────────────────────────────────
// Fixed-height, stable layout — no ScrollArea (avoids page-level scrollIntoView jumps)

function ExploitTerminal({ lines, running }: { lines: TermLine[]; running: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll terminal container only — never the page
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="rounded-md overflow-hidden border border-[#30363d] bg-[#0d1117]">
      {/* Mac-style chrome bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] border-b border-[#30363d] select-none">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
        <span className="ml-2 font-mono text-[10px] text-[#6b7280]">sentinel-exploit-sim — bash</span>
        {running && (
          <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-[#fbbf24]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24] animate-pulse" />
            RUNNING
          </span>
        )}
      </div>

      {/* Fixed-height scroll container — direct DOM scrollTop avoids page jumps */}
      <div
        ref={containerRef}
        className="h-72 overflow-y-auto overscroll-contain p-4 font-mono text-[11px] leading-[1.7]"
        style={{ scrollBehavior: "auto" }}  // instant scroll, no smooth animation that fights page
      >
        {lines.length === 0 ? (
          <span className="text-[#4b5563]">
            {"// Click \"Run Exploit\" to start sandbox simulation…"}
          </span>
        ) : (
          lines.map((l, i) => (
            <div key={i} className={lineClass(l.type)}>
              {l.text || "\u00A0"}
            </div>
          ))
        )}
        {running && (
          <div className="text-[#4ade80] inline-block animate-pulse">█</div>
        )}
      </div>
    </div>
  )
}

// ─── Diff viewer ─────────────────────────────────────────────────────────────

function PatchDiff({ text }: { text: string }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed">
      {text.split("\n").map((line, i) => (
        <div
          key={i}
          className={
            line.startsWith("+")  ? "text-success" :
            line.startsWith("-")  ? "text-destructive" :
            line.startsWith("@@") ? "text-primary" :
            "text-muted-foreground"
          }
        >
          {line || "\u00A0"}
        </div>
      ))}
    </div>
  )
}

// ─── Risk badge helpers ───────────────────────────────────────────────────────

function riskBadge(risk: "critical" | "high" | "medium" | "low") {
  const m = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high:     "bg-warning/10 text-warning border-warning/20",
    medium:   "bg-chart-1/10 text-chart-1 border-chart-1/20",
    low:      "bg-muted text-muted-foreground border-border",
  }
  return m[risk]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VulnerabilityDetailPage({ params }: { params: Promise<{ cve: string }> }) {
  const { cve } = use(params)
  const router   = useRouter()
  const cveId    = decodeURIComponent(cve)

  // Vuln data
  const [vuln, setVuln]       = useState<Vulnerability | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Terminal
  const [termLines, setTermLines]         = useState<TermLine[]>([])
  const [exploitRunning, setExploitRunning] = useState(false)
  const [exploitResult, setExploitResult]   = useState<ExploitResult | null>(null)
  const [exploitError, setExploitError]     = useState<string | null>(null)

  // Patch PR
  const [patchLoading, setPatchLoading] = useState(false)
  const [patchResult, setPatchResult]   = useState<(PatchRecord & { patch_explanation?: string }) | null>(null)
  const [patchError, setPatchError]     = useState<string | null>(null)

  // History expand
  const [showHistory, setShowHistory] = useState(false)
  const [historyOutput, setHistoryOutput] = useState<TermLine[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load vulnerability
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const list = await vulnsApi.list({ cve: cveId, limit: 1 })
        if (!list.vulnerabilities.length) { setError("Not found"); setLoading(false); return }
        const full = await vulnsApi.get(list.vulnerabilities[0].vuln_id)
        if (!cancelled) setVuln(full)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [cveId])

  // Stream lines one-by-one — pure state push, no scrollIntoView
  const streamLines = useCallback((lines: TermLine[], onDone?: () => void) => {
    let i = 0
    function next() {
      if (i >= lines.length) { onDone?.(); return }
      const line = lines[i++]
      setTermLines(prev => [...prev, line])
      const delay = line.type === "phase" ? 160 : line.type === "dim" ? 15 : 45 + Math.random() * 50
      setTimeout(next, delay)
    }
    next()
  }, [])

  const runExploit = useCallback(async () => {
    if (!vuln) return
    setTermLines([])
    setExploitRunning(true)
    setExploitResult(null)
    setExploitError(null)

    const script = buildExploitScript(vuln.cve_id, vuln.mitre_techniques ?? [], vuln.cwe_ids ?? [], vuln.blast_radius)

    streamLines(script, async () => {
      try {
        const result = await simulationApi.run({
          vuln_id: vuln.vuln_id,
          cve_id: vuln.cve_id,
          target_host: "sandbox.internal",
          operator_id: "sentinel-operator",
          dry_run: true,
        })
        setExploitResult(result)
        const resultLines = buildResultLines(result)
        streamLines(resultLines, async () => {
          setExploitRunning(false)
          // Save terminal output to DB
          if (result.result_id) {
            const allLines = [...script, ...resultLines]
            const outputText = allLines.map(l => l.text).join("\n")
            try {
              await simulationApi.saveOutput(result.result_id, outputText)
            } catch {
              // Non-critical — output just won't persist
            }
          }
        })
      } catch (err) {
        const msg = String(err)
        setExploitError(msg)
        streamLines([
          { text: "", type: "dim" },
          { text: `[✗] API error: ${msg}`, type: "error" },
          { text: "[*] Demo output shown — backend may be unreachable", type: "dim" },
        ], () => setExploitRunning(false))
      }
    })
  }, [vuln, streamLines])

  // Load stored output from a previous exploit run
  const loadHistoryOutput = useCallback(async (resultId: string) => {
    setHistoryLoading(true)
    setShowHistory(true)
    setHistoryOutput([])
    try {
      const res = await simulationApi.getResult(resultId)
      if (res.output_log_ref) {
        setHistoryOutput(parseStoredOutput(res.output_log_ref))
      } else {
        setHistoryOutput([{ text: "[no stored output for this run]", type: "dim" }])
      }
    } catch {
      setHistoryOutput([{ text: "[could not load output]", type: "error" }])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const generatePatch = useCallback(async () => {
    if (!vuln) return
    setPatchLoading(true); setPatchResult(null); setPatchError(null)
    try {
      const res = await patchesApi.generate(vuln.vuln_id)
      setPatchResult(res)
      toast.success("Patch PR created", { description: res.branch_name ?? "See Patch Automation" })
    } catch (err) {
      const msg = String(err)
      setPatchError(msg)
      toast.error("Patch generation failed", { description: msg })
    } finally {
      setPatchLoading(false)
    }
  }, [vuln])

  // ─── Loading / error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col">
      <AppHeader title="Vulnerability Detail" />
      <div className="flex flex-col items-center justify-center gap-3 p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading {cveId}…</p>
      </div>
    </div>
  )

  if (error || !vuln) return (
    <div className="flex flex-col">
      <AppHeader title="Vulnerability Detail" />
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <XCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? "Vulnerability not found"}</p>
        <Link href="/vulnerabilities"><Button variant="outline" size="sm"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back</Button></Link>
      </div>
    </div>
  )

  const cvss          = vuln.cvss_v3 ?? 0
  const epss          = vuln.epss_score ?? 0
  const techniques    = vuln.mitre_techniques ?? []
  const cweIds        = vuln.cwe_ids ?? []
  const assets        = vuln.affected_assets ?? []
  const exploitHist   = vuln.exploit_history ?? []
  const patchHist     = vuln.patch_history ?? []
  const impact        = computeBusinessImpact(vuln)

  return (
    <div className="flex flex-col">
      <AppHeader title={`CVE Detail — ${vuln.cve_id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/vulnerabilities" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Vulnerabilities
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold">{vuln.cve_id}</span>
        </div>

        {/* Hero */}
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xl font-black text-card-foreground">{vuln.cve_id}</span>
                  <Badge variant="outline" className={cvssColor(cvss)}>{cvssLabel(cvss)}</Badge>
                  <Badge variant="outline" className={statusColor(vuln.remediation_status)}>
                    {vuln.remediation_status.replace("_", " ")}
                  </Badge>
                  {vuln.kev_status && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      <AlertTriangle className="mr-1 h-2.5 w-2.5" />CISA KEV
                    </Badge>
                  )}
                  {exploitHist.some(e => e.success) && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      <Bug className="mr-1 h-2.5 w-2.5" />Exploit Confirmed
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-xl">
                  {vuln.blast_radius ? `${vuln.blast_radius}  ·  Source: ${vuln.scan_source ?? "scanner"}` : `Detected via ${vuln.scan_source ?? "scanner"}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {[
                  { label: "CVSS v3", value: cvss.toFixed(1), color: cvss >= 9 ? "text-destructive" : cvss >= 7 ? "text-warning" : "text-chart-1" },
                  { label: "EPSS",    value: `${(epss * 100).toFixed(1)}%`, color: "text-primary" },
                  { label: "Runs",    value: String(exploitHist.length),    color: "text-card-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className={`font-mono text-2xl font-black ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Badges row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {cweIds.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">CWE IDs</p>
                    <div className="flex flex-wrap gap-1">{cweIds.map(c => <Badge key={c} variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">{c}</Badge>)}</div>
                  </CardContent>
                </Card>
              )}
              {techniques.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">MITRE ATT&CK</p>
                    <div className="flex flex-wrap gap-1">{techniques.map(t => <Badge key={t} variant="outline" className="font-mono text-[10px]">{t}</Badge>)}</div>
                  </CardContent>
                </Card>
              )}
              {assets.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Affected Assets</p>
                    <div className="flex flex-wrap gap-1">
                      {assets.slice(0, 4).map(a => <Badge key={a} variant="outline" className="font-mono text-[10px]">{a}</Badge>)}
                      {assets.length > 4 && <Badge variant="outline" className="text-[10px] text-muted-foreground">+{assets.length - 4}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Scores */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" /> Vulnerability Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {[
                    ["Status",       vuln.remediation_status.replace("_", " "), "capitalize"],
                    ["Scan source",  vuln.scan_source ?? "—", "font-mono"],
                    ["Blast radius", vuln.blast_radius ?? "—", ""],
                    ["Detected",     new Date(vuln.detection_at).toLocaleDateString(), "font-mono"],
                    ["KEV",          vuln.kev_status ? "CISA KEV listed" : "Not listed", vuln.kev_status ? "text-destructive" : "text-muted-foreground"],
                    ["Vuln ID",      vuln.vuln_id.slice(0, 16) + "…", "font-mono text-[10px] text-muted-foreground"],
                  ].map(([label, value, extra]) => (
                    <div key={label}>
                      <span className="text-muted-foreground">{label}</span>
                      <p className={`mt-0.5 font-medium ${extra}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {[
                  { label: "CVSS v3", value: cvss * 10, display: `${cvss.toFixed(1)} / 10.0`, color: cvss >= 9 ? "[&>div]:bg-destructive" : cvss >= 7 ? "[&>div]:bg-warning" : "[&>div]:bg-chart-1" },
                  { label: "EPSS Exploitation Probability", value: epss * 100, display: `${(epss * 100).toFixed(2)}%`, color: "[&>div]:bg-primary" },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{bar.label}</span>
                      <span className="font-mono font-bold">{bar.display}</span>
                    </div>
                    <Progress value={bar.value} className={`h-1.5 ${bar.color}`} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ── Business Impact ──────────────────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-warning" /> Business Impact & Compliance Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Financial exposure */}
                <div className="rounded-md border border-border bg-background/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-warning" />
                      <span className="text-sm font-semibold text-card-foreground">Financial Exposure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={riskBadge(impact.financialLevel)}>
                        {impact.financialLevel.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-sm font-bold text-warning">{impact.financialEstimate}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{impact.financialDesc}</p>
                </div>

                {/* Operational domains */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Operational Domains at Risk</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {impact.operationalDomains.map(d => (
                      <div key={d.name} className="flex items-start gap-2 rounded-md border border-border bg-background/50 p-3">
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${riskBadge(d.risk)} border`}>
                          {d.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold text-card-foreground">{d.name}</span>
                            <Badge variant="outline" className={`${riskBadge(d.risk)} text-[9px] py-0`}>{d.risk}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{d.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance frameworks */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Compliance Frameworks Affected</p>
                  <div className="flex flex-col gap-2">
                    {impact.compliance.map(c => (
                      <div key={c.framework} className="rounded-md border border-border bg-background/50 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-card-foreground">{c.framework}</span>
                          </div>
                          <Badge variant="outline" className={riskBadge(c.risk)}>{c.risk}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.controls.map(ctrl => (
                            <Badge key={ctrl} variant="outline" className="font-mono text-[9px] bg-muted/50">
                              {ctrl}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{c.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RTO / RPO */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Recovery Time Objective (RTO)", value: impact.rtoRpo.rto, icon: <Clock className="h-3.5 w-3.5 text-warning" /> },
                    { label: "Recovery Point Objective (RPO)", value: impact.rtoRpo.rpo, icon: <Target className="h-3.5 w-3.5 text-warning" /> },
                  ].map(item => (
                    <div key={item.label} className="rounded-md border border-border bg-background/50 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.icon}
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-card-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Exploit Terminal ──────────────────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" /> Exploit Simulation Terminal
                  </CardTitle>
                  <Button
                    size="sm"
                    disabled={exploitRunning || vuln.remediation_status === "verified"}
                    className="h-7 gap-1.5 bg-destructive/90 text-white hover:bg-destructive text-xs"
                    onClick={runExploit}
                  >
                    {exploitRunning
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Running…</>
                      : <><Zap className="h-3 w-3" /> Run Exploit</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {/* Terminal is ALWAYS rendered with fixed height — prevents layout shift */}
                <ExploitTerminal lines={termLines} running={exploitRunning} />

                {/* Result summary strip — only shown after completion */}
                {exploitResult && !exploitRunning && (
                  <div className={`rounded-md border p-3 ${exploitResult.success ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/5"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {exploitResult.success
                          ? <XCircle className="h-4 w-4 text-destructive" />
                          : <CheckCircle2 className="h-4 w-4 text-success" />}
                        <span className={`text-sm font-semibold ${exploitResult.success ? "text-destructive" : "text-success"}`}>
                          {exploitResult.success ? "Exploit Successful — Patch Required" : "Exploit Blocked — Mitigated"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Confidence: <span className="font-mono font-bold text-card-foreground">{Math.round((exploitResult.confidence ?? 0) * 100)}%</span></span>
                        <span>Duration: <span className="font-mono font-bold text-card-foreground">{((exploitResult.duration_ms ?? 0) / 1000).toFixed(1)}s</span></span>
                      </div>
                    </div>
                  </div>
                )}
                {exploitError && !exploitRunning && (
                  <div className="rounded-md border border-warning/20 bg-warning/5 p-3">
                    <p className="text-xs text-warning"><AlertTriangle className="inline h-3.5 w-3.5 mr-1" />Demo mode — backend unreachable: {exploitError}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Generate Patch PR ────────────────────────────────────── */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <GitPullRequest className="h-3.5 w-3.5" /> AI Patch Generation
                  </CardTitle>
                  <Button size="sm" disabled={patchLoading} className="h-7 gap-1.5 text-xs" onClick={generatePatch}>
                    {patchLoading
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                      : <><GitPullRequest className="h-3 w-3" /> Generate Patch PR</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!patchResult && !patchLoading && !patchError ? (
                  <div className="rounded-md border border-dashed border-border bg-background/50 p-6 text-center">
                    <GitPullRequest className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary font-semibold">Generate Patch PR</span> — Claude AI writes a security fix and opens a GitHub PR
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Branch created · patch committed · PR opened automatically</p>
                  </div>
                ) : patchLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Claude AI is analysing {cweIds.join(", ")} and writing a fix…</p>
                  </div>
                ) : patchResult ? (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-md border border-success/20 bg-success/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm font-semibold text-success">Patch PR Created</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        {patchResult.branch_name && (
                          <div>
                            <span className="text-muted-foreground">Branch</span>
                            <p className="mt-0.5 font-mono text-[10px] bg-background rounded px-1.5 py-0.5 border border-border inline-block">{patchResult.branch_name}</p>
                          </div>
                        )}
                        {patchResult.commit_sha && (
                          <div>
                            <span className="text-muted-foreground">Commit</span>
                            <p className="mt-0.5 font-mono text-[10px]">{patchResult.commit_sha.slice(0, 10)}</p>
                          </div>
                        )}
                        <div><span className="text-muted-foreground">CI</span><p className="mt-0.5 capitalize">{patchResult.ci_status ?? "pending"}</p></div>
                        <div><span className="text-muted-foreground">Merge</span><p className="mt-0.5 capitalize">{patchResult.merge_status ?? "pending"}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {patchResult.pr_url && (
                          <a href={patchResult.pr_url} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="h-7 text-xs border-border"><ExternalLink className="h-3 w-3 mr-1" />Open PR</Button>
                          </a>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs border-border" onClick={() => router.push("/patch-automation")}>View in Patch Automation</Button>
                      </div>
                    </div>
                    {patchResult.patch_explanation && <PatchDiff text={patchResult.patch_explanation} />}
                  </div>
                ) : patchError ? (
                  <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-xs text-destructive"><XCircle className="inline h-3.5 w-3.5 mr-1" />{patchError}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* ── Exploit History ───────────────────────────────────────── */}
            {exploitHist.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Bug className="h-3.5 w-3.5" /> Exploit History ({exploitHist.length} runs)
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {exploitHist.slice(0, 6).map(run => (
                    <div key={run.result_id} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[10px] ${run.success ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"}`}>
                          {run.success ? "EXPLOITED" : "BLOCKED"}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">{run.technique ?? "T1190"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">
                          conf: <span className="font-mono font-bold text-card-foreground">{Math.round((run.confidence ?? 0) * 100)}%</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(run.executed_at).toLocaleDateString()}</span>
                        <Button
                          variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
                          onClick={() => loadHistoryOutput(run.result_id)}
                        >
                          <Terminal className="h-2.5 w-2.5 mr-1" />Output
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* Stored output viewer */}
                  {showHistory && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Stored terminal output</span>
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => setShowHistory(false)}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </div>
                      {historyLoading
                        ? <div className="flex items-center gap-2 p-4 rounded-md bg-[#0d1117]"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#4ade80]" /><span className="text-[11px] text-[#4b5563] font-mono">Loading output…</span></div>
                        : <ExploitTerminal lines={historyOutput} running={false} />
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Patch History */}
            {patchHist.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Patch History ({patchHist.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {patchHist.slice(0, 4).map(p => (
                    <div key={p.patch_id} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[10px] ${p.ci_status === "passed" ? "bg-success/10 text-success border-success/20" : p.ci_status === "failed" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground border-border"}`}>
                          CI: {p.ci_status ?? "pending"}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-36">{p.branch_name ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.pr_url && <a href={p.pr_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]"><ExternalLink className="h-2.5 w-2.5 mr-0.5" />PR</Button></a>}
                        <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Quick actions */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button disabled={exploitRunning || vuln.remediation_status === "verified"} className="w-full bg-destructive/90 text-white hover:bg-destructive" size="sm" onClick={runExploit}>
                  {exploitRunning ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Running…</> : <><Zap className="mr-1.5 h-3.5 w-3.5" />Run Exploit</>}
                </Button>
                <Button disabled={patchLoading} className="w-full" size="sm" onClick={generatePatch}>
                  {patchLoading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating…</> : <><GitPullRequest className="mr-1.5 h-3.5 w-3.5" />Generate Patch PR</>}
                </Button>
                <Button variant="outline" className="w-full border-border" size="sm" onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`, "_blank")}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />NVD Entry
                </Button>
                <Separator className="bg-border my-1" />
                <Button variant="outline" className="w-full border-border" size="sm" onClick={() => router.push("/patch-automation")}><Lock className="mr-1.5 h-3.5 w-3.5" />Patch Automation</Button>
                <Button variant="outline" className="w-full border-border" size="sm" onClick={() => router.push("/exploit-lab")}><Bug className="mr-1.5 h-3.5 w-3.5" />Exploit Lab</Button>
                <Button variant="outline" className="w-full border-border" size="sm" onClick={() => router.push("/compliance")}><FileCheck className="mr-1.5 h-3.5 w-3.5" />Compliance</Button>
              </CardContent>
            </Card>

            {/* CVSS gauge */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col items-center py-2">
                  <div className={`text-5xl font-mono font-black ${cvss >= 9 ? "text-destructive" : cvss >= 7 ? "text-warning" : "text-chart-1"}`}>{cvss.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{cvssLabel(cvss)} Severity</div>
                </div>
                <Progress value={cvss * 10} className={`h-2 ${cvss >= 9 ? "[&>div]:bg-destructive" : cvss >= 7 ? "[&>div]:bg-warning" : "[&>div]:bg-chart-1"}`} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>0.0</span><span>5.0</span><span>10.0</span></div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 text-xs">
                {[
                  { label: "EPSS Score",  value: `${(epss * 100).toFixed(2)}%`, cls: "font-mono font-bold text-primary" },
                  { label: "KEV",         value: vuln.kev_status ? "CISA KEV listed" : "Not listed", cls: vuln.kev_status ? "text-destructive font-semibold" : "text-muted-foreground" },
                  { label: "Exploit runs", value: String(exploitHist.length), cls: "font-mono" },
                  { label: "Confirmed",   value: String(exploitHist.filter(e => e.success).length), cls: `font-mono ${exploitHist.some(e => e.success) ? "text-destructive" : "text-success"}` },
                  { label: "Patch PRs",   value: String(patchHist.length), cls: "font-mono" },
                  { label: "Detected",    value: new Date(vuln.detection_at).toLocaleDateString(), cls: "font-mono text-[10px]" },
                ].map(({ label, value, cls }) => (
                  <div key={label}>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cls}>{value}</span>
                    </div>
                    <Separator className="bg-border mt-2" />
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vuln ID</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{vuln.vuln_id.slice(0, 8)}…</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { navigator.clipboard.writeText(vuln.vuln_id); toast.success("Copied") }}>
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
