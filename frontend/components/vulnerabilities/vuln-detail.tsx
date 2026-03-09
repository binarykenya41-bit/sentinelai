"use client"

import { useState } from "react"
import { X, GitPullRequest, Play, Loader2, CheckCircle2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { type Vulnerability } from "@/lib/vuln-data"
import { simulationApi, patchesApi } from "@/lib/api-client"

interface VulnDetailProps {
  vulnerability: Vulnerability
  onClose: () => void
}

function severityColor(severity: string) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/10 text-warning border-warning/20",
    Medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    Low: "bg-muted text-muted-foreground border-border",
  }
  return map[severity] ?? map.Low
}

export function VulnDetail({ vulnerability: v, onClose }: VulnDetailProps) {
  const [exploiting, setExploiting] = useState(false)
  const [exploitDone, setExploitDone] = useState(false)
  const [patching, setPatching] = useState(false)
  const [patchDone, setPatchDone] = useState(false)
  const [prUrl, setPrUrl] = useState<string | null>(null)

  const handleRunExploit = async () => {
    if (!v.vuln_id) {
      toast.error("No vuln_id — cannot run simulation")
      return
    }
    setExploiting(true)
    const toastId = toast.loading(`Running exploit simulation for ${v.cve}...`)
    try {
      const result = await simulationApi.run({
        vuln_id: v.vuln_id,
        target_host: "sandbox-target",
        operator_id: "operator:web-ui",
        dry_run: false,
      })
      toast.dismiss(toastId)
      if (result.success) {
        toast.error(`Exploit succeeded — ${v.cve} confirmed vulnerable (confidence: ${Math.round((result.confidence ?? 0) * 100)}%)`)
      } else {
        toast.success(`Exploit blocked — ${v.cve} appears mitigated`)
      }
      setExploitDone(true)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Simulation failed")
    } finally {
      setExploiting(false)
    }
  }

  const handleGeneratePatch = async () => {
    if (!v.vuln_id) {
      toast.error("No vuln_id — cannot generate patch")
      return
    }
    setPatching(true)
    const toastId = toast.loading(`Generating AI patch for ${v.cve}...`)
    try {
      const record = await patchesApi.generate(v.vuln_id)
      toast.dismiss(toastId)
      if (record.pr_url) {
        setPrUrl(record.pr_url)
        toast.success(
          `Patch created — branch pushed and PR opened`,
          { description: record.branch_name ?? undefined, duration: 6000 }
        )
      } else {
        toast.success(`Patch generated — branch: ${record.branch_name ?? "sentinel/fix/..."}`)
      }
      setPatchDone(true)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Patch generation failed")
    } finally {
      setPatching(false)
    }
  }

  return (
    <div className="w-[420px] shrink-0 border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-card-foreground">{v.cve}</span>
          <Badge variant="outline" className={severityColor(v.severity)}>
            {v.severity}
          </Badge>
        </div>
        <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Close detail panel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="h-[calc(100vh-112px)]">
        <div className="flex flex-col gap-5 p-4">
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
            <p className="text-sm leading-relaxed text-card-foreground">{v.description}</p>
          </section>

          <Separator className="bg-border" />

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attack Scenario</h3>
            <p className="text-sm leading-relaxed text-card-foreground">{v.attackScenario}</p>
          </section>

          <Separator className="bg-border" />

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">MITRE ATT&CK Technique</h3>
            <span className="font-mono text-xs text-primary">{v.mitreTechnique}</span>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Exploit Simulation
            </h3>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${exploitDone || v.exploitVerified ? "bg-destructive" : "bg-muted-foreground"}`} />
              <span className="text-xs text-card-foreground">
                {exploitDone ? "Simulation complete — check Exploit Lab for results" : v.exploitVerified ? "Exploit verified successfully" : "Not yet simulated"}
              </span>
            </div>
          </section>

          <Separator className="bg-border" />

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested Patch
            </h3>
            <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed text-card-foreground">
              {v.suggestedPatch}
            </pre>
          </section>

          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              View PR on GitHub
            </a>
          )}

          <div className="flex gap-2">
            <Button
              className={`flex-1 text-xs ${patchDone ? "bg-success/20 text-success border border-success/30 hover:bg-success/30" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              size="sm"
              onClick={handleGeneratePatch}
              disabled={patching || v.status === "Patched"}
            >
              {patching ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating...</>
              ) : patchDone ? (
                <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />PR Created</>
              ) : (
                <><GitPullRequest className="mr-1.5 h-3.5 w-3.5" />Generate Patch PR</>
              )}
            </Button>
            <Button
              variant="outline"
              className={`flex-1 text-xs ${exploitDone ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20" : "border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"}`}
              size="sm"
              onClick={handleRunExploit}
              disabled={exploiting || v.status === "Patched"}
            >
              {exploiting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Running...</>
              ) : exploitDone ? (
                <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Sim Done</>
              ) : (
                <><Play className="mr-1.5 h-3.5 w-3.5" />Run Exploit Sim</>
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
