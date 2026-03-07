"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Server, Play, Trash2, CheckCircle, XCircle, Clock, Box, Cloud, Terminal, RefreshCw } from "lucide-react"

type SandboxEnv = {
  id: string
  name: string
  sourceNode: string
  purpose: "Exploit Testing" | "Patch Validation" | "Attack Simulation" | "Vulnerability Validation"
  technologies: string[]
  status: "Running" | "Completed" | "Failed" | "Provisioning"
  result: "Pass" | "Fail" | "Inconclusive" | "—"
  createdAt: string
  completedAt: string
  clonedFrom: string
}

const initialSandboxes: SandboxEnv[] = [
  { id: "SBX-001", name: "patch-CVE-2024-1234", sourceNode: "prod-web-cluster", purpose: "Patch Validation", technologies: ["Docker", "Ansible"], status: "Completed", result: "Pass", createdAt: "2026-03-07 00:10 UTC", completedAt: "2026-03-07 00:42 UTC", clonedFrom: "INF-001" },
  { id: "SBX-002", name: "exploit-CVE-2025-0871", sourceNode: "prod-db-primary", purpose: "Exploit Testing", technologies: ["Firecracker", "Metasploit"], status: "Running", result: "—", createdAt: "2026-03-07 01:05 UTC", completedAt: "—", clonedFrom: "INF-002" },
  { id: "SBX-003", name: "sim-lateral-movement", sourceNode: "k8s-worker-pool", purpose: "Attack Simulation", technologies: ["Kubernetes", "Atomic Red Team"], status: "Completed", result: "Fail", createdAt: "2026-03-06 22:00 UTC", completedAt: "2026-03-06 23:15 UTC", clonedFrom: "INF-005" },
  { id: "SBX-004", name: "vuln-validate-openssl", sourceNode: "core-firewall-01", purpose: "Vulnerability Validation", technologies: ["Terraform", "gVisor"], status: "Completed", result: "Pass", createdAt: "2026-03-06 18:30 UTC", completedAt: "2026-03-06 19:00 UTC", clonedFrom: "INF-003" },
  { id: "SBX-005", name: "patch-CVE-2024-9988", sourceNode: "identity-dc-01", purpose: "Patch Validation", technologies: ["Firecracker", "Ansible"], status: "Failed", result: "Fail", createdAt: "2026-03-06 16:00 UTC", completedAt: "2026-03-06 16:22 UTC", clonedFrom: "INF-008" },
  { id: "SBX-006", name: "clone-for-pentest", sourceNode: "prod-web-cluster", purpose: "Attack Simulation", technologies: ["Terraform", "Docker"], status: "Provisioning", result: "—", createdAt: "2026-03-07 01:08 UTC", completedAt: "—", clonedFrom: "INF-001" },
]

const techIcons: Record<string, React.ElementType> = {
  "Terraform": Cloud,
  "Docker": Box,
  "Kubernetes": Server,
  "Firecracker": Terminal,
  "gVisor": Terminal,
  "Ansible": RefreshCw,
  "Metasploit": Terminal,
  "Atomic Red Team": Terminal,
}

const statusBadge = (s: SandboxEnv["status"]) => {
  if (s === "Running" || s === "Provisioning") return "bg-warning/10 text-warning border-warning/20"
  if (s === "Completed") return "bg-success/10 text-success border-success/20"
  if (s === "Failed") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-muted text-muted-foreground border-border"
}

const resultBadge = (r: SandboxEnv["result"]) => {
  if (r === "Pass") return "bg-success/10 text-success border-success/20"
  if (r === "Fail") return "bg-destructive/10 text-destructive border-destructive/20"
  if (r === "Inconclusive") return "bg-warning/10 text-warning border-warning/20"
  return "bg-muted text-muted-foreground border-border"
}

const purposeBadge = (p: SandboxEnv["purpose"]) => {
  if (p === "Exploit Testing") return "bg-destructive/10 text-destructive border-destructive/20"
  if (p === "Patch Validation") return "bg-success/10 text-success border-success/20"
  if (p === "Attack Simulation") return "bg-warning/10 text-warning border-warning/20"
  return "bg-primary/10 text-primary border-primary/20"
}

