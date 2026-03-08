export interface EpssScore {
    cve: string;
    epss: number;
    percentile: number;
    date: string;
}
export declare function fetchEpssScore(cveId: string): Promise<EpssScore | null>;
export declare function fetchEpssScores(cveIds: string[]): Promise<EpssScore[]>;
export declare function fetchTopEpss(limit?: number, minEpss?: number): Promise<EpssScore[]>;
//# sourceMappingURL=epss.d.ts.map