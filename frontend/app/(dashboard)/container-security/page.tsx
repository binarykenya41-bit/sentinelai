import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Container, AlertTriangle, Shield } from "lucide-react"

const stats = [
  { label: "Images Scanned", value: "284", color: "text-primary" },
  { label: "Critical CVEs", value: "47", color: "text-destructive" },
  { label: "Exposed Secrets", value: "12", color: "text-warning" },
  { label: "Compliant Images", value: "69%", color: "text-success" },
]

const images = [
  { image: "nginx:1.24.0", registry: "docker.io", os: "debian:bookworm", size: "187 MB", critVulns: 3, highVulns: 8, secrets: 0, status: "Flagged" },
  { image: "node:18-alpine", registry: "docker.io", os: "alpine:3.18", size: "111 MB", critVulns: 0, highVulns: 2, secrets: 0, status: "Pass" },
  { image: "postgres:15", registry: "docker.io", os: "debian:bookworm", size: "379 MB", critVulns: 1, highVulns: 5, secrets: 0, status: "Flagged" },
  { image: "redis:7-alpine", registry: "docker.io", os: "alpine:3.18", size: "29 MB", critVulns: 0, highVulns: 0, secrets: 0, status: "Pass" },
  { image: "sentinelai/api:v1.4.2", registry: "ghcr.io", os: "ubuntu:22.04", size: "312 MB", critVulns: 0, highVulns: 3, secrets: 2, status: "Flagged" },
  { image: "sentinelai/scanner:v1.1.0", registry: "ghcr.io", os: "alpine:3.18", size: "224 MB", critVulns: 0, highVulns: 1, secrets: 0, status: "Pass" },
  { image: "metabase/metabase:v0.47.1", registry: "docker.io", os: "ubuntu:20.04", size: "512 MB", critVulns: 5, highVulns: 14, secrets: 1, status: "Flagged" },
]

const runtimeAlerts = [
  { pod: "api-deployment-7d9f4", namespace: "prod", alert: "Privileged container running", severity: "Critical", time: "02:11 UTC" },
  { pod: "scanner-job-abc12", namespace: "prod", alert: "Container writing to /proc", severity: "High", time: "01:44 UTC" },
  { pod: "metrics-exporter-x92", namespace: "monitoring", alert: "Unexpected outbound connection", severity: "Medium", time: "00:30 UTC" },
  { pod: "metabase-6b8f2c", namespace: "internal", alert: "Root process spawned shell", severity: "Critical", time: "23:58 UTC" },
  { pod: "redis-master-0", namespace: "prod", alert: "Config file modified at runtime", severity: "High", time: "22:15 UTC" },
]

const k8sMisconfigs = [
  { check: "Pods running as root", result: "Fail", count: 14 },
  { check: "Privileged containers", result: "Fail", count: 3 },
  { check: "Resource limits set", result: "Fail", count: 21 },
  { check: "Read-only root filesystem", result: "Fail", count: 18 },
  { check: "Network policies defined", result: "Pass", count: 0 },
  { check: "Secrets in env vars", result: "Fail", count: 7 },
  { check: "Image tag is not 'latest'", result: "Pass", count: 0 },
  { check: "RBAC least privilege", result: "Fail", count: 5 },
]

const sevColor = (n: number) => n > 0 ? "text-destructive font-semibold" : "text-muted-foreground"
const statusBadge = (s: string) => s === "Pass" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"

export default function ContainerSecurityPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Container Security" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Container className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Image Scan Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Image", "Registry", "OS", "Crit", "High", "Secrets", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((img, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-3 py-2 font-mono text-xs text-card-foreground">{img.image}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{img.registry}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{img.os}</td>
                        <td className={`px-3 py-2 font-mono text-xs ${sevColor(img.critVulns)}`}>{img.critVulns}</td>
                        <td className={`px-3 py-2 font-mono text-xs ${img.highVulns > 0 ? "text-warning" : "text-muted-foreground"}`}>{img.highVulns}</td>
                        <td className={`px-3 py-2 font-mono text-xs ${sevColor(img.secrets)}`}>{img.secrets}</td>
                        <td className="px-3 py-2"><Badge variant="outline" className={statusBadge(img.status)}>{img.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">K8s Hardening</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {k8sMisconfigs.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-card-foreground">{c.check}</span>
                  <div className="flex items-center gap-2">
                    {c.result === "Fail" && <span className="font-mono text-xs text-destructive">{c.count}</span>}
                    <Badge variant="outline" className={c.result === "Pass" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>{c.result}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Runtime Alerts (Falco)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Pod", "Namespace", "Alert", "Severity", "Time"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runtimeAlerts.map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{a.pod}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.namespace}</td>
                    <td className="px-4 py-3 text-xs text-card-foreground">{a.alert}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={sevColor(a.severity === "Critical" ? 1 : 0) === "text-destructive font-semibold" ? "bg-destructive/10 text-destructive border-destructive/20" : a.severity === "High" ? "bg-warning/10 text-warning border-warning/20" : "bg-primary/10 text-primary border-primary/20"}>{a.severity}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.time}</td>
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
