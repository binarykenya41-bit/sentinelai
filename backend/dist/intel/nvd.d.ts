export interface NvdCve {
    cve_id: string;
    description: string;
    cvss_v3_score: number | null;
    cvss_v3_vector: string | null;
    cvss_v2_score: number | null;
    cwe_ids: string[];
    references: string[];
    published: string;
    last_modified: string;
    vuln_status: string;
}
export declare function fetchCveById(cveId: string): Promise<NvdCve | null>;
export declare function searchCves(params: {
    keyword?: string;
    cweId?: string;
    cvssV3SeverityMin?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    pubStartDate?: string;
    pubEndDate?: string;
    resultsPerPage?: number;
    startIndex?: number;
}): Promise<{
    total: number;
    cves: NvdCve[];
}>;
//# sourceMappingURL=nvd.d.ts.map