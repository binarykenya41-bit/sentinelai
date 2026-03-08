export type ComplianceFramework = "iso27001" | "soc2" | "pcidss";
export interface ComplianceMappingRequest {
    cve_id: string;
    cwe_ids: string[];
    cvss_v3: number;
    asset_type: string;
    remediation_action: string;
    frameworks: ComplianceFramework[];
}
export interface ControlMapping {
    control_id: string;
    control_name: string;
    relevance: "directly_applicable" | "partially_applicable" | "informational";
    narrative: string;
    evidence_required: string[];
}
export interface ComplianceMappingResult {
    framework: ComplianceFramework;
    controls: ControlMapping[];
    audit_narrative: string;
    gap_identified: boolean;
    gap_description?: string;
}
export declare function mapToCompliance(req: ComplianceMappingRequest): Promise<ComplianceMappingResult[]>;
//# sourceMappingURL=compliance-mapping.d.ts.map