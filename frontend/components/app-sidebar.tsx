"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ShieldAlert, FlaskConical, Network, Wrench,
  Globe, FileCheck, FileText, Settings, Shield, Cpu,
  Wifi, Cloud, Container, Monitor, Users, Code2,
  Swords, Mail, Bug, Eye, Zap, GitMerge, BarChart3,
  AlertOctagon, ChevronDown, Server, Box, Layers, GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type NavItem = { label: string; href: string; icon: React.ElementType }
type NavGroup = { group: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Asset Inventory", href: "/assets", icon: Cpu },
      { label: "Risk Management", href: "/risk-management", icon: BarChart3 },
    ],
  },
  {
    group: "Vulnerability",
    items: [
      { label: "Vulnerabilities", href: "/vulnerabilities", icon: ShieldAlert },
      { label: "Code Scanning", href: "/code-scanning", icon: Code2 },
      { label: "Zero-Day Tracker", href: "/zero-day", icon: Zap },
    ],
  },
  {
    group: "Simulation & Attack",
    items: [
      { label: "Exploit Lab", href: "/exploit-lab", icon: FlaskConical },
      { label: "Red Team", href: "/red-team", icon: Swords },
      { label: "Attack Graph", href: "/attack-graph", icon: Network },
      { label: "Phishing & Social Eng.", href: "/phishing", icon: Mail },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { label: "Infrastructure", href: "/infrastructure", icon: Server },
      { label: "Digital Twin", href: "/digital-twin", icon: Layers },
      { label: "API Connections", href: "/api-connections", icon: GitBranch },
      { label: "Sandbox / Clone", href: "/sandbox", icon: Box },
      { label: "Network Security", href: "/network-security", icon: Wifi },
      { label: "Cloud Security", href: "/cloud-security", icon: Cloud },
      { label: "Container Security", href: "/container-security", icon: Container },
      { label: "Endpoint Security", href: "/endpoint-security", icon: Monitor },
    ],
  },
  {
    group: "Identity",
    items: [
      { label: "Identity & Access", href: "/identity-access", icon: Users },
    ],
  },
  {
    group: "Remediation",
    items: [
      { label: "Patch Automation", href: "/patch-automation", icon: Wrench },
      { label: "DevSecOps", href: "/devsecops", icon: GitMerge },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { label: "Threat Intelligence", href: "/threat-intelligence", icon: Globe },
      { label: "Dark Web Monitor", href: "/dark-web", icon: Eye },
      { label: "Malware Analysis", href: "/malware-analysis", icon: Bug },
    ],
  },
  {
    group: "Governance",
    items: [
      { label: "Compliance", href: "/compliance", icon: FileCheck },
      { label: "Incident Response", href: "/incident-response", icon: AlertOctagon },
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    group: "Configuration",
    items: [
      { label: "Integrations", href: "/integrations", icon: GitMerge },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = (group: string) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <Shield className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
          Sentinel<span className="text-primary">AI</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2" role="navigation">
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.group]
          return (
            <div key={group.group} className="mb-1">
              <button
                onClick={() => toggleGroup(group.group)}
                className="flex w-full items-center justify-between px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.group}
                </span>
                <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")} />
              </button>

              {!isCollapsed && (
                <ul className="flex flex-col gap-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary shrink-0">
            SA
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-sidebar-foreground truncate">Security Admin</span>
            <span className="text-[10px] text-muted-foreground truncate">admin@sentinel.io</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