const cloneSteps = [
  { step: "1. Gather system info", desc: "OS version, service versions, network config, installed packages via APIs and agents" },
  { step: "2. Extract metadata", desc: "Normalize and map infrastructure metadata to provisioning templates" },
  { step: "3. Generate replica", desc: "Terraform (cloud), Docker/K8s (services), Firecracker (OS), Ansible (config)" },
  { step: "4. Run test payload", desc: "Exploit, patch, or simulation executed in complete isolation from production" },
  { step: "5. Record results", desc: "ExploitResult or PatchResult stored, confidence scored, linked to CVE record" },
]

export default function SandboxPage() {
  const [sandboxes, setSandboxes] = useState<SandboxEnv[]>(initialSandboxes)

  const stats = [
    { label: "Total Environments", value: String(sandboxes.length), color: "text-primary" },
    { label: "Running", value: String(sandboxes.filter(s => s.status === "Running" || s.status === "Provisioning").length), color: "text-warning" },
    { label: "Tests Passed", value: String(sandboxes.filter(s => s.result === "Pass").length), color: "text-success" },
    { label: "Tests Failed", value: String(sandboxes.filter(s => s.result === "Fail").length), color: "text-destructive" },
  ]

  return (
    <div className="flex flex-col">
      <AppHeader title="Sandbox / Environment Cloning" />
      <div className="flex flex-col gap-6 p-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Clone process */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cloning Process</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {cloneSteps.map((step) => (
                <div key={step.step} className="flex flex-col gap-0.5 border-b border-border last:border-0 pb-2 last:pb-0">
                  <span className="text-xs font-semibold text-card-foreground">{step.step}</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">{step.desc}</span>
                </div>
              ))}

              <div className="mt-2 border-t border-border pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Technologies</p>
                <div className="flex flex-col gap-1">
                  {[
                    { name: "Terraform", purpose: "Cloud infrastructure replication" },
                    { name: "Docker / Kubernetes", purpose: "Service replication" },
                    { name: "Firecracker", purpose: "OS-level VM isolation" },
                    { name: "gVisor", purpose: "Container sandbox isolation" },
                    { name: "Ansible", purpose: "Environment configuration" },
                  ].map(t => (
                    <div key={t.name} className="flex items-start gap-2">
                      <code className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-primary shrink-0">{t.name}</code>
                      <span className="text-[10px] text-muted-foreground">{t.purpose}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sandbox environments table */}
          <div className="col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sandbox Environments</CardTitle>
                  </div>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 px-3 gap-1.5">
                    <Play className="h-3 w-3" /> New Clone
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4">
                {sandboxes.map((sbx) => (
                  <div key={sbx.id} className="border border-border p-4 flex flex-col gap-2 rounded-[2%]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary">{sbx.id}</span>
                          <span className="text-sm font-semibold text-card-foreground">{sbx.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={purposeBadge(sbx.purpose)}>{sbx.purpose}</Badge>
                          <Badge variant="outline" className={statusBadge(sbx.status)}>{sbx.status}</Badge>
                          <Badge variant="outline" className={resultBadge(sbx.result)}>{sbx.result === "—" ? "Pending" : `Result: ${sbx.result}`}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span>Cloned from: <span className="text-primary">{sbx.clonedFrom}</span> ({sbx.sourceNode})</span>
                          <span>Created: {sbx.createdAt}</span>
                          {sbx.completedAt !== "—" && <span>Completed: {sbx.completedAt}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(sbx.status === "Running" || sbx.status === "Provisioning") && (
                          <Clock className="h-3.5 w-3.5 text-warning animate-pulse" />
                        )}
                        {sbx.status === "Completed" && sbx.result === "Pass" && (
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                        )}
                        {(sbx.status === "Failed" || sbx.result === "Fail") && (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove sandbox"
                          onClick={() => setSandboxes(prev => prev.filter(s => s.id !== sbx.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {sbx.technologies.map(tech => {
                        const Icon = techIcons[tech] || Terminal
                        return (
                          <div key={tech} className="flex items-center gap-1 border border-border px-2 py-0.5 rounded-[2%] bg-secondary/30">
                            <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">{tech}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
