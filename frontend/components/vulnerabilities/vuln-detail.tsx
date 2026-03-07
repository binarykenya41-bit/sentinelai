import { X, GitPullRequest, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { type Vulnerability } from "@/lib/vuln-data"

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
              <div className={`h-2 w-2 rounded-full ${v.exploitVerified ? "bg-destructive" : "bg-muted-foreground"}`} />
              <span className="text-xs text-card-foreground">
                {v.exploitVerified ? "Exploit verified successfully" : "Not yet simulated"}
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

          <div className="flex gap-2">
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
              <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />
              Generate Patch PR
            </Button>
            <Button variant="outline" className="flex-1 border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" size="sm">
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Run Exploit Sim
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
