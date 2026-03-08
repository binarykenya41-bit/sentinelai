export interface SccFinding {
    name: string;
    category: string;
    state: string;
    severity: string;
    resource_name: string;
    resource_type: string;
    cve_id: string | null;
    description: string;
    event_time: string;
    create_time: string;
    external_uri: string | null;
    mitre_attack: string[];
}
export declare function getSccFindings(state?: "ACTIVE" | "INACTIVE", severities?: string[], pageSize?: number): Promise<SccFinding[]>;
export declare function getCveFindingsFromScc(): Promise<{
    cve_id: string;
    severity: string;
    resource_name: string;
    event_time: string;
}[]>;
export declare function summarizeSccFindings(findings: SccFinding[]): {
    total: number;
    by_severity: Record<string, number>;
    by_category: Record<string, number>;
    cve_linked: number;
    critical_count: number;
    high_count: number;
};
//# sourceMappingURL=scc.d.ts.map