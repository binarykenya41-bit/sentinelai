export declare function verifyWebhookSignature(payload: string, signature: string): boolean;
export declare function handleWorkflowRunEvent(payload: WorkflowRunPayload): Promise<void>;
export declare function handlePullRequestEvent(payload: PullRequestPayload): Promise<void>;
interface WorkflowRunPayload {
    workflow_run?: {
        head_branch: string;
        head_sha: string;
        status: string;
        conclusion: string | null;
    };
}
interface PullRequestPayload {
    action: string;
    pull_request?: {
        html_url: string;
        merged?: boolean;
        head?: {
            ref: string;
        };
    };
}
export {};
//# sourceMappingURL=webhook.d.ts.map