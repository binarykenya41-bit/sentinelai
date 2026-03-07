"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, GitPullRequest, Play, ExternalLink, Shield, Clock, Target } from "lucide-react"
import { vulnerabilities } from "@/lib/vuln-data"
import { toast } from "sonner"

function severityColor(severity: string) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/10 text-warning border-warning/20",
    Medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    Low: "bg-muted text-muted-foreground border-border",
  }
  return map[severity] ?? map.Low
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    Unpatched: "bg-destructive/10 text-destructive border-destructive/20",
    Patched: "bg-warning/10 text-warning border-warning/20",
    Verified: "bg-success/10 text-success border-success/20",
  }
  return map[status] ?? ""
}

export default function VulnerabilityDetailPage({ params }: { params: Promise<{ cve: string }> }) {
  const { cve } = use(params)
  const router = useRouter()
  const decodedCve = decodeURIComponent(cve)
  const vuln = vulnerabilities.find((v) => v.cve === decodedCve)

  if (!vuln) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Vulnerability Detail" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Vulnerability not found: {decodedCve}</p>
          <Link href="/vulnerabilities">
            <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Vulnerabilities
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={`Vulnerability: ${vuln.cve}`} />
      <div className="flex flex-col gap-6 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/vulnerabilities" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Vulnerabilities
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-semibold text-card-foreground">{vuln.cve}</span>
        </div>

        {/* Header card */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-card-foreground">{vuln.cve}</span>
                <Badge variant="outline" className={severityColor(vuln.severity)}>{vuln.severity}</Badge>
                <Badge variant="outline" className={statusColor(vuln.status)}>{vuln.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vuln.component}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">EPSS Score</span>
                <span className="font-mono text-xl font-bold text-primary">{vuln.epss.toFixed(2)}</span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Exploit Verified</span>
                <span className={`font-mono text-sm font-bold ${vuln.exploitVerified ? "text-destructive" : "text-muted-foreground"}`}>
                  {vuln.exploitVerified ? "CONFIRMED" : "NOT TESTED"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: main content */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Description */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-card-foreground">{vuln.description}</p>
              </CardContent>
            </Card>

            {/* Attack Scenario */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Attack Scenario
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-card-foreground">{vuln.attackScenario}</p>
              </CardContent>
            </Card>

            {/* Suggested Patch */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggested Patch
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed">
                    {vuln.suggestedPatch.split('\n').map((line, i) => (
                      <div key={i} className={line.startsWith('+') ? 'text-success' : line.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}>
                        {line}
                      </div>
                    ))}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right column: metadata */}
          <div className="flex flex-col gap-6">
            {/* Actions */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="sm"
                  onClick={() => {
                    toast.loading("Generating patch PR...", { duration: 1800 })
                    setTimeout(() => {
                      toast.success("Patch PR created", { description: `Branch security/${vuln.cve} opened` })
                      router.push("/patch-automation")
                    }, 1900)
                  }}
                >
                  <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />
                  Generate Patch PR
                </Button>
                <Button
                  variant="outline" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm"
                  onClick={() => {
                    toast.loading("Launching exploit simulation...", { duration: 1500 })
                    setTimeout(() => {
                      toast.info("Simulation queued", { description: `${vuln.cve} queued in Exploit Lab` })
                      router.push("/exploit-lab")
                    }, 1600)
                  }}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Run Exploit Simulation
                </Button>
                <Button
                  variant="outline" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm"
                  onClick={() => toast.info("NVD Entry", { description: `Opening NVD record for ${vuln.cve}` })}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View NVD Entry
                </Button>
                <Separator className="bg-border my-1" />
                <Link href={`/threat-intelligence/${encodeURIComponent(vuln.cve)}`} className="w-full">
                  <Button variant="outline" className="w-full border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    View Threat Intel
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-muted-foreground">MITRE ATT&CK</span>
                    <span className="font-mono text-xs text-primary">{vuln.mitreTechnique}</span>
                  </div>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-muted-foreground">Environment</span>
                    <span className="text-xs text-card-foreground">{vuln.environment}</span>
                  </div>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-muted-foreground">Component</span>
                    <span className="font-mono text-xs text-card-foreground">{vuln.component}</span>
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
