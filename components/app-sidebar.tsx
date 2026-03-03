"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShieldAlert,
  FlaskConical,
  Network,
  Wrench,
  Globe,
  FileCheck,
  FileText,
  Settings,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Vulnerabilities", href: "/vulnerabilities", icon: ShieldAlert },
  { label: "Exploit Lab", href: "/exploit-lab", icon: FlaskConical },
  { label: "Attack Graph", href: "/attack-graph", icon: Network },
  { label: "Patch Automation", href: "/patch-automation", icon: Wrench },
  { label: "Threat Intelligence", href: "/threat-intelligence", icon: Globe },
  { label: "Compliance", href: "/compliance", icon: FileCheck },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Shield className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-wide text-sidebar-foreground">
          SENTINEL<span className="text-primary">AI</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3" role="navigation" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            SA
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-sidebar-foreground">Security Admin</span>
            <span className="text-[10px] text-muted-foreground">admin@sentinel.io</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
