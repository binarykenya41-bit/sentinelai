export interface MitreTechnique {
    id: string;
    stix_id: string;
    name: string;
    description: string;
    tactic_phases: string[];
    platforms: string[];
    detection: string;
    data_sources: string[];
    url: string;
    is_subtechnique: boolean;
    parent_id?: string;
    mitigations: string[];
    permissions_required: string[];
    defense_bypassed: string[];
}
export interface MitreTactic {
    id: string;
    stix_id: string;
    name: string;
    short_name: string;
    description: string;
    url: string;
}
export declare function getTechnique(techniqueId: string): Promise<MitreTechnique | null>;
export declare function getTactics(): Promise<MitreTactic[]>;
export declare function getTechniquesByTactic(tactic: string): Promise<MitreTechnique[]>;
export declare function mapCweToTechniques(cweIds: string[]): Promise<MitreTechnique[]>;
export declare function searchTechniques(query: string): Promise<MitreTechnique[]>;
export declare function listAllTechniques(): Promise<MitreTechnique[]>;
export declare function getAttackChain(techniqueIds: string[]): Promise<{
    nodes: MitreTechnique[];
    edges: {
        source: string;
        target: string;
        type: string;
    }[];
    tactic_flow: string[];
}>;
export declare function warmCache(): Promise<{
    techniques: number;
    tactics: number;
}>;
//# sourceMappingURL=mitre.d.ts.map