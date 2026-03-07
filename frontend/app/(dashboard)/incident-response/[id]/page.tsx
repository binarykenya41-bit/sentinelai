import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertOctagon, Clock, User, Shield, Terminal } from "lucide-react"

const incident = {
  id: "INC-2026-041",
  title: "Ransomware Staging Detected — WORKSTATION-042",
  severity: "Critical",
  status: "Investigating",
  owner: "j.smith",
  team: ["j.smith", "a.chen", "r.patel"],
  opened: "2026-03-06 02:08 UTC",
  updated: "2026-03-06 03:01 UTC",
  eta: "2026-03-06 06:00 UTC",
  affectedAssets: ["WORKSTATION-042", "WORKSTATION-043 (lateral)", "FILE-SERVER-01 (lateral)"],
  attackVector: "Spearphishing Email → Malicious Attachment → PowerShell → LockBit Dropper",
  mitreTactics: ["TA0001 Initial Access", "TA0002 Execution", "TA0003 Persistence", "TA0008 Lateral Movement"],
  iocs: ["185.220.101.34", "cdn-update.delivery", "a3f9d12bc8e... (LockBit dropper hash)"],
  containmentActions: [
    "WORKSTATION-042 isolated from network (02:11 UTC)",
    "C2 domain cdn-update.delivery blacklisted on all endpoints",
    "PowerShell execution blocked via AppLocker update",
    "WORKSTATION-043 and FILE-SERVER-01 placed under enhanced monitoring",
  ],
}

const timeline = [
  { time: "02:08 UTC", actor: "EDR Agent", action: "Alert triggered: encoded PowerShell execution detected on WORKSTATION-042", type: "alert" },
  { time: "02:09 UTC", actor: "Sentinel AI", action: "Threat Intel match: PowerShell pattern matches LockBit 3.0 TTP (T1059.001)", type: "intel" },
  { time: "02:11 UTC", actor: "Sentinel AI", action: "Automated containment executed: WORKSTATION-042 network isolation applied", type: "action" },
  { time: "02:14 UTC", actor: "Sentinel AI", action: "Memory + disk snapshot captured for forensic analysis", type: "action" },
  { time: "02:18 UTC", actor: "EDR Agent", action: "Lateral movement attempt detected: SMB scan from WORKSTATION-042 (blocked)", type: "alert" },
  { time: "02:22 UTC", actor: "Sentinel AI", action: "C2 domain cdn-update.delivery identified and blacklisted across all endpoints", type: "action" },
  { time: "02:35 UTC", actor: "System", action: "IR team notified — INC-2026-041 assigned to j.smith", type: "notify" },
  { time: "02:40 UTC", actor: "j.smith", action: "Confirmed LockBit 3.0 ransomware staging. Root cause: phishing email from spoofed HR address", type: "human" },
  { time: "03:01 UTC", actor: "j.smith", action: "AppLocker policy updated to block malicious payload execution path. Monitoring extended to lateral targets.", type: "human" },
]

const forensicArtifacts = [
  { artifact: "Memory dump — WORKSTATION-042", size: "32 GB", collected: "02:14 UTC", status: "Analyzed" },
  { artifact: "Disk image — WORKSTATION-042 C:\\", size: "128 GB", collected: "02:16 UTC", status: "In Analysis" },
  { artifact: "Email header — phishing source", size: "4 KB", collected: "02:40 UTC", status: "Analyzed" },
  { artifact: "Network PCAP — 02:00–02:30 UTC", size: "2.1 GB", collected: "02:45 UTC", status: "Pending" },
  { artifact: "LockBit dropper binary (a3f9d12...)", size: "2.4 MB", collected: "02:14 UTC", status: "Analyzed" },
]

const typeColor = (t: string) => {
  if (t === "alert") return "bg-destructive"
  if (t === "intel") return "bg-warning"
  if (t === "action") return "bg-primary"
  if (t === "notify") return "bg-muted-foreground"
  return "bg-success"
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Incident — ${incident.id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertOctagon className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{incident.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Opened {incident.opened} · Updated {incident.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{incident.severity}</Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{incident.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Attack Vector</p>
                <p className="text-card-foreground font-mono">{incident.attackVector}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Affected Assets</p>
                {incident.affectedAssets.map(a => <p key={a} className="text-card-foreground">{a}</p>)}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Response Team</p>
                {incident.team.map(m => <p key={m} className="text-primary">{m}</p>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">MITRE ATT&CK Tactics</p>
                <div className="flex flex-wrap gap-1">
                  {incident.mitreTactics.map(t => <Badge key={t} variant="outline" className="border-border text-muted-foreground text-[10px]">{t}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Indicators of Compromise</p>
                {incident.iocs.map(ioc => <p key={ioc} className="font-mono text-destructive">{ioc}</p>)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Timeline */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Incident Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-none mt-0.5 shrink-0 ${typeColor(t.type)}`} />
                    {i < timeline.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{t.time}</span>
                      <span className="text-[10px] text-primary">{t.actor}</span>
                    </div>
                    <p className="text-xs text-card-foreground leading-snug">{t.action}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            {/* Containment */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Containment Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4">
                {incident.containmentActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-none bg-success mt-1.5 shrink-0" />
                    <span className="text-card-foreground">{a}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Forensic Artifacts */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Forensic Artifacts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Artifact", "Size", "Collected", "Status"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {forensicArtifacts.map((a, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-3 text-xs text-card-foreground">{a.artifact}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.size}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.collected}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={a.status === "Analyzed" ? "bg-success/10 text-success border-success/20" : a.status === "Pending" ? "bg-muted text-muted-foreground border-border" : "bg-warning/10 text-warning border-warning/20"}>{a.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
