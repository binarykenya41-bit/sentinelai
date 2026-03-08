export interface SecurityLogEntry {
    insertId: string;
    timestamp: string;
    severity: string;
    resource_type: string;
    log_name: string;
    principal: string | null;
    method: string | null;
    service: string | null;
    status_code: number | null;
    raw: Record<string, unknown>;
}
export declare function getSecurityLogs(filter: string, pageSize?: number, orderBy?: "timestamp asc" | "timestamp desc"): Promise<SecurityLogEntry[]>;
export declare function getAdminActivityLogs(): Promise<SecurityLogEntry[]>;
export declare function getVpcFirewallLogs(): Promise<SecurityLogEntry[]>;
export declare function getAuthFailureLogs(): Promise<SecurityLogEntry[]>;
export declare function getGkeLogs(): Promise<SecurityLogEntry[]>;
//# sourceMappingURL=logging.d.ts.map