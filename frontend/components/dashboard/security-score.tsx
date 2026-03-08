"use client"

import { ArrowUp, ArrowDown, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { dashboardApi } from "@/lib/api-client"

function scoreColor(score: number) {
  if (score >= 80) return "text-success border-success"
  if (score >= 60) return "text-warning border-warning"
  return "text-destructive border-destructive"
}

export function SecurityScore() {
  const { data, loading } = useApi(() => dashboardApi.stats(), [])

  const score = data?.security_score ?? 78
  const delta = data?.score_delta ?? 4.2
  const lastScan = data?.last_scan
    ? new Date(data.last_scan).toLocaleString("en-GB", { timeZone: "UTC", hour12: false }) + " UTC"
    : "—"

  const color = scoreColor(score)

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-6 p-6">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-6 p-6">
        <div className={`relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 ${color.split(" ")[1]}/20`}>
          <div className={`absolute inset-1 rounded-full border-4 ${color.split(" ")[1]}`} />
          <span className={`text-4xl font-bold ${color.split(" ")[0]}`}>{score}</span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Security Posture Score
          </h2>
          <div className="flex items-center gap-2">
            {delta >= 0
              ? <ArrowUp className="h-4 w-4 text-success" />
              : <ArrowDown className="h-4 w-4 text-destructive" />
            }
            <span className={`text-sm font-medium ${delta >= 0 ? "text-success" : "text-destructive"}`}>
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)} from last scan
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Last scan: {lastScan}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
