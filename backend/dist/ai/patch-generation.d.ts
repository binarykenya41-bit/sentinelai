export interface PatchRequest {
    cve_id: string;
    cwe_ids: string[];
    language: string;
    framework?: string;
    affected_code: string;
    file_path?: string;
}
export interface PatchResult {
    patched_code: string;
    explanation: string;
    cwe_addressed: string[];
    breaking_changes: boolean;
    test_suggestions: string[];
    confidence: number;
}
export declare function generatePatch(req: PatchRequest): Promise<PatchResult>;
//# sourceMappingURL=patch-generation.d.ts.map