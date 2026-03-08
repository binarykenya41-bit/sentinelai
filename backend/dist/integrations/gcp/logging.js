import { google } from "googleapis";
import { getGcpAuth, getProjectId } from "./client.js";
// Query Cloud Logging for security-relevant log entries (audit logs, vpc firewall, etc.)
export async function getSecurityLogs(filter, pageSize = 100, orderBy = "timestamp desc") {
    const auth = getGcpAuth();
    const logging = google.logging({ version: "v2", auth });
    const projectId = getProjectId();
    const { data } = await logging.entries.list({
        requestBody: {
            resourceNames: [`projects/${projectId}`],
            filter,
            orderBy,
            pageSize,
        },
    });
    return (data.entries ?? []).map((entry) => {
        const proto = entry.protoPayload;
        const jsonPayload = entry.jsonPayload;
        const payload = proto ?? jsonPayload ?? {};
        return {
            insertId: entry.insertId ?? "",
            timestamp: entry.timestamp ?? "",
            severity: entry.severity ?? "DEFAULT",
            resource_type: entry.resource?.type ?? "",
            log_name: entry.logName ?? "",
            principal: payload["authenticationInfo"]?.["principalEmail"] ?? null,
            method: payload["methodName"] ?? null,
            service: payload["serviceName"] ?? null,
            status_code: payload["status"]?.["code"] ?? null,
            raw: payload,
        };
    });
}
// Preset filters for Sentinel use cases
// Cloud audit logs — admin activity (IAM changes, resource creation/deletion)
export function getAdminActivityLogs() {
    return getSecurityLogs(`logName="projects/${getProjectId()}/logs/cloudaudit.googleapis.com%2Factivity" severity>=WARNING`);
}
// VPC firewall allowed/denied traffic
export function getVpcFirewallLogs() {
    return getSecurityLogs(`logName="projects/${getProjectId()}/logs/compute.googleapis.com%2Ffirewall" jsonPayload.rule_details.action="DENY"`);
}
// Authentication failures — failed logins, unauthorized API calls
export function getAuthFailureLogs() {
    return getSecurityLogs(`protoPayload.status.code!=0 protoPayload.serviceName="iam.googleapis.com" severity>=WARNING`);
}
// Container / GKE security events
export function getGkeLogs() {
    return getSecurityLogs(`resource.type="k8s_cluster" severity>=WARNING`);
}
//# sourceMappingURL=logging.js.map