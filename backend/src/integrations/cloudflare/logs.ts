import { cfFetch } from "./client.js"

export interface FirewallEvent {
  RayID: string
  Action: string
  ClientIP: string
  ClientCountry: string
  ClientRequestPath: string
  ClientRequestMethod: string
  RuleID: string
  Source: string
  Timestamp: string
  UserAgent: string
}

export interface SecurityEvent {
  id: string
  action: string
  source: string
  occurred_at: string
  client_ip: string
  client_country_name: string
  user_agent: string
  host: string
  uri: string
  rule_id: string
  rule_message: string
}

// Fetch security events (firewall activity log) via the Security Events API
// Note: requires Cloudflare Pro+ plan — falls back to empty array on free plans
export async function getSecurityEvents(
  zoneId: string,
  since: string = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  limit = 100
): Promise<SecurityEvent[]> {
  try {
    const raw = await cfFetch<SecurityEvent[]>(
      `/zones/${zoneId}/security/events?since=${encodeURIComponent(since)}&limit=${limit}`
    )
    return Array.isArray(raw) ? raw : []
  } catch (err) {
    console.warn("[cloudflare/logs] security events unavailable:", (err as Error).message)
    return []
  }
}

// Aggregate firewall event stats for the Sentinel dashboard
export function aggregateFirewallStats(events: SecurityEvent[]) {
  const byAction: Record<string, number> = {}
  const byCountry: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  const topIps: Record<string, number> = {}

  for (const e of events) {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1
    byCountry[e.client_country_name] = (byCountry[e.client_country_name] ?? 0) + 1
    bySource[e.source] = (bySource[e.source] ?? 0) + 1
    topIps[e.client_ip] = (topIps[e.client_ip] ?? 0) + 1
  }

  const sortedIps = Object.entries(topIps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  return {
    total_events: events.length,
    by_action: byAction,
    by_country: byCountry,
    by_source: bySource,
    top_attacking_ips: sortedIps,
    blocked_count: byAction["block"] ?? 0,
    challenged_count: (byAction["challenge"] ?? 0) + (byAction["js_challenge"] ?? 0),
  }
}
