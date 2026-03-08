/**
 * Exploit Module Registry
 * Defines available simulation modules keyed by CVE / technique / category.
 * Modules describe WHAT will run inside the sandbox container — they never
 * execute directly in the backend process.
 */
export type ModuleCategory = "web" | "network" | "auth" | "sca" | "rce" | "lpe" | "lateral";
export interface ExploitModule {
    module_id: string;
    name: string;
    description: string;
    category: ModuleCategory;
    cve_ids: string[];
    technique_ids: string[];
    cwe_ids: string[];
    requires_auth: boolean;
    min_cvss: number;
    sandbox_image: string;
    entry_command: string[];
    timeout_ms: number;
    safe_targets_only: boolean;
}
export declare const MODULE_CATALOG: ExploitModule[];
export declare function getModuleById(id: string): ExploitModule | undefined;
export declare function getModulesForCve(cveId: string): ExploitModule[];
export declare function getModulesForTechnique(techniqueId: string): ExploitModule[];
export declare function getModulesByCategory(category: ModuleCategory): ExploitModule[];
//# sourceMappingURL=modules.d.ts.map