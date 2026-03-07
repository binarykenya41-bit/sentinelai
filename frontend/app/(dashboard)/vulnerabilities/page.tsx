"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { VulnTable } from "@/components/vulnerabilities/vuln-table"
import { VulnFilters } from "@/components/vulnerabilities/vuln-filters"
import { VulnDetail } from "@/components/vulnerabilities/vuln-detail"
import { type Vulnerability, vulnerabilities } from "@/lib/vuln-data"

export default function VulnerabilitiesPage() {
  const [selected, setSelected] = useState<Vulnerability | null>(null)
  const [severityFilter, setSeverityFilter] = useState("all")
  const [exploitableOnly, setExploitableOnly] = useState(false)
  const [envFilter, setEnvFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = vulnerabilities.filter((v) => {
    if (severityFilter !== "all" && v.severity !== severityFilter) return false
    if (exploitableOnly && !v.exploitVerified) return false
    if (envFilter !== "all" && v.environment !== envFilter) return false
    if (search && !v.cve.toLowerCase().includes(search.toLowerCase()) && !v.component.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col">
      <AppHeader title="Vulnerabilities" />
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col gap-4 p-6">
          <VulnFilters
            severity={severityFilter}
            onSeverityChange={setSeverityFilter}
            exploitableOnly={exploitableOnly}
            onExploitableChange={setExploitableOnly}
            env={envFilter}
            onEnvChange={setEnvFilter}
            search={search}
            onSearchChange={setSearch}
          />
          <VulnTable vulnerabilities={filtered} selected={selected} onSelect={setSelected} />
        </div>
        {selected && (
          <VulnDetail vulnerability={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  )
}
