export interface WorkflowRun {
    id: number;
    name: string | null;
    status: string | null;
    conclusion: string | null;
    head_branch: string | null;
    head_sha: string;
    html_url: string;
    run_started_at: string | null;
    updated_at: string;
}
export interface PullRequest {
    number: number;
    title: string;
    state: string;
    html_url: string;
    head_ref: string;
    base_ref: string;
    created_at: string;
    updated_at: string;
    user: string | null;
    labels: string[];
}
export declare function getWorkflowRuns(owner: string, repo: string, limit?: number): Promise<WorkflowRun[]>;
export declare function getPullRequests(owner: string, repo: string, state?: "open" | "closed" | "all"): Promise<PullRequest[]>;
export declare function createPatchBranch(owner: string, repo: string, branchName: string, baseSha: string): Promise<string>;
export declare function createPatchPR(owner: string, repo: string, head: string, base: string, cveId: string, body: string): Promise<{
    number: number;
    html_url: string;
}>;
export declare function getCommitStatus(owner: string, repo: string, sha: string): Promise<{
    state: string;
    statuses: {
        context: string;
        state: string;
        description: string;
    }[];
}>;
//# sourceMappingURL=cicd.d.ts.map