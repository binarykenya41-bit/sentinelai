export interface SimulationRequest {
    vuln_id: string;
    cve_id?: string;
    module_id?: string;
    target_host: string;
    target_port?: number;
    operator_id: string;
    dry_run?: boolean;
}
export interface SimulationStatus {
    result_id: string;
    vuln_id: string;
    module_id: string;
    sandbox_id: string | null;
    status: "pending" | "running" | "completed" | "failed" | "killed";
    success: boolean | null;
    confidence: number | null;
    technique: string | null;
    duration_ms: number | null;
    executed_at: string;
    output_summary: string | null;
}
export declare function runSimulation(req: SimulationRequest): Promise<SimulationStatus>;
export declare function killSimulation(sandboxId: string): Promise<void>;
export declare function killAllSimulations(): Promise<string[]>;
export declare function getRunningSimulations(): SimulationStatus[];
//# sourceMappingURL=engine.d.ts.map