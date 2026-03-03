import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Vulnerability } from "@/lib/vuln-data"
import { cn } from "@/lib/utils"

interface VulnTableProps {
  vulnerabilities: Vulnerability[]
  selected: Vulnerability | null
  onSelect: (v: Vulnerability) => void
}

function severityBadge(severity: string) {
  const colors: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/10 text-warning border-warning/20",
    Medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    Low: "bg-muted text-muted-foreground border-border",
  }
  return colors[severity] ?? colors.Low
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    Unpatched: "bg-destructive/10 text-destructive border-destructive/20",
    Patched: "bg-warning/10 text-warning border-warning/20",
    Verified: "bg-success/10 text-success border-success/20",
  }
  return colors[status] ?? ""
}

export function VulnTable({ vulnerabilities, selected, onSelect }: VulnTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVE ID</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Component</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">EPSS</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exploit</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MITRE</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vulnerabilities.map((vuln) => (
            <TableRow
              key={vuln.cve}
              className={cn(
                "cursor-pointer border-border transition-colors",
                selected?.cve === vuln.cve ? "bg-primary/5" : "hover:bg-secondary/50"
              )}
              onClick={() => onSelect(vuln)}
            >
              <TableCell className="font-mono text-xs font-semibold text-card-foreground">{vuln.cve}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{vuln.component}</TableCell>
              <TableCell>
                <Badge variant="outline" className={severityBadge(vuln.severity)}>{vuln.severity}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-card-foreground">{vuln.epss.toFixed(2)}</TableCell>
              <TableCell>
                <span className={cn("text-xs font-medium", vuln.exploitVerified ? "text-destructive" : "text-muted-foreground")}>
                  {vuln.exploitVerified ? "Yes" : "No"}
                </span>
              </TableCell>
              <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">{vuln.mitreTechnique}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadge(vuln.status)}>{vuln.status}</Badge>
              </TableCell>
              <TableCell>
                <Link href={`/vulnerabilities/${encodeURIComponent(vuln.cve)}`} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Detail
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
