import { google } from "googleapis"
import { getGcpAuth, getProjectId } from "./client.js"

export interface SecurityLogEntry {
  insertId: string
  timestamp: string
  severity: string
  resource_type: string
  log_name: string
  principal: string | null
  method: string | null
  service: string | null
  status_code: number | null
  raw: Record<string, unknown>
}

// Query Cloud Logging for security-relevant log entries (audit logs, vpc firewall, etc.)
export async function getSecurityLogs(
  filter: string,
  pageSize = 100,
  orderBy: "timestamp asc" | "timestamp desc" = "timestamp desc"
): Promise<SecurityLogEntry[]> {
  const auth = getGcpAuth()
  const logging = google.logging({ version: "v2", auth })
  const projectId = getProjectId()

  const { data } = await logging.entries.list({
    requestBody: {
      resourceNames: [`projects/${projectId}`],
      filter,
      orderBy,
      pageSize,
    },
  })

  return (data.entries ?? []).map((entry) => {
    const proto = entry.protoPayload as Record<string, unknown> | undefined
    const jsonPayload = entry.jsonPayload as Record<string, unknown> | undefined
    const payload = proto ?? jsonPayload ?? {}

    return {
      insertId: entry.insertId ?? "",
      timestamp: entry.timestamp ?? "",
      severity: entry.severity ?? "DEFAULT",
      resource_type: entry.resource?.type ?? "",
      log_name: entry.logName ?? "",
      principal: (payload["authenticationInfo"] as Record<string, unknown>)?.["principalEmail"] as string | null ?? null,
      method: payload["methodName"] as string | null ?? null,
      service: payload["serviceName"] as string | null ?? null,
      status_code: (payload["status"] as Record<string, unknown>)?.["code"] as number | null ?? null,
      raw: payload,
    }
  })
}

// Preset filters for Sentinel use cases

// Cloud audit logs — admin activity (IAM changes, resource creation/deletion)
export function getAdminActivityLogs() {
  return getSecurityLogs(
    `logName="projects/${getProjectId()}/logs/cloudaudit.googleapis.com%2Factivity" severity>=WARNING`
  )
}

// VPC firewall allowed/denied traffic
export function getVpcFirewallLogs() {
  return getSecurityLogs(
    `logName="projects/${getProjectId()}/logs/compute.googleapis.com%2Ffirewall" jsonPayload.rule_details.action="DENY"`
  )
}

// Authentication failures — failed logins, unauthorized API calls
export function getAuthFailureLogs() {
  return getSecurityLogs(
    `protoPayload.status.code!=0 protoPayload.serviceName="iam.googleapis.com" severity>=WARNING`
  )
}

// Container / GKE security events
export function getGkeLogs() {
  return getSecurityLogs(
    `resource.type="k8s_cluster" severity>=WARNING`
  )
}
