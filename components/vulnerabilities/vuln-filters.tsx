import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface VulnFiltersProps {
  severity: string
  onSeverityChange: (v: string) => void
  exploitableOnly: boolean
  onExploitableChange: (v: boolean) => void
  env: string
  onEnvChange: (v: string) => void
  search: string
  onSearchChange: (v: string) => void
}

export function VulnFilters({
  severity,
  onSeverityChange,
  exploitableOnly,
  onExploitableChange,
  env,
  onEnvChange,
  search,
  onSearchChange,
}: VulnFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={severity} onValueChange={onSeverityChange}>
        <SelectTrigger className="h-8 w-36 border-border bg-secondary text-xs text-foreground">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent className="bg-card text-card-foreground">
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={env} onValueChange={onEnvChange}>
        <SelectTrigger className="h-8 w-36 border-border bg-secondary text-xs text-foreground">
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent className="bg-card text-card-foreground">
          <SelectItem value="all">All Envs</SelectItem>
          <SelectItem value="Production">Production</SelectItem>
          <SelectItem value="Staging">Staging</SelectItem>
          <SelectItem value="Development">Development</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Switch
          id="exploitable"
          checked={exploitableOnly}
          onCheckedChange={onExploitableChange}
        />
        <Label htmlFor="exploitable" className="text-xs text-muted-foreground">
          Exploitable Only
        </Label>
      </div>

      <div className="relative ml-auto">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search CVE or component..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-56 bg-secondary pl-8 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
