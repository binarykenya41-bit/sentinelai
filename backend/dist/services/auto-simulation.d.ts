export interface AutoSimResult {
    total_queued: number;
    dispatched: number;
    succeeded: number;
    failed: number;
    skipped: number;
    duration_ms: number;
    results: {
        job_id: string;
        cve_id: string;
        module_id: string;
        success: boolean | null;
        confidence: number | null;
        duration_ms: number | null;
        status: string;
        error?: string;
    }[];
}
/**
 * Scan open vulnerabilities and add simulation jobs for any that
 * have a matching exploit module and aren't already queued.
 */
export declare function buildSimulationQueue(): Promise<number>;
/**
 * Dispatch pending simulation jobs from the queue.
 * Runs up to MAX_CONCURRENT_SIMS jobs concurrently.
 */
export declare function dispatchSimulationQueue(): Promise<AutoSimResult>;
/** Full auto-sim cycle: rebuild queue + dispatch. */
export declare function runAutoSimCycle(): Promise<{
    queued: number;
    dispatch: AutoSimResult;
}>;
/** Emergency: kill all running simulations and clear pending queue. */
export declare function emergencyStop(): Promise<{
    killed: string[];
    cleared: number;
}>;
//# sourceMappingURL=auto-simulation.d.ts.map