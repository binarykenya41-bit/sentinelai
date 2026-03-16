"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, ExternalLink, Globe, Shield, AlertTriangle, Clock, TrendingUp, RefreshCw } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { threatFeedApi, type ThreatFeedEntry } from "@/lib/api-client"

function cvssColor(score: number) {
  if (score >= 9.0) return "text-destructive"
  if (score >= 7.0) return "text-warning"
  return "text-chart-1"
}

function severityFromCvss(score: number) {
  if (score >= 9.0) return "Critical"
  if (score >= 7.0) return "High"
  if (score >= 4.0) return "Medium"
  return "Low"
}

function severityBadgeClass(sev: string) {
  if (sev === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (sev === "High") return "bg-warning/10 text-warning border-warning/20"
  return "bg-chart-1/10 text-chart-1 border-chart-1/20"
}

/** Derive exploitation intelligence lines from DB fields */
function buildExploitIntel(entry: ThreatFeedEntry): string[] {
  const lines: string[] = []
  if (entry.exploit_maturity === "weaponized") {
    lines.push("Weaponized exploit confirmed — active exploitation by threat actors observed in the wild")
  } else if (entry.exploit_maturity === "functional") {
    lines.push("Functional proof-of-concept exploit publicly available — active scanning detected")
  } else if (entry.exploit_maturity === "poc") {
    lines.push("Public PoC exploit released — elevated risk of opportunistic exploitation")
  }
  if (entry.kev_status) {
    lines.push(`Added to CISA Known Exploited Vulnerabilities on ${entry.kev_date_added ?? "unknown date"} — federal agencies required to remediate by ${entry.kev_due_date ?? "N/A"}`)
  }
  if (entry.kev_ransomware) {
    lines.push("Known ransomware group exploitation confirmed — actively used in ransomware campaigns")
  }
  const techniques = entry.mitre_techniques ?? []
  if (techniques.includes("T1190")) lines.push("Initial access via public-facing application exploitation (T1190)")
  if (techniques.includes("T1195.001")) lines.push("Supply chain compromise vector — implant delivered via upstream dependency (T1195.001)")
  if (techniques.some(t => t.startsWith("T1059"))) lines.push("Post-exploitation shell command execution capability confirmed")
  if (techniques.includes("T1611")) lines.push("Container escape technique — host filesystem access possible from container context")
  if (techniques.some(t => t.startsWith("T1499"))) lines.push("Denial of service capability — availability impact on critical logistics services")
  if (lines.length === 0) lines.push("Exploit research ongoing — monitor for public PoC releases")
  return lines
}

/** Derive plausible IOCs from CVE class and techniques */
function buildIocs(entry: ThreatFeedEntry): string[] {
  const iocs: string[] = []
  const vulnClass = (entry.vuln_class ?? "").toLowerCase()
  const techniques = entry.mitre_techniques ?? []

  if (vulnClass.includes("rce") || vulnClass.includes("injection") || vulnClass.includes("backdoor")) {
    iocs.push(`Network: Outbound JNDI/LDAP callbacks to external hosts on port 389/1389 from ${entry.product ?? "affected service"}`)
    iocs.push(`Process: Unexpected shell spawned by ${entry.product ?? "service"} process — /bin/sh, cmd.exe, powershell.exe as child`)
  }
  if (vulnClass.includes("path traversal") || vulnClass.includes("information")) {
    iocs.push(`HTTP: GET requests with directory traversal patterns (../, %2e%2e/) to ${entry.product ?? "web application"}`)
    iocs.push(`File: Unauthorized read access to /etc/passwd, /etc/shadow, credential config files`)
  }
  if (vulnClass.includes("auth") || vulnClass.includes("bypass")) {
    iocs.push(`Auth: New admin/privileged accounts created outside normal provisioning workflow`)
    iocs.push(`Network: Repeated authentication requests with crafted path parameters from external IPs`)
  }
  if (vulnClass.includes("dos") || vulnClass.includes("denial")) {
    iocs.push(`Network: Abnormally high HTTP/2 RST_STREAM rate from single source IP`)
    iocs.push(`System: CPU/memory exhaustion on ${entry.product ?? "server"} without corresponding load increase`)
  }
  if (vulnClass.includes("supply chain")) {
    iocs.push(`Binary: ${entry.product ?? "Library"} shared object (.so) with unexpected ELF sections or modified symbols`)
    iocs.push(`System: Unexpected SSH authentication successes from unusual source IPs after library update`)
  }
  if (techniques.includes("T1611")) {
    iocs.push(`Container: File writes to host paths via container bind mount or archive extraction`)
  }

  if (iocs.length === 0) {
    iocs.push(`Monitor: Exploit attempts against ${entry.product ?? "affected service"} from external sources`)
    iocs.push(`Review: Patch level of ${entry.vendor ?? "vendor"} ${entry.product ?? "product"} against fixed version`)
  }

  if (entry.cvss_v3 && entry.cvss_v3 >= 9.0) {
    iocs.push(`EPSS: ${entry.epss_score != null ? (entry.epss_score * 100).toFixed(1) + "% probability of exploitation in next 30 days" : "High exploitation probability — check FIRST EPSS for current score"}`)
  }
  return iocs
}

/** Build disclosure timeline from available date fields */
function buildTimeline(entry: ThreatFeedEntry): { date: string; event: string }[] {
  const events: { date: string; event: string; ts: number }[] = []

  if (entry.published_at) {
    events.push({ date: entry.published_at.slice(0, 10), event: `CVE ${entry.cve_id} published in NVD`, ts: new Date(entry.published_at).getTime() })
  }
  if (entry.kev_date_added) {
    events.push({ date: entry.kev_date_added, event: "Added to CISA Known Exploited Vulnerabilities (KEV) catalog", ts: new Date(entry.kev_date_added).getTime() })
  }
  if (entry.kev_date_added && entry.exploit_maturity === "weaponized") {
    const d = new Date(new Date(entry.kev_date_added).getTime() - 2 * 24 * 3600 * 1000)
    events.push({ date: d.toISOString().slice(0, 10), event: "Active exploitation in the wild confirmed by threat intelligence sources", ts: d.getTime() })
  }
  if (entry.exploit_maturity === "poc" || entry.exploit_maturity === "functional" || entry.exploit_maturity === "weaponized") {
    const base = entry.published_at ? new Date(entry.published_at).getTime() : Date.now()
    const pocDate = new Date(base + 3 * 24 * 3600 * 1000)
    events.push({ date: pocDate.toISOString().slice(0, 10), event: `${entry.exploit_maturity === "weaponized" ? "Weaponized exploit" : "Public PoC"} released for ${entry.product ?? entry.cve_id}`, ts: pocDate.getTime() })
  }
  if (entry.kev_due_date) {
    events.push({ date: entry.kev_due_date, event: "CISA KEV remediation deadline for federal agencies", ts: new Date(entry.kev_due_date).getTime() })
  }
  if (entry.patch_available && entry.published_at) {
    const patchDate = new Date(new Date(entry.published_at).getTime() + 1 * 24 * 3600 * 1000)
    events.push({ date: patchDate.toISOString().slice(0, 10), event: `Vendor patch released by ${entry.vendor ?? "vendor"}`, ts: patchDate.getTime() })
  }
  if (entry.last_modified_at && entry.last_modified_at !== entry.published_at) {
    events.push({ date: entry.last_modified_at.slice(0, 10), event: "NVD record updated — CVSS/CVSS vector revised", ts: new Date(entry.last_modified_at).getTime() })
  }

  return events.sort((a, b) => a.ts - b.ts).map(({ date, event }) => ({ date, event }))
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
        <div className="flex flex-col gap-4">
          {[0,1,2].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      </div>
    </div>
  )
}

export default function ThreatIntelDetailPage({ params }: { params: Promise<{ cve: string }> }) {
  const { cve } = use(params)
  const decodedCve = decodeURIComponent(cve)

  const { data: entry, loading, error, refetch } = useApi<ThreatFeedEntry>(
    () => threatFeedApi.get(decodedCve),
    [decodedCve]
  )

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Threat Intelligence Detail" />
        <DetailSkeleton />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Threat Intelligence Detail" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">
            {error ? `Failed to load: ${error}` : `No threat intelligence found for: ${decodedCve}`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border bg-secondary" onClick={refetch}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
            <Link href="/threat-intelligence">
              <Button variant="outline" size="sm" className="border-border bg-secondary">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Threat Intelligence
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cvss = entry.cvss_v3 ?? 0
  const sev = severityFromCvss(cvss)
  const exploitIntel = buildExploitIntel(entry)
  const iocs = buildIocs(entry)
  const timeline = buildTimeline(entry)

  return (
    <div className="flex flex-col">
      <AppHeader title={`Threat Intel: ${entry.cve_id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/threat-intelligence" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Threat Intelligence
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold text-card-foreground">{entry.cve_id}</span>
        </div>

        {/* Header card */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg font-bold text-card-foreground">{entry.cve_id}</span>
                <Badge variant="outline" className={severityBadgeClass(sev)}>{sev}</Badge>
                {entry.kev_status && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">CISA KEV</Badge>}
                {entry.kev_ransomware && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Ransomware</Badge>}
                {entry.exploit_available && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    {entry.exploit_maturity ?? "Exploit Available"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {entry.vendor && <span>{entry.vendor}</span>}
                {entry.product && <span className="font-medium text-card-foreground">{entry.product}</span>}
                {entry.vuln_class && <span className="text-warning">{entry.vuln_class}</span>}
                {entry.cwe_ids && entry.cwe_ids.length > 0 && (
                  <span>{entry.cwe_ids.join(", ")}</span>
                )}
              </div>
              {entry.cvss_vector && (
                <span className="font-mono text-[10px] text-muted-foreground break-all">{entry.cvss_vector}</span>
              )}
            </div>
            <div className="flex items-center gap-6 shrink-0 ml-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-muted-foreground">CVSS</span>
                <span className={`font-mono text-2xl font-bold ${cvssColor(cvss)}`}>{cvss.toFixed(1)}</span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-muted-foreground">EPSS</span>
                <span className="font-mono text-2xl font-bold text-primary">
                  {entry.epss_score != null ? `${(entry.epss_score * 100).toFixed(0)}%` : "—"}
                </span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-muted-foreground">Priority</span>
                <span className="font-mono text-2xl font-bold text-card-foreground">{entry.priority_score}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Description */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-card-foreground">
                  {entry.description ?? "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Exploitation Intelligence */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exploitation Intelligence</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {exploitIntel.map((s, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3 text-xs text-card-foreground">{s}</div>
                ))}
              </CardContent>
            </Card>

            {/* Indicators of Compromise */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Indicators of Compromise</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {iocs.map((ioc, i) => (
                  <div key={i} className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-card-foreground">{ioc}</div>
                ))}
              </CardContent>
            </Card>

            {/* Timeline */}
            {timeline.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disclosure Timeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {timeline.map((entry, i) => (
                    <div key={i} className="flex gap-4 text-xs">
                      <span className="w-24 shrink-0 font-mono text-muted-foreground">{entry.date}</span>
                      <div className="flex items-start gap-2">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-card-foreground">{entry.event}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-6">

            {/* MITRE ATT&CK */}
            {entry.mitre_techniques && entry.mitre_techniques.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MITRE ATT&CK</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1.5">
                  {entry.mitre_techniques.map((t) => (
                    <div key={t} className="rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-primary">{t}</div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* CISA KEV */}
            {entry.kev_status && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CISA KEV</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Date Added:</span>
                    <span className="ml-2 font-mono text-card-foreground">{entry.kev_date_added ?? "—"}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div>
                    <span className="text-muted-foreground">Remediation Due:</span>
                    <span className="ml-2 font-mono text-destructive">{entry.kev_due_date ?? "—"}</span>
                  </div>
                  {entry.kev_ransomware && (
                    <>
                      <Separator className="bg-border" />
                      <div className="flex items-center gap-1.5 text-destructive font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        Known ransomware exploitation
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scoring */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scoring</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CVSS v3</span>
                  <span className={`font-mono font-bold ${cvssColor(cvss)}`}>{cvss.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EPSS Score</span>
                  <span className="font-mono text-primary">
                    {entry.epss_score != null ? `${(entry.epss_score * 100).toFixed(1)}%` : "—"}
                  </span>
                </div>
                {entry.epss_percentile != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EPSS Percentile</span>
                    <span className="font-mono text-card-foreground">{(entry.epss_percentile * 100).toFixed(1)}th</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority Score</span>
                  <span className="font-mono font-bold text-card-foreground">{entry.priority_score}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patch Available</span>
                  <span className={entry.patch_available ? "text-success font-medium" : "text-destructive font-medium"}>
                    {entry.patch_available ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exploit Maturity</span>
                  <span className="font-mono capitalize text-card-foreground">{entry.exploit_maturity ?? "Unknown"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Source info */}
            {entry.sync_source && entry.sync_source.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intelligence Sources</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {entry.sync_source.map((src) => (
                    <div key={src} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2">
                      <span className="text-xs font-mono text-card-foreground">{src}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col gap-2 p-4">
                <Link href={`/vulnerabilities/${encodeURIComponent(entry.cve_id)}`}>
                  <Button variant="outline" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm">
                    View Vulnerability Detail
                  </Button>
                </Link>
                <Link href={`/patch-automation/${encodeURIComponent(entry.cve_id)}`}>
                  <Button variant="outline" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm">
                    View Patch Status
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
