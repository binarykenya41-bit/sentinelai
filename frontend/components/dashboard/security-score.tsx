"use client"

import { ArrowUp, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function SecurityScore() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-6 p-6">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-primary/20">
          <div className="absolute inset-1 rounded-full border-4 border-primary" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }} />
          <span className="text-4xl font-bold text-primary">78</span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Security Posture Score
          </h2>
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">+4.2 from last scan</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Last scan: 2026-03-03 02:14 UTC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
