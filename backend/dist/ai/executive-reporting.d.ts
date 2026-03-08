export interface SecurityPosture {
    total_vulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    kev_count: number;
    avg_time_to_remediate_days: number;
    patch_coverage_pct: number;
    exploit_success_rate: number;
    assets_at_risk: number;
    top_cves: string[];
}
export interface ExecutiveReportResult {
    executive_summary: string;
    headline_risk_statement: string;
    key_metrics_narrative: string;
    top_risks: {
        title: string;
        business_impact: string;
        status: string;
    }[];
    remediation_roi_narrative: string;
    recommendations: {
        priority: number;
        action: string;
        effort: string;
        impact: string;
    }[];
    board_ready_rating: "critical" | "elevated" | "moderate" | "managed";
}
export declare function generateExecutiveReport(org_name: string, period: string, posture: SecurityPosture): Promise<ExecutiveReportResult>;
//# sourceMappingURL=executive-reporting.d.ts.map