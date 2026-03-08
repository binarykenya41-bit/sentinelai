export interface AttackModelRequest {
    cve_id: string;
    cvss_v3: number;
    mitre_techniques: string[];
    asset_type: string;
    network_topology: {
        internet_facing: boolean;
        adjacent_assets: string[];
        trust_zones: string[];
    };
}
export interface AttackStep {
    step: number;
    tactic: string;
    technique_id: string;
    technique_name: string;
    description: string;
    detection_opportunity: string;
}
export interface AttackModelResult {
    scenario_title: string;
    threat_actor_profile: string;
    attack_chain: AttackStep[];
    dwell_time_estimate: string;
    impact_description: string;
    detection_gaps: string[];
    mitigation_priorities: string[];
    confidence: number;
}
export declare function modelAttackScenario(req: AttackModelRequest): Promise<AttackModelResult>;
//# sourceMappingURL=attack-modeling.d.ts.map