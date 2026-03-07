import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Cloud, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const providers = [
  { name: "AWS", score: 71, resources: 412, critical: 8, high: 21, medium: 34, region: "eu-west-1" },
  { name: "Azure", score: 84, resources: 198, critical: 2, high: 9, medium: 14, region: "westeurope" },
  { name: "GCP", score: 67, resources: 87, critical: 5, high: 11, medium: 19, region: "europe-west1" },
]

const misconfigurations = [
  { id: "CSPM-001", resource: "S3 Bucket: sentinel-backups", provider: "AWS", issue: "Public read access enabled", severity: "Critical", framework: "CIS AWS 2.1.5", status: "Open" },
  { id: "CSPM-002", resource: "Security Group: sg-prod-web", provider: "AWS", issue: "0.0.0.0/0 ingress on port 22", severity: "High", framework: "CIS AWS 5.2", status: "Open" },
  { id: "CSPM-003", resource: "IAM Role: lambda-execution-role", provider: "AWS", issue: "Wildcard (*) resource in policy", severity: "High", framework: "CIS AWS 1.16", status: "In Progress" },
  { id: "CSPM-004", resource: "Storage Account: sentinelprod", provider: "Azure", issue: "Blob public access not disabled", severity: "Critical", framework: "CIS Azure 3.5", status: "Open" },
  { id: "CSPM-005", resource: "VM: prod-worker-02", provider: "Azure", issue: "OS disk not encrypted", severity: "High", framework: "CIS Azure 7.2", status: "Patched" },
  { id: "CSPM-006", resource: "GCS Bucket: sentinel-logs", provider: "GCP", issue: "Uniform bucket-level access disabled", severity: "Medium", framework: "CIS GCP 5.1", status: "Open" },
  { id: "CSPM-007", resource: "CloudTrail: prod-trail", provider: "AWS", issue: "Log file validation disabled", severity: "Medium", framework: "CIS AWS 3.2", status: "In Progress" },
  { id: "CSPM-008", resource: "RDS: prod-postgres-01", provider: "AWS", issue: "Automated backups disabled", severity: "High", framework: "CIS AWS 2.3.1", status: "Open" },
]

const cisBenchmarks = [
  { check: "CloudTrail enabled in all regions", result: "Pass", provider: "AWS" },
  { check: "Root account MFA enabled", result: "Pass", provider: "AWS" },
  { check: "No root access keys exist", result: "Fail", provider: "AWS" },
  { check: "VPC flow logs enabled", result: "Pass", provider: "AWS" },
  { check: "Azure Security Center enabled", result: "Pass", provider: "Azure" },
  { check: "Key Vault purge protection", result: "Fail", provider: "Azure" },
  { check: "GCP audit logs enabled", result: "Pass", provider: "GCP" },
  { check: "Compute firewall rules no open SSH", result: "Fail", provider: "GCP" },
]

const sevColor = (s: string) => {
  if (s === "Critical") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "High") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Medium") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
}

const statusColor = (s: string) => {
  if (s === "Open") return "bg-destructive/10 text-destructive border-destructive/20"
  if (s === "In Progress") return "bg-warning/10 text-warning border-warning/20"
  return "bg-success/10 text-success border-success/20"
}

const scoreColor = (n: number) => n >= 80 ? "text-success" : n >= 70 ? "text-warning" : "text-destructive"

export default function CloudSecurityPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Cloud Security (CSPM)" />
      <div className="flex flex-col gap-6 p-6">

        <div className="grid grid-cols-3 gap-4">
          {providers.map((p) => (
            <Card key={p.name} className="border-border bg-card">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-card-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.region}</span>
                  </div>
                  <span className={`text-2xl font-bold ${scoreColor(p.score)}`}>{p.score}%</span>
                </div>
                <Progress value={p.score} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.resources} resources</span>
                  <span className="text-destructive">{p.critical} critical</span>
                  <span className="text-warning">{p.high} high</span>
                  <span className="text-primary">{p.medium} medium</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Misconfigurations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["ID", "Resource", "Provider", "Issue", "Severity", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {misconfigurations.map((m) => (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{m.id}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.resource}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="border-border text-muted-foreground">{m.provider}</Badge></td>
                        <td className="px-4 py-3 text-xs text-card-foreground">{m.issue}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={sevColor(m.severity)}>{m.severity}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="outline" className={statusColor(m.status)}>{m.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">CIS Benchmark Checks</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {cisBenchmarks.map((b, i) => (
                <div key={i} className="flex items-start gap-2 py-1 border-b border-border last:border-0">
                  {b.result === "Pass"
                    ? <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                  }
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-card-foreground leading-snug">{b.check}</span>
                    <span className="text-[10px] text-muted-foreground">{b.provider}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
