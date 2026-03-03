"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitBranch, GitPullRequest, CheckCircle, Circle, XCircle, Loader2 } from "lucide-react"

const integrations = [
  { name: "GitHub", status: "Connected", repo: "sentinel-org/infrastructure" },
  { name: "GitLab", status: "Connected", repo: "sentinel/backend-services" },
  { name: "Jenkins", status: "Disconnected", repo: "--" },
]

const patches = [
  {
    cve: "CVE-2026-21001",
    component: "OpenSSL 3.1.4",
    patchType: "Dependency",
    commitMessage: "fix(security): patch OpenSSL buffer overflow CVE-2026-21001",
    branch: "security/CVE-2026-21001",
    prStatus: "Open",
    ciResult: "Passing",
    diff: `--- a/requirements.txt\n+++ b/requirements.txt\n@@ -12,7 +12,7 @@\n-openssl==3.1.4\n+openssl==3.1.5\n`,
  },
  {
    cve: "CVE-2026-18823",
    component: "log4j-core 2.17.1",
    patchType: "Dependency",
    commitMessage: "fix(security): upgrade log4j-core to mitigate JNDI injection CVE-2026-18823",
    branch: "security/CVE-2026-18823",
    prStatus: "Open",
    ciResult: "Passing",
    diff: `--- a/pom.xml\n+++ b/pom.xml\n@@ -45,7 +45,7 @@\n-    <log4j.version>2.17.1</log4j.version>\n+    <log4j.version>2.21.0</log4j.version>\n`,
  },
  {
    cve: "CVE-2026-08112",
    component: "containerd 1.7.2",
    patchType: "Code Fix",
    commitMessage: "fix(security): add symlink validation for OCI image layers CVE-2026-08112",
    branch: "security/CVE-2026-08112",
    prStatus: "Draft",
    ciResult: "Running",
    diff: `--- a/pkg/archive/diff.go\n+++ b/pkg/archive/diff.go\n@@ -156,6 +156,10 @@\n+    resolved, err := securejoin.SecureJoin(root, hdr.Linkname)\n+    if err != nil {\n+        return fmt.Errorf("blocked symlink escape: %w", err)\n+    }\n+    hdr.Linkname = resolved`,
  },
  {
    cve: "CVE-2026-06221",
    component: "redis 7.0.11",
    patchType: "Code Fix",
    commitMessage: "fix(security): disable coroutine in Lua sandbox CVE-2026-06221",
    branch: "security/CVE-2026-06221",
    prStatus: "Merged",
    ciResult: "Passing",
    diff: `--- a/src/scripting.c\n+++ b/src/scripting.c\n@@ -324,6 +324,8 @@\n+    luaL_requiref(lua, "coroutine", NULL, 0);\n+    lua_pop(lua, 1);`,
  },
]

function prStatusBadge(status: string) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    Open: { color: "bg-success/10 text-success border-success/20", icon: <Circle className="h-3 w-3" /> },
    Draft: { color: "bg-warning/10 text-warning border-warning/20", icon: <Circle className="h-3 w-3" /> },
    Merged: { color: "bg-chart-1/10 text-chart-1 border-chart-1/20", icon: <CheckCircle className="h-3 w-3" /> },
    Closed: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
  }
  const s = map[status] ?? map.Open
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${s.color}`}>
      {s.icon} {status}
    </Badge>
  )
}

function ciStatusBadge(status: string) {
  switch (status) {
    case "Passing": return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Passing</Badge>
    case "Running": return <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Running</Badge>
    case "Failed": return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>
    default: return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">N/A</Badge>
  }
}

export default function PatchAutomationPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Patch Automation" />
      <div className="flex flex-col gap-6 p-6">
        {/* CI/CD integration cards */}
        <div className="grid grid-cols-3 gap-4">
          {integrations.map((int) => (
            <Card key={int.name} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-card-foreground">{int.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{int.repo}</span>
                </div>
                <Badge variant="outline" className={`ml-auto ${int.status === "Connected" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                  {int.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patch list */}
        {patches.map((patch) => (
          <Card key={patch.cve} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GitPullRequest className="h-4 w-4 text-primary" />
                  <CardTitle className="font-mono text-sm text-card-foreground">{patch.cve}</CardTitle>
                  <span className="text-xs text-muted-foreground">{patch.component}</span>
                  <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">{patch.patchType}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {prStatusBadge(patch.prStatus)}
                  {ciStatusBadge(patch.ciResult)}
                  {patch.prStatus === "Open" && (
                    <Button size="sm" className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                      Merge
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Commit:</span>
                <span className="font-mono text-card-foreground">{patch.commitMessage}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-mono text-primary">{patch.branch}</span>
              </div>
              <ScrollArea className="max-h-32">
                <pre className="rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed">
                  {patch.diff.split('\n').map((line, i) => (
                    <div key={i} className={line.startsWith('+') ? 'text-success' : line.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}>
                      {line}
                    </div>
                  ))}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
