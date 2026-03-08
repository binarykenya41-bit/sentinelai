import { google } from "googleapis";
import { getGcpAuth, getProjectId } from "./client.js";
// List Security Command Center findings for the project
export async function getSccFindings(state = "ACTIVE", severities = ["CRITICAL", "HIGH", "MEDIUM"], pageSize = 100) {
    const auth = getGcpAuth();
    const scc = google.securitycenter({ version: "v1", auth });
    const projectId = getProjectId();
    const severityFilter = severities.map((s) => `severity="${s}"`).join(" OR ");
    const filter = `state="${state}" AND (${severityFilter})`;
    const { data } = await scc.projects.findings.list({
        parent: `projects/${projectId}/sources/-`,
        filter,
        pageSize,
        orderBy: "event_time desc",
    });
    return (data.listFindingsResults ?? []).map((r) => {
        const finding = r.finding;
        const vuln = finding.vulnerability;
        const cve = vuln?.["cve"]?.["id"];
        const mitreTechniques = [];
        const mitre = finding.mitreAttack;
        if (mitre?.["primaryTactic"])
            mitreTechniques.push(String(mitre["primaryTactic"]));
        const additionalTactics = mitre?.["additionalTactics"];
        if (additionalTactics)
            mitreTechniques.push(...additionalTactics);
        return {
            name: finding.name ?? "",
            category: finding.category ?? "",
            state: finding.state ?? "",
            severity: finding.severity ?? "SEVERITY_UNSPECIFIED",
            resource_name: finding.resourceName ?? "",
            resource_type: finding.resource?.["type"] ?? "",
            cve_id: cve ?? null,
            description: finding.description ?? "",
            event_time: finding.eventTime ?? "",
            create_time: finding.createTime ?? "",
            external_uri: finding.externalUri ?? null,
            mitre_attack: mitreTechniques,
        };
    });
}
// Map SCC findings to Sentinel vulnerability records (CVE-linked findings only)
export async function getCveFindingsFromScc() {
    const findings = await getSccFindings("ACTIVE", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
    return findings
        .filter((f) => f.cve_id !== null)
        .map((f) => ({
        cve_id: f.cve_id,
        severity: f.severity,
        resource_name: f.resource_name,
        event_time: f.event_time,
    }));
}
// Dashboard summary of SCC posture
export function summarizeSccFindings(findings) {
    const bySeverity = {};
    const byCategory = {};
    for (const f of findings) {
        bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
        byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
    }
    return {
        total: findings.length,
        by_severity: bySeverity,
        by_category: byCategory,
        cve_linked: findings.filter((f) => f.cve_id).length,
        critical_count: bySeverity["CRITICAL"] ?? 0,
        high_count: bySeverity["HIGH"] ?? 0,
    };
}
//# sourceMappingURL=scc.js.map