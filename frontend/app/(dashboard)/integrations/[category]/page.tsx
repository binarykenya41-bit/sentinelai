"use client"

import { use, useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { integrationCategories, type IntegrationTool, type ToolStatus } from "@/lib/integrations-data"
import {
  Code2, Network, GitMerge, Cloud, Monitor, Eye, Database,
  ArrowLeft, CheckCircle, Circle, Clock, Plug, RefreshCw,
  Unplug, ShieldCheck, List,
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

function StatusBadge({ status }: { status: ToolStatus }) {
  if (status === "connected")
    return (
      <Badge variant="outline" className="border-success/20 bg-success/10 text-success flex items-center gap-1 text-[10px] px-1.5 py-0">
        <CheckCircle className="h-2.5 w-2.5" /> Connected
      </Badge>
    )
  if (status === "pending")
    return (
      <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning flex items-center gap-1 text-[10px] px-1.5 py-0">
        <Clock className="h-2.5 w-2.5" /> Pending
      </Badge>
    )
  return (
    <Badge variant="outline" className="border-border bg-secondary text-muted-foreground flex items-center gap-1 text-[10px] px-1.5 py-0">
      <Circle className="h-2.5 w-2.5" /> Disconnected
    </Badge>
  )
}

function CredentialDialog({
  tool,
  open,
  onClose,
}: {
  tool: IntegrationTool
  open: boolean
  onClose: () => void
}) {
  const [formValues, setFormValues] = useState<Record<string, string>>(
    Object.fromEntries(tool.configFields.map((f) => [f.key, ""]))
  )
  const [status, setStatus] = useState<ToolStatus>(tool.status)
  const [testing, setTesting] = useState(false)

  const handleConnect = () => {
    setTesting(true)
    setTimeout(() => {
      setTesting(false)
      setStatus("connected")
    }, 1800)
  }

  const handleDisconnect = () => {
    setStatus("disconnected")
    setFormValues(Object.fromEntries(tool.configFields.map((f) => [f.key, ""])))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border bg-card text-card-foreground max-w-lg w-full">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Plug className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-card-foreground">
                {tool.name}
              </DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
                {tool.authType}
              </DialogDescription>
            </div>
            <div className="ml-auto">
              <StatusBadge status={status} />
            </div>
          </div>
        </DialogHeader>

        <p className="text-xs leading-relaxed text-muted-foreground">{tool.description}</p>

        <Separator className="bg-border" />

        {/* Config form */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Connection Settings
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tool.configFields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label className="text-xs text-card-foreground">{field.label}</Label>
                {field.type === "select" ? (
                  <Select
                    value={formValues[field.key]}
                    onValueChange={(val) =>
                      setFormValues((prev) => ({ ...prev, [field.key]: val }))
                    }
                  >
                    <SelectTrigger className="h-8 border-border bg-secondary text-xs text-card-foreground">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-card-foreground">
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type === "password" ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={formValues[field.key]}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="h-8 border-border bg-secondary text-xs text-card-foreground placeholder:text-muted-foreground"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data collected */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <List className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data Collected
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tool.dataCollected.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="border-border bg-secondary text-muted-foreground text-[10px] font-normal"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {status === "connected" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={handleConnect}
                disabled={testing}
              >
                <RefreshCw className={`mr-1.5 h-3 w-3 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing…" : "Test Connection"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-destructive/30 bg-destructive/5 text-xs text-destructive hover:bg-destructive/10"
                onClick={handleDisconnect}
              >
                <Unplug className="mr-1.5 h-3 w-3" /> Disconnect
              </Button>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-success">
                <ShieldCheck className="h-3 w-3" /> Actively syncing
              </span>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                onClick={handleConnect}
                disabled={testing}
              >
                <Plug className={`mr-1.5 h-3 w-3 ${testing ? "animate-pulse" : ""}`} />
                {testing ? "Connecting…" : "Connect"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={handleConnect}
                disabled={testing}
              >
                <RefreshCw className={`mr-1.5 h-3 w-3 ${testing ? "animate-spin" : ""}`} />
                Test
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ToolSquareCard({ tool }: { tool: IntegrationTool }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [status] = useState<ToolStatus>(tool.status)

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 aspect-square transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {/* Status indicator dot */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary/10 transition-colors">
            <Plug className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span
            className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
              status === "connected"
                ? "bg-success"
                : status === "pending"
                ? "bg-warning"
                : "bg-muted-foreground/40"
            }`}
          />
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <span className="text-xs font-semibold text-card-foreground text-center leading-tight line-clamp-2">
            {tool.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {status === "connected" ? "Connected" : status === "pending" ? "Pending" : "Click to configure"}
          </span>
        </div>
      </button>

      <CredentialDialog
        tool={tool}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  )
}

export default function IntegrationCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = use(params)
  const cat = integrationCategories.find((c) => c.id === category)
  const Icon = cat ? (iconMap[cat.iconKey] ?? Network) : Network

  if (!cat) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Integration" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Category not found: {category}</p>
          <Link href="/integrations">
            <Button variant="outline" size="sm" className="border-border bg-secondary text-secondary-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Integrations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const connected = cat.tools.filter((t) => t.status === "connected").length
  const pending = cat.tools.filter((t) => t.status === "pending").length

  return (
    <div className="flex flex-col">
      <AppHeader title={cat.label} />
      <div className="flex flex-col gap-6 p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/integrations"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Integrations
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-semibold text-card-foreground">{cat.label}</span>
        </div>

        {/* Category header */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-base font-bold text-card-foreground">{cat.label}</span>
              <p className="text-xs leading-relaxed text-muted-foreground max-w-xl">{cat.description}</p>
            </div>
            <div className="ml-auto flex items-center gap-6 shrink-0">
              <div className="flex flex-col items-center">
                <span className="font-mono text-lg font-bold text-success">{connected}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Connected</span>
              </div>
              {pending > 0 && (
                <div className="flex flex-col items-center">
                  <span className="font-mono text-lg font-bold text-warning">{pending}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <span className="font-mono text-lg font-bold text-card-foreground">{cat.tools.length}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tool square grid */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Integrations — click a card to configure
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {cat.tools.map((tool) => (
              <ToolSquareCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
