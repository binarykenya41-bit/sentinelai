export interface EnrichedCve {
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
    epss_score: number | null;
    epss_percentile: number | null;
    kev: {
        is_kev: boolean;
        date_added?: string;
        required_action?: string;
        due_date?: string;
        known_ransomware?: boolean;
        vendor_product?: string;
    };
    mitre_techniques: {
        id: string;
        name: string;
        tactic_phases: string[];
        url: string;
        platforms: string[];
        detection: string;
    }[];
    vuldb: {
        available: boolean;
        vuldb_id?: number;
        vendor?: string;
        product?: string;
        vuln_class?: string;
        exploit_available: boolean;
        exploit_maturity: string | null;
        exploit_price: string | null;
        risk_score: number;
        threat_level: string;
        patch_available: boolean;
        countermeasure: string | null;
        cvss_v3?: number | null;
        cvss_v4?: number | null;
        attack_techniques: string[];
    };
    priority_score: number;
    enriched_at: string;
}
export declare function enrichCve(cveId: string): Promise<EnrichedCve | null>;
//# sourceMappingURL=enrichment.d.ts.map