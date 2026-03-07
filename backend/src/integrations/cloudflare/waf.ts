import { cfFetch } from "./client.js"

export interface WafRule {
  id: string
  description: string
  action: string
  enabled: boolean
  priority: number | null
  expression: string
  created_on: string
  modified_on: string
}

export interface WafPackage {
  id: string
  name: string
  description: string
  detection_mode: string
  sensitivity: string
  action_mode: string
}

// List custom Firewall Rules (WAF custom rules)
export async function getFirewallRules(zoneId: string): Promise<WafRule[]> {
  const raw = await cfFetch<
    {
      id: string
      description: string
      action: string
      enabled: boolean
      priority: number | null
      filter: { expression: string }
      created_on: string
      modified_on: string
    }[]
  >(`/zones/${zoneId}/firewall/rules?per_page=100`)

  return raw.map((r) => ({
    id: r.id,
    description: r.description,
    action: r.action,
    enabled: r.enabled,
    priority: r.priority ?? null,
    expression: r.filter.expression,
    created_on: r.created_on,
    modified_on: r.modified_on,
  }))
}

// List WAF managed ruleset packages
export async function getWafPackages(zoneId: string): Promise<WafPackage[]> {
  return cfFetch<WafPackage[]>(`/zones/${zoneId}/firewall/waf/packages?per_page=50`)
}

// Summarize WAF posture
export function summarizeWaf(rules: WafRule[]) {
  const enabled = rules.filter((r) => r.enabled)
  const blocking = enabled.filter((r) => r.action === "block")
  const challenging = enabled.filter((r) => r.action === "challenge" || r.action === "js_challenge")

  return {
    total_rules: rules.length,
    enabled_rules: enabled.length,
    blocking_rules: blocking.length,
    challenging_rules: challenging.length,
    disabled_rules: rules.length - enabled.length,
    posture: blocking.length >= 3 ? "strong" : blocking.length >= 1 ? "partial" : "weak",
  }
}
