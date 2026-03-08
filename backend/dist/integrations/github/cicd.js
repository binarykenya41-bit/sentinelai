import { getOctokit } from "./client.js";
// List recent workflow runs for a repo
export async function getWorkflowRuns(owner, repo, limit = 25) {
    const octokit = getOctokit();
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: limit,
    });
    return data.workflow_runs.map((r) => ({
        id: r.id,
        name: r.name ?? null,
        status: r.status ?? null,
        conclusion: r.conclusion ?? null,
        head_branch: r.head_branch ?? null,
        head_sha: r.head_sha,
        html_url: r.html_url,
        run_started_at: r.run_started_at ?? null,
        updated_at: r.updated_at,
    }));
}
// List open PRs (Sentinel AI patch PRs have branch prefix sentinel/)
export async function getPullRequests(owner, repo, state = "open") {
    const octokit = getOctokit();
    const { data } = await octokit.pulls.list({ owner, repo, state, per_page: 50 });
    return data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        html_url: pr.html_url,
        head_ref: pr.head.ref,
        base_ref: pr.base.ref,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        user: pr.user?.login ?? null,
        labels: pr.labels.map((l) => l.name ?? ""),
    }));
}
// Create a branch + commit for an AI-generated patch
export async function createPatchBranch(owner, repo, branchName, baseSha) {
    const octokit = getOctokit();
    await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
    });
    return branchName;
}
// Open a PR for an AI patch
export async function createPatchPR(owner, repo, head, base, cveId, body) {
    const octokit = getOctokit();
    const { data } = await octokit.pulls.create({
        owner,
        repo,
        head,
        base,
        title: `[Sentinel AI] Fix ${cveId}`,
        body,
        labels: ["sentinel-ai", "security", "automated-patch"],
    });
    return { number: data.number, html_url: data.html_url };
}
// Get the CI status for a specific commit SHA
export async function getCommitStatus(owner, repo, sha) {
    const octokit = getOctokit();
    const { data } = await octokit.repos.getCombinedStatusForRef({ owner, repo, ref: sha });
    return {
        state: data.state,
        statuses: data.statuses.map((s) => ({
            context: s.context,
            state: s.state,
            description: s.description ?? "",
        })),
    };
}
//# sourceMappingURL=cicd.js.map