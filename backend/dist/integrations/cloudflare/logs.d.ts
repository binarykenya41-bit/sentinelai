export interface FirewallEvent {
    RayID: string;
    Action: string;
    ClientIP: string;
    ClientCountry: string;
    ClientRequestPath: string;
    ClientRequestMethod: string;
    RuleID: string;
    Source: string;
    Timestamp: string;
    UserAgent: string;
}
export interface SecurityEvent {
    id: string;
    action: string;
    source: string;
    occurred_at: string;
    client_ip: string;
    client_country_name: string;
    user_agent: string;
    host: string;
    uri: string;
    rule_id: string;
    rule_message: string;
}
export declare function getSecurityEvents(zoneId: string, since?: string, limit?: number): Promise<SecurityEvent[]>;
export declare function aggregateFirewallStats(events: SecurityEvent[]): {
    total_events: number;
    by_action: Record<string, number>;
    by_country: Record<string, number>;
    by_source: Record<string, number>;
    top_attacking_ips: {
        ip: string;
        count: number;
    }[];
    blocked_count: number;
    challenged_count: number;
};
//# sourceMappingURL=logs.d.ts.map