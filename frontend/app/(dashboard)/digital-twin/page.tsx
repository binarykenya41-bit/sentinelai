import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Server, Database, Wifi, Cloud, Monitor, Globe, GitBranch, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"

const twinStats = [
  { label: "Modelled Nodes", value: "342", color: "text-primary" },
  { label: "Active Relationships", value: "1,847", color: "text-primary" },
  { label: "Critical Paths", value: "14", color: "text-destructive" },
  { label: "Last Model Refresh", value: "2 min ago", color: "text-success" },
]

const nodeInventory = [
  { id: "INF-001", name: "prod-web-cluster", type: "Cloud VM", env: "Production", riskScore: 72, connections: 8, vulns: 3, criticalPath: true },
  { id: "INF-002", name: "prod-db-primary", type: "Database", env: "Production", riskScore: 91, connections: 4, vulns: 1, criticalPath: true },
  { id: "INF-003", name: "core-firewall-01", type: "Firewall", env: "Production", riskScore: 64, connections: 23, vulns: 7, criticalPath: true },
  { id: "INF-004", name: "edge-router-01", type: "Router", env: "Production", riskScore: 58, connections: 15, vulns: 2, criticalPath: false },
  { id: "INF-005", name: "k8s-worker-pool", type: "Container Host", env: "Production", riskScore: 79, connections: 12, vulns: 9, criticalPath: true },
  { id: "INF-006", name: "dev-jumpbox", type: "Endpoint", env: "Development", riskScore: 44, connections: 3, vulns: 5, criticalPath: false },
  { id: "INF-007", name: "monitoring-stack", type: "API Service", env: "Production", riskScore: 31, connections: 19, vulns: 0, criticalPath: false },
  { id: "INF-008", name: "identity-dc-01", type: "Identity System", env: "Production", riskScore: 88, connections: 31, vulns: 2, criticalPath: true },
  { id: "INF-009", name: "splunk-siem", type: "API Service", env: "Production", riskScore: 55, connections: 27, vulns: 0, criticalPath: false },
  { id: "INF-010", name: "backup-nas-01", type: "Endpoint", env: "Production", riskScore: 22, connections: 2, vulns: 0, criticalPath: false },
]

const samplePaths = [
  {
    label: "Attacker → Web → DB (Critical)",
    severity: "Critical",
    nodes: ["Internet", "prod-web-cluster", "core-firewall-01", "prod-db-primary"],
  },
  {
    label: "Endpoint → Identity → Cloud (High)",
    severity: "High",
    nodes: ["dev-jumpbox", "identity-dc-01", "prod-web-cluster", "prod-db-primary"],
  },
  {
    label: "K8s Escape → Host → Network (High)",
    severity: "High",
    nodes: ["k8s-worker-pool", "core-firewall-01", "edge-router-01"],
  },
  {
    label: "SIEM Access → Lateral Pivot (Medium)",
    severity: "Medium",
    nodes: ["splunk-siem", "monitoring-stack", "prod-web-cluster"],
  },
]

const relationships = [
  { type: "can_access", count: 742, desc: "Direct network access paths" },
  { type: "can_exploit", count: 198, desc: "Exploit-validated attack edges" },
  { type: "can_escalate", count: 87, desc: "Privilege escalation paths" },
  { type: "trusts", count: 312, desc: "Trust relationships (IAM, kerberos, certs)" },
  { type: "depends_on", count: 508, desc: "Service dependency links" },
]

const typeIcon = (type: string) => {
  if (type === "Database") return <Database className="h-3.5 w-3.5 text-destructive" />
  if (type === "Firewall" || type === "Router") return <Wifi className="h-3.5 w-3.5 text-warning" />
  if (type.includes("Container")) return <Server className="h-3.5 w-3.5 text-primary" />
  if (type === "Cloud VM") return <Cloud className="h-3.5 w-3.5 text-primary" />
  if (type === "Identity System") return <GitBranch className="h-3.5 w-3.5 text-warning" />
  if (type.includes("Endpoint")) return <Monitor className="h-3.5 w-3.5 text-success" />
  return <Globe className="h-3.5 w-3.5 text-muted-foreground" />
}

const riskColor = (score: number) => {
  if (score >= 80) return "text-destructive"
  if (score >= 60) return "text-warning"
  return "text-success"
}

const sevBadge = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  return "bg-primary/10 text-primary border-primary/20"
}

export default function DigitalTwinPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Digital Twin" />
      <div className="flex flex-col gap-6 p-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {twinStats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Topology placeholder + relationship breakdown */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card className="border-border bg-card h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Infrastructure Topology</CardTitle>
                  <Button variant="outline" className="border-border text-xs gap-1.5 h-7 px-3">
                    <RefreshCw className="h-3 w-3" /> Refresh Model
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Topology diagram as ASCII art representation */}
                <div className="border border-border bg-secondary/30 p-4 font-mono text-xs text-muted-foreground rounded-[2%] space-y-1">
                  <div className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider">Live topology — connect D3.js / React Flow for visual graph</div>
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">[Internet]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-warning">[edge-router-01]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-warning">[core-firewall-01]</span>
                  </div>
                  <div className="pl-8 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-primary">[prod-web-cluster]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-destructive">[prod-db-primary]</span>
                  </div>
                  <div className="pl-8 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-primary">[k8s-worker-pool]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-destructive">[prod-db-primary]</span>
                  </div>
                  <div className="pl-8 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-success">[monitoring-stack]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-muted-foreground">[splunk-siem]</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">[dev-jumpbox]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-warning">[identity-dc-01]</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-primary">[prod-web-cluster]</span>
                  </div>
                </div>

                {/* Relationship types */}
                <div className="mt-4 flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Relationship Types</p>
                  {relationships.map((r) => (
                    <div key={r.type} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-primary">{r.type}</code>
                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                      </div>
                      <span className="font-mono text-xs text-card-foreground">{r.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical attack paths */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Critical Attack Paths</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {samplePaths.map((path, i) => (
                <div key={i} className="border border-border p-3 flex flex-col gap-2 rounded-[2%]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-card-foreground leading-snug">{path.label}</span>
                    <Badge variant="outline" className={sevBadge(path.severity)}>{path.severity}</Badge>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {path.nodes.map((node, j) => (
                      <div key={node} className="flex items-center gap-1">
                        <code className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{node}</code>
                        {j < path.nodes.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Link href="/attack-graph">
                <Button variant="outline" className="w-full border-border text-xs mt-2">Open Attack Graph</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Node inventory */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Twin Node Inventory</CardTitle>
              <Link href="/infrastructure/add">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 px-3">Add Node</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Name", "Type", "Environment", "Risk Score", "Connections", "Vulns", "Critical Path"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodeInventory.map((n) => (
                  <tr key={n.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3">
                      <Link href={`/infrastructure/${n.id}`} className="font-mono text-xs text-primary hover:underline">{n.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-card-foreground">
                        {typeIcon(n.type)} {n.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{n.type}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={n.env === "Production" ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20"}>{n.env}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${riskColor(n.riskScore)}`}>{n.riskScore}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{n.connections}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${n.vulns > 5 ? "text-destructive" : n.vulns > 0 ? "text-warning" : "text-success"}`}>{n.vulns}</span>
                    </td>
                    <td className="px-4 py-3">
                      {n.criticalPath
                        ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Yes</Badge>
                        : <span className="text-xs text-muted-foreground">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
