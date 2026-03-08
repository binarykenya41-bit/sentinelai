export interface VulDbEntry {
    vuldb_id: number;
    title: string;
    cve_id: string | null;
    created_at: string;
    updated_at: string;
    vendor: string;
    product: string;
    version: string;
    vuln_class: string;
    cwe_id: string | null;
    cvss_v2: number | null;
    cvss_v3: number | null;
    cvss_v4: number | null;
    exploit_available: boolean;
    exploit_maturity: "unproven" | "poc" | "functional" | "weaponized" | null;
    exploit_price: string | null;
    risk_score: number;
    threat_level: "low" | "medium" | "high" | "critical";
    attack_techniques: string[];
    patch_available: boolean;
    countermeasure: string | null;
    references: string[];
}
/**
 * Look up a CVE by ID on VulDB.
 * Returns detailed threat intelligence including exploit availability and ATT&CK mapping.
 */
export declare function fetchVulDbByCve(cveId: string): Promise<VulDbEntry | null>;
/**
 * Fetch the most recently added/updated entries.
 * Useful for a live threat feed dashboard widget.
 */
export declare function fetchVulDbRecent(limit?: number): Promise<VulDbEntry[]>;
/**
 * Search VulDB by free-text keyword (vendor, product, CVE, technique).
 */
export declare function searchVulDb(query: string, limit?: number): Promise<VulDbEntry[]>;
/**
 * Fetch CVEs with exploit code available — highest priority targets.
 */
export declare function fetchExploitableVulns(limit?: number): Promise<VulDbEntry[]>;
/**
 * Check exploit status for a batch of CVE IDs.
 * Conserves API credits by doing one request per CVE.
 * WARNING: each call uses 1 API credit.
 */
export declare function batchExploitStatus(cveIds: string[]): Promise<Record<string, {
    exploit_available: boolean;
    exploit_maturity: string | null;
    risk_score: number;
}>>;
//# sourceMappingURL=vuldb.d.ts.map