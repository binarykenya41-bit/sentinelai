export interface SandboxConfig {
    image: string;
    command: string[];
    target_host?: string;
    target_port?: number;
    env?: Record<string, string>;
    timeout_ms: number;
    cpu_quota?: number;
    memory_mb?: number;
}
export interface SandboxResult {
    sandbox_id: string;
    exit_code: number;
    stdout: string;
    stderr: string;
    duration_ms: number;
    timed_out: boolean;
}
export declare function generateSandboxId(): string;
/**
 * Ensure the isolated sandbox Docker network exists.
 * This network has no route to production subnets.
 */
export declare function ensureSandboxNetwork(): Promise<void>;
/**
 * Run a simulation inside a Docker sandbox container.
 * Container is automatically removed after execution.
 */
export declare function runSandbox(config: SandboxConfig): Promise<SandboxResult>;
/**
 * Kill a running sandbox container immediately.
 */
export declare function killSandbox(sandboxId: string): Promise<void>;
/**
 * List all currently running sandbox containers (by name prefix).
 */
export declare function listRunningSandboxes(): Promise<string[]>;
//# sourceMappingURL=sandbox.d.ts.map