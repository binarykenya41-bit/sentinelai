export interface DnsRecord {
    id: string;
    type: string;
    name: string;
    content: string;
    proxied: boolean;
    ttl: number;
    created_on: string;
    modified_on: string;
}
export declare function getDnsRecords(zoneId: string): Promise<DnsRecord[]>;
export declare function analyzeDnsExposure(records: DnsRecord[]): {
    total: number;
    by_type: Record<string, number>;
    unproxied_count: number;
    unproxied_records: {
        name: string;
        type: string;
        content: string;
    }[];
    risk: string;
};
//# sourceMappingURL=dns.d.ts.map