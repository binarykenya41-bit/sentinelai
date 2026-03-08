export interface GcpInstance {
    id: string;
    name: string;
    zone: string;
    machine_type: string;
    status: string;
    internal_ip: string | null;
    external_ip: string | null;
    os_name: string | null;
    tags: string[];
    labels: Record<string, string>;
    creation_timestamp: string;
    last_start_timestamp: string | null;
}
export declare function listAllInstances(): Promise<GcpInstance[]>;
export declare function syncGcpInstancesToAssets(orgId: string): Promise<{
    synced: number;
    errors: number;
}>;
//# sourceMappingURL=compute.d.ts.map