export interface KevEntry {
    cve_id: string;
    vendor_project: string;
    product: string;
    vulnerability_name: string;
    date_added: string;
    short_description: string;
    required_action: string;
    due_date: string;
    known_ransomware_campaign_use: boolean;
    notes: string;
}
export declare function isKev(cveId: string): Promise<boolean>;
export declare function getKevEntry(cveId: string): Promise<KevEntry | null>;
export declare function getAllKev(): Promise<KevEntry[]>;
export declare function getRecentKev(daysBack?: number): Promise<KevEntry[]>;
//# sourceMappingURL=kev.d.ts.map