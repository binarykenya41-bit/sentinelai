export interface NetworkFlow {
    client_ip: string;
    server_ip: string;
    client_port: number;
    server_port: number;
    protocol: string;
    bytes_sent: number;
    bytes_rcvd: number;
    duration_ms: number;
    first_seen: string;
    last_seen: string;
    score: number;
}
export interface NetworkInterface {
    id: number;
    name: string;
    speed: number;
    packets: number;
    bytes: number;
    drops: number;
}
export declare function getTopFlows(ifaceId?: number, limit?: number): Promise<NetworkFlow[]>;
export declare function getInterfaces(): Promise<NetworkInterface[]>;
export interface SuricataAlert {
    timestamp: string;
    src_ip: string;
    src_port: number;
    dest_ip: string;
    dest_port: number;
    proto: string;
    alert: {
        action: string;
        signature: string;
        signature_id: number;
        category: string;
        severity: number;
    };
    flow_id?: number;
}
export declare function getRecentSuricataAlerts(maxLines?: number): Promise<SuricataAlert[]>;
export interface ZabbixProblem {
    event_id: string;
    host: string;
    name: string;
    severity: "not_classified" | "info" | "warning" | "average" | "high" | "disaster";
    acknowledged: boolean;
    clock: string;
}
export declare function getZabbixProblems(minSeverity?: number): Promise<ZabbixProblem[]>;
export declare function getNetworkPosture(): Promise<{
    sampled_at: string;
    interfaces: NetworkInterface[];
    active_flows: number;
    suspicious_flows: number;
    top_flows: NetworkFlow[];
    suricata: {
        total_alerts: number;
        critical: number;
        recent: SuricataAlert[];
    };
    zabbix: {
        total_problems: number;
        high_disaster: number;
        recent: ZabbixProblem[];
    };
    posture_score: number;
}>;
//# sourceMappingURL=monitor.d.ts.map