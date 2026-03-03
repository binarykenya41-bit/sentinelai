"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-base font-semibold text-card-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-56 bg-secondary pl-8 text-xs text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button className="relative text-muted-foreground transition-colors hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive p-0 text-[9px] text-destructive-foreground">
            3
          </Badge>
        </button>
      </div>
    </header>
  )
}
