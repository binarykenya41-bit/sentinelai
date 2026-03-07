"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ExternalLink, Globe, Shield, AlertTriangle, Clock, TrendingUp } from "lucide-react"

interface ThreatDetail {
  cve: string
  product: string
  vendor: string
  cvss: number
  epss: number
  cisaKev: boolean
  kevDateAdded: string
  kevDueDate: string
  description: string
  mitreTechniques: string[]
  affectedVersions: string
  fixedVersion: string
  references: { label: string; url: string }[]
  exploitInWild: boolean
  exploitSources: string[]
  iocs: string[]
  timeline: { date: string; event: string }[]
}

const threats: Record<string, ThreatDetail> = {
  "CVE-2026-21001": {
    cve: "CVE-2026-21001", product: "OpenSSL", vendor: "OpenSSL Project",
    cvss: 9.8, epss: 0.94, cisaKev: true,
    kevDateAdded: "2026-03-02", kevDueDate: "2026-03-16",
    description: "A buffer overflow vulnerability in the TLS 1.3 handshake processing of OpenSSL 3.1.4 allows unauthenticated remote attackers to achieve remote code execution via a crafted ClientHello message with an oversized session ticket extension.",
    mitreTechniques: ["T1190 - Exploit Public-Facing Application", "T1059.004 - Unix Shell"],
    affectedVersions: "OpenSSL 3.1.0 through 3.1.4",
    fixedVersion: "OpenSSL 3.1.5",
    references: [
      { label: "NVD Entry", url: "#" },
      { label: "OpenSSL Advisory", url: "#" },
      { label: "CISA KEV", url: "#" },
    ],
    exploitInWild: true,
    exploitSources: ["Confirmed exploitation by APT groups targeting financial sector", "Public PoC released on GitHub (2026-03-01)", "Metasploit module available"],
    iocs: ["SHA256: a3f8d2...c91b (exploit payload)", "C2 domain: tls-update[.]services", "IP: 185.220.101.x (scanning activity)"],
    timeline: [
      { date: "2026-02-20", event: "Vulnerability reported to OpenSSL via HackerOne" },
      { date: "2026-02-26", event: "CVE reserved and advisory pre-published to distros" },
      { date: "2026-02-28", event: "Public disclosure and patch release (3.1.5)" },
      { date: "2026-03-01", event: "First public PoC exploit released" },
      { date: "2026-03-02", event: "Added to CISA Known Exploited Vulnerabilities catalog" },
      { date: "2026-03-02", event: "Active exploitation observed in the wild" },
      { date: "2026-03-03", event: "SentinelAI simulation confirmed full exploit chain" },
    ],
  },
  "CVE-2026-18823": {
    cve: "CVE-2026-18823", product: "Apache Log4j", vendor: "Apache Software Foundation",
    cvss: 8.8, epss: 0.87, cisaKev: true,
    kevDateAdded: "2026-03-01", kevDueDate: "2026-03-15",
    description: "JNDI injection via crafted log message patterns in log4j-core 2.17.1 bypasses existing lookup restrictions, allowing arbitrary code execution on Java-based systems processing untrusted log data.",
    mitreTechniques: ["T1059 - Command and Scripting Interpreter", "T1190 - Exploit Public-Facing Application"],
    affectedVersions: "log4j-core 2.17.0 through 2.17.1",
    fixedVersion: "log4j-core 2.21.0",
    references: [
      { label: "NVD Entry", url: "#" },
      { label: "Apache Advisory", url: "#" },
    ],
    exploitInWild: true,
    exploitSources: ["Nested JNDI lookup bypass observed in APT campaigns", "Public PoC on exploit-db"],
    iocs: ["Payload pattern: ${jndi:ldap://...", "C2 domain: log4j-patch[.]download"],
    timeline: [
      { date: "2026-02-22", event: "Vulnerability discovered by internal ASF audit" },
      { date: "2026-02-27", event: "Public disclosure and advisory" },
      { date: "2026-03-01", event: "Added to CISA KEV" },
      { date: "2026-03-03", event: "SentinelAI confirmed exploitation in simulation" },
    ],
  },
}

function cvssColor(score: number) {
  if (score >= 9.0) return "text-destructive"
  if (score >= 7.0) return "text-warning"
  return "text-chart-1"
}

export default function ThreatIntelDetailPage({ params }: { params: Promise<{ cve: string }> }) {
  const { cve } = use(params)
  const decodedCve = decodeURIComponent(cve)
  const threat = threats[decodedCve]

  if (!threat) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Threat Intelligence Detail" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Threat intelligence not found for: {decodedCve}</p>
          <Link href="/threat-intelligence">
            <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Threat Intelligence
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={`Threat Intel: ${threat.cve}`} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          <Link href="/threat-intelligence" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Threat Intelligence
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold text-card-foreground">{threat.cve}</span>
        </div>

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-card-foreground">{threat.cve}</span>
                {threat.cisaKev && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">CISA KEV</Badge>}
                {threat.exploitInWild && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Exploited in Wild</Badge>}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{threat.product} ({threat.vendor})</span>
                <span>Affected: {threat.affectedVersions}</span>
                <span>Fixed: <span className="text-success">{threat.fixedVersion}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-muted-foreground">CVSS</span>
                <span className={`font-mono text-2xl font-bold ${cvssColor(threat.cvss)}`}>{threat.cvss}</span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-muted-foreground">EPSS</span>
                <span className="font-mono text-2xl font-bold text-primary">{threat.epss.toFixed(2)}</span>
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
                <p className="text-sm leading-relaxed text-card-foreground">{threat.description}</p>
              </CardContent>
            </Card>

            {/* Exploit Sources */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exploitation Intelligence</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {threat.exploitSources.map((s, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3 text-xs text-card-foreground">{s}</div>
                ))}
              </CardContent>
            </Card>

            {/* IOCs */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Indicators of Compromise</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {threat.iocs.map((ioc, i) => (
                  <div key={i} className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-card-foreground">{ioc}</div>
                ))}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disclosure Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {threat.timeline.map((entry, i) => (
                  <div key={i} className="flex gap-4 text-xs">
                    <span className="w-20 shrink-0 font-mono text-muted-foreground">{entry.date}</span>
                    <div className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-card-foreground">{entry.event}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            {/* MITRE */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MITRE ATT&CK</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {threat.mitreTechniques.map((t) => (
                  <div key={t} className="rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-primary">{t}</div>
                ))}
              </CardContent>
            </Card>

            {/* CISA KEV */}
            {threat.cisaKev && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CISA KEV</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-xs">
                  <div><span className="text-muted-foreground">Date Added:</span> <span className="ml-1 font-mono text-card-foreground">{threat.kevDateAdded}</span></div>
                  <Separator className="bg-border" />
                  <div><span className="text-muted-foreground">Remediation Due:</span> <span className="ml-1 font-mono text-destructive">{threat.kevDueDate}</span></div>
                </CardContent>
              </Card>
            )}

            {/* References */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">References</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {threat.references.map((ref) => (
                  <div key={ref.label} className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2">
                    <span className="text-xs text-card-foreground">{ref.label}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col gap-2 p-4">
                <Link href={`/vulnerabilities/${encodeURIComponent(threat.cve)}`}>
                  <Button variant="outline" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm">
                    View Vulnerability Detail
                  </Button>
                </Link>
                <Link href={`/patch-automation/${encodeURIComponent(threat.cve)}`}>
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
