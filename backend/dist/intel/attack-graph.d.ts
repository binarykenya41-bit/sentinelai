export type NodeType = "cve" | "technique" | "tactic" | "asset";
export type EdgeType = "exploits" | "enables" | "targets" | "mapped_to" | "subtechnique_of" | "belongs_to";
export interface GraphNode {
    id: string;
    type: NodeType;
    label: string;
    risk_score: number;
    cvss?: number;
    epss?: number;
    is_kev?: boolean;
    exploit_available?: boolean;
    tactic_phase?: string;
    platform?: string[];
    description?: string;
    url?: string;
}
export interface GraphEdge {
    source: string;
    target: string;
    type: EdgeType;
    label?: string;
    weight?: number;
}
export interface AttackGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    tactic_flow: string[];
    meta: {
        cve_count: number;
        technique_count: number;
        tactic_count: number;
        asset_count: number;
        generated_at: string;
        sources: string[];
    };
}
/**
 * Build an attack graph for one or more CVE IDs.
 * Fetches all data sources in parallel and wires nodes + edges.
 */
export declare function buildCveAttackGraph(cveIds: string[], assetIds?: {
    id: string;
    hostname: string;
    type: string;
}[]): Promise<AttackGraph>;
/**
 * Build the full ATT&CK matrix as a graph — all techniques organised by tactic.
 * Used for the ATT&CK heat-map view.
 */
export declare function buildFullAttackMatrix(): Promise<AttackGraph>;
//# sourceMappingURL=attack-graph.d.ts.map