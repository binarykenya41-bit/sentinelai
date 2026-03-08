export interface WafRule {
    id: string;
    description: string;
    action: string;
    enabled: boolean;
    priority: number | null;
    expression: string;
    created_on: string;
    modified_on: string;
}
export interface WafPackage {
    id: string;
    name: string;
    description: string;
    detection_mode: string;
    sensitivity: string;
    action_mode: string;
}
export declare function getFirewallRules(zoneId: string): Promise<WafRule[]>;
export declare function getWafPackages(zoneId: string): Promise<WafPackage[]>;
export declare function summarizeWaf(rules: WafRule[]): {
    total_rules: number;
    enabled_rules: number;
    blocking_rules: number;
    challenging_rules: number;
    disabled_rules: number;
    posture: string;
};
//# sourceMappingURL=waf.d.ts.map