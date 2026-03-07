"use client"

import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { integrationCategories } from "@/lib/integrations-data"
import {
  Code2,
  Network,
  GitMerge,
  Cloud,
  Monitor,
  Eye,
  Database,
  ChevronRight,
  CheckCircle,
  Circle,
  Clock,
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  code: Code2,
  network: Network,
  gitmerge: GitMerge,
  cloud: Cloud,
  monitor: Monitor,
  eye: Eye,
  database: Database,
}

function StatusDot({ status }: { status: string }) {
  if (status === "connected") return <CheckCircle className="h-3 w-3 text-success shrink-0" />
  if (status === "pending") return <Clock className="h-3 w-3 text-warning shrink-0" />
  return <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
}

export default function IntegrationsPage() {
  const totalConnected = integrationCategories.reduce(
    (acc, cat) => acc + cat.tools.filter((t) => t.status === "connected").length,
    0
  )
  const totalTools = integrationCategories.reduce((acc, cat) => acc + cat.tools.length, 0)

  return (
    <div className="flex flex-col">
      <AppHeader title="Integrations" />
      <div className="flex flex-col gap-6 p-6">

        {/* Summary bar */}
        <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-5 py-4">
          <div className="flex flex-col">
            <span className="font-mono text-xl font-bold text-primary">{totalConnected}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Connected</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="font-mono text-xl font-bold text-card-foreground">{totalTools}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Integrations</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="font-mono text-xl font-bold text-card-foreground">{integrationCategories.length}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Categories</span>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            Select a category to configure integrations
          </div>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {integrationCategories.map((cat) => {
            const Icon = iconMap[cat.iconKey] ?? Network
            const connected = cat.tools.filter((t) => t.status === "connected").length
            const pending = cat.tools.filter((t) => t.status === "pending").length
            const disconnected = cat.tools.length - connected - pending

            return (
              <Link key={cat.id} href={`/integrations/${cat.id}`}>
                <Card className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/40 hover:bg-card/80 h-full">
                  <CardContent className="flex flex-col gap-4 p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-card-foreground">{cat.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {cat.tools.length} integration{cat.tools.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary mt-0.5" />
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {cat.description}
                    </p>

                    {/* Tool list */}
                    <div className="flex flex-col gap-1.5">
                      {cat.tools.map((tool) => (
                        <div key={tool.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusDot status={tool.status} />
                            <span className="text-xs text-card-foreground">{tool.name}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              tool.status === "connected"
                                ? "border-success/20 bg-success/10 text-success text-[10px] px-1.5 py-0"
                                : tool.status === "pending"
                                ? "border-warning/20 bg-warning/10 text-warning text-[10px] px-1.5 py-0"
                                : "border-border bg-secondary text-muted-foreground text-[10px] px-1.5 py-0"
                            }
                          >
                            {tool.status === "connected"
                              ? "Connected"
                              : tool.status === "pending"
                              ? "Pending"
                              : "Disconnected"}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Stats footer */}
                    <div className="flex items-center gap-3 border-t border-border pt-3 mt-auto">
                      {connected > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          <span className="text-[10px] text-success">{connected} connected</span>
                        </div>
                      )}
                      {pending > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-warning" />
                          <span className="text-[10px] text-warning">{pending} pending</span>
                        </div>
                      )}
                      {disconnected > 0 && (
                        <div className="flex items-center gap-1">
                          <Circle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{disconnected} not connected</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Data flow */}
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Integration Data Flow
            </h3>
            <div className="flex items-center overflow-x-auto gap-0">
              {[
                { label: "External Tools", sub: "APIs · agents · syslog" },
                { label: "API Integration Layer", sub: "REST / WebSocket / NETCONF" },
                { label: "Data Normalization", sub: "Schema mapping & enrichment" },
                { label: "Sentinel Database", sub: "PostgreSQL · Neo4j · Redis" },
                { label: "Digital Twin", sub: "Live infrastructure model" },
                { label: "Simulation / Alerts", sub: "Exploit lab · Compliance · Reports" },
              ].map((node, i, arr) => (
                <div key={node.label} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-md border border-border bg-secondary/50 min-w-[110px]">
                    <span className="text-[11px] font-semibold text-card-foreground text-center leading-tight">
                      {node.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground text-center leading-tight">
                      {node.sub}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex items-center px-1">
                      <div className="h-px w-3 bg-border" />
                      <ChevronRight className="h-3 w-3 text-muted-foreground -ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
