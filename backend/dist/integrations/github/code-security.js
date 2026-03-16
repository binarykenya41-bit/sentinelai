import { getOctokit } from "./client.js";
// Fetch GitHub Code Scanning alerts (SAST)
export async function getCodeScanningAlerts(owner, repo, state = "open") {
    const octokit = getOctokit();
    const { data } = await octokit.codeScanning.listAlertsForRepo({
        owner,
        repo,
        state,
        per_page: 100,
    });
    return data.map((a) => ({
        number: a.number,
        rule_id: a.rule.id ?? "",
        rule_severity: a.rule.severity ?? null,
        rule_description: a.rule.description ?? null,
        state: a.state ?? "open",
        html_url: a.html_url,
        cwe_ids: (a.rule.tags ?? []).filter((t) => t.startsWith("external/cwe")),
        created_at: a.created_at,
        dismissed_at: a.dismissed_at ?? null,
        tool_name: a.tool.name ?? "unknown",
        location: a.most_recent_instance?.location
            ? {
                path: a.most_recent_instance.location.path ?? "",
                start_line: a.most_recent_instance.location.start_line ?? 0,
                end_line: a.most_recent_instance.location.end_line ?? 0,
            }
            : null,
    }));
}
// Fetch Dependabot SCA alerts (dependency vulnerabilities)
export async function getDependabotAlerts(owner, repo, state = "open") {
    const octokit = getOctokit();
    const { data } = await octokit.dependabot.listAlertsForRepo({
        owner,
        repo,
        state,
        per_page: 100,
    });
    return data.map((a) => ({
        number: a.number,
        state: a.state,
        cve_id: a.security_advisory.cve_id ?? null,
        ghsa_id: a.security_advisory.ghsa_id,
        severity: a.security_advisory.severity,
        cvss_score: a.security_advisory.cvss?.score ?? null,
        package_name: a.security_vulnerability.package.name,
        package_ecosystem: a.security_vulnerability.package.ecosystem,
        vulnerable_range: a.security_vulnerability.vulnerable_version_range ?? "",
        patched_version: a.security_vulnerability.first_patched_version?.identifier ?? null,
        html_url: a.html_url,
        created_at: a.created_at,
        fixed_at: a.fixed_at ?? null,
    }));
}
// Fetch GitHub Security Advisory API — public advisories for a package
export async function getSecurityAdvisories(ecosystem, packageName) {
    const octokit = getOctokit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await octokit.securityAdvisories.listGlobalAdvisories({
        ecosystem: ecosystem,
        affects: packageName,
        per_page: 50,
    });
    return data.map((a) => ({
        ghsa_id: a.ghsa_id,
        cve_id: a.cve_id ?? null,
        summary: a.summary,
        severity: a.severity ?? null,
        cvss_score: a.cvss?.score ?? null,
        published_at: a.published_at,
        updated_at: a.updated_at,
        html_url: a.html_url,
    }));
}
//# sourceMappingURL=code-security.js.map