export interface CodeScanAlert {
    number: number;
    rule_id: string;
    rule_severity: string | null;
    rule_description: string | null;
    state: string;
    html_url: string;
    cwe_ids: string[];
    created_at: string;
    dismissed_at: string | null;
    tool_name: string;
    location: {
        path: string;
        start_line: number;
        end_line: number;
    } | null;
}
export interface DependabotAlert {
    number: number;
    state: string;
    cve_id: string | null;
    ghsa_id: string;
    severity: string;
    cvss_score: number | null;
    package_name: string;
    package_ecosystem: string;
    vulnerable_range: string;
    patched_version: string | null;
    html_url: string;
    created_at: string;
    fixed_at: string | null;
}
export declare function getCodeScanningAlerts(owner: string, repo: string, state?: "open" | "closed" | "dismissed"): Promise<CodeScanAlert[]>;
export declare function getDependabotAlerts(owner: string, repo: string, state?: "open" | "dismissed" | "fixed"): Promise<DependabotAlert[]>;
export declare function getSecurityAdvisories(ecosystem: string, packageName: string): Promise<{
    ghsa_id: string;
    cve_id: string | null;
    summary: string;
    severity: "unknown" | "low" | "medium" | "high" | "critical";
    cvss_score: number | null;
    published_at: string;
    updated_at: string;
    html_url: string;
}[]>;
//# sourceMappingURL=code-security.d.ts.map