export declare function getLogisticsData(): {
    org: {
        org_id: string;
        name: string;
        plan_tier: string;
        compliance_frameworks: string[];
    };
    assets: {
        asset_id: string;
        org_id: string;
        type: string;
        hostname: string;
        ip: string[];
        tags: string[];
        criticality: string;
        last_scan_at: string;
    }[];
    vulnerabilities: {
        vuln_id: string;
        cve_id: string;
        cvss_v3: number;
        cwe_ids: string[];
        mitre_techniques: string[];
        epss_score: number;
        kev_status: boolean;
        affected_assets: string[];
        blast_radius: string;
        scan_source: string;
        detection_at: string;
        remediation_status: string;
    }[];
    exploit_results: {
        result_id: string;
        vuln_id: string;
        sandbox_id: string;
        success: boolean;
        confidence: number;
        technique: string;
        payload_hash: string;
        output_log_ref: string;
        duration_ms: number;
        executed_at: string;
    }[];
    patch_records: {
        patch_id: string;
        vuln_id: string;
        branch_name: string;
        commit_sha: string;
        pr_url: string;
        ci_status: string;
        resim_result: string;
        merge_status: string;
        authored_by: string;
        created_at: string;
    }[];
    compliance_reports: ({
        report_id: string;
        org_id: string;
        framework: string;
        period_start: string;
        period_end: string;
        generated_at: string;
        evidence_refs: string[];
        controls_mapped: {
            "A.5.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.5.2": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.6.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.6.3": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.7.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.2": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.3": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.5": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.8.7": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.8": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.8.9": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.8.15": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.16": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.8.20": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.22": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.24": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "A.8.25": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.8.26": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.8.33": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC1.1"?: undefined;
            "CC2.1"?: undefined;
            "CC3.1"?: undefined;
            "CC3.2"?: undefined;
            "CC4.1"?: undefined;
            "CC5.1"?: undefined;
            "CC6.1"?: undefined;
            "CC6.2"?: undefined;
            "CC6.3"?: undefined;
            "CC6.6"?: undefined;
            "CC6.7"?: undefined;
            "CC6.8"?: undefined;
            "CC7.1"?: undefined;
            "CC7.2"?: undefined;
            "CC7.3"?: undefined;
            "CC8.1"?: undefined;
            "CC9.1"?: undefined;
        };
    } | {
        report_id: string;
        org_id: string;
        framework: string;
        period_start: string;
        period_end: string;
        generated_at: string;
        evidence_refs: string[];
        controls_mapped: {
            "CC1.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC2.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC3.1": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "CC3.2": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC4.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC5.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC6.1": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "CC6.2": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC6.3": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC6.6": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC6.7": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC6.8": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "CC7.1": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "CC7.2": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "CC7.3": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC8.1": {
                status: string;
                description: string;
                cve_ids: never[];
                evidence: string[];
            };
            "CC9.1": {
                status: string;
                description: string;
                cve_ids: string[];
                evidence: never[];
            };
            "A.5.1"?: undefined;
            "A.5.2"?: undefined;
            "A.6.1"?: undefined;
            "A.6.3"?: undefined;
            "A.7.1"?: undefined;
            "A.8.1"?: undefined;
            "A.8.2"?: undefined;
            "A.8.3"?: undefined;
            "A.8.5"?: undefined;
            "A.8.7"?: undefined;
            "A.8.8"?: undefined;
            "A.8.9"?: undefined;
            "A.8.15"?: undefined;
            "A.8.16"?: undefined;
            "A.8.20"?: undefined;
            "A.8.22"?: undefined;
            "A.8.24"?: undefined;
            "A.8.25"?: undefined;
            "A.8.26"?: undefined;
            "A.8.33"?: undefined;
        };
    })[];
    risks: {
        risk_id: string;
        title: string;
        category: string;
        likelihood: number;
        impact: number;
        risk_score: number;
        status: string;
        owner: string;
        mitigation: string;
        review_date: string;
        industry: string;
    }[];
    incidents: ({
        incident_id: string;
        title: string;
        severity: string;
        category: string;
        status: string;
        assigned_to: string;
        affected_assets: string[];
        description: string;
        progress: number;
        mttr_hours: null;
        sla_deadline: string;
        created_at: string;
        industry: string;
    } | {
        incident_id: string;
        title: string;
        severity: string;
        category: string;
        status: string;
        assigned_to: string;
        affected_assets: string[];
        description: string;
        progress: number;
        mttr_hours: number;
        sla_deadline: string;
        created_at: string;
        industry: string;
    })[];
    devsecops_pipelines: {
        pipeline_id: string;
        name: string;
        repo: string;
        branch: string;
        status: string;
        stage: string;
        sbom_findings: number;
        secrets_count: number;
        sast_issues: number;
        dast_issues: number;
        policy_pass: boolean;
        run_at: string;
        duration_ms: number;
        industry: string;
    }[];
    cloud_findings: {
        finding_id: string;
        provider: string;
        resource_id: string;
        resource_type: string;
        rule_id: string;
        title: string;
        severity: string;
        status: string;
        region: string;
        account_id: string;
        description: string;
        remediation: string;
        detected_at: string;
        industry: string;
    }[];
    dark_web_findings: {
        finding_id: string;
        category: string;
        title: string;
        source: string;
        severity: string;
        status: string;
        description: string;
        affected_data: string;
        threat_actor: string;
        discovered_at: string;
        industry: string;
    }[];
    edr_alerts: {
        alert_id: string;
        endpoint: string;
        hostname: string;
        os: string;
        severity: string;
        technique_id: string;
        technique_name: string;
        tactic: string;
        status: string;
        process_name: string;
        description: string;
        detected_at: string;
        industry: string;
    }[];
};
//# sourceMappingURL=logistics.d.ts.map