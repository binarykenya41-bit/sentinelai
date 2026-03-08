export interface VulnContext {
    cve_id: string;
    cvss_v3: number;
    epss_score: number;
    kev_status: boolean;
    cwe_ids: string[];
    mitre_techniques: string[];
    description?: string;
}
export interface AssetContext {
    type?: string;
    asset_type?: string;
    hostname: string;
    criticality: "low" | "medium" | "high" | "critical";
    environment?: string;
    tags?: string[];
}
export interface GraphPosition {
    inbound_paths: number;
    distance_from_edge: number;
    adjacent_techniques?: string[];
}
export interface RiskReasoningResult {
    summary: string;
    blast_radius: string;
    priority_score: number;
    recommended_action: string;
    urgency: "immediate" | "high" | "medium" | "low";
    confidence: number;
}
export declare function analyzeRisk(vuln: VulnContext, asset: AssetContext, graph?: GraphPosition): Promise<RiskReasoningResult>;
//# sourceMappingURL=risk-reasoning.d.ts.map