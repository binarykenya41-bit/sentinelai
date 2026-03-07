import { getOctokit } from "./client.js"

export interface WorkflowRun {
  id: number
  name: string | null
  status: string | null
  conclusion: string | null
  head_branch: string | null
  head_sha: string
  html_url: string
  run_started_at: string | null
  updated_at: string
}

export interface PullRequest {
  number: number
  title: string
  state: string
  html_url: string
  head_ref: string
  base_ref: string
  created_at: string
  updated_at: string
  user: string | null
  labels: string[]
}

// List recent workflow runs for a repo
export async function getWorkflowRuns(
  owner: string,
  repo: string,
  limit = 25
): Promise<WorkflowRun[]> {
  const octokit = getOctokit()
  const { data } = await octokit.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: limit,
  })
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
  }))
}

// List open PRs (Sentinel AI patch PRs have branch prefix sentinel/)
export async function getPullRequests(
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<PullRequest[]> {
  const octokit = getOctokit()
  const { data } = await octokit.pulls.list({ owner, repo, state, per_page: 50 })
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
  }))
}

// Create a branch + commit for an AI-generated patch
export async function createPatchBranch(
  owner: string,
  repo: string,
  branchName: string,
  baseSha: string
): Promise<string> {
  const octokit = getOctokit()
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  })
  return branchName
}

// Open a PR for an AI patch
export async function createPatchPR(
  owner: string,
  repo: string,
  head: string,
  base: string,
  cveId: string,
  body: string
): Promise<{ number: number; html_url: string }> {
  const octokit = getOctokit()
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title: `[Sentinel AI] Fix ${cveId}`,
    body,
    labels: ["sentinel-ai", "security", "automated-patch"],
  } as Parameters<typeof octokit.pulls.create>[0])
  return { number: data.number, html_url: data.html_url }
}

// Get the CI status for a specific commit SHA
export async function getCommitStatus(
  owner: string,
  repo: string,
  sha: string
): Promise<{ state: string; statuses: { context: string; state: string; description: string }[] }> {
  const octokit = getOctokit()
  const { data } = await octokit.repos.getCombinedStatusForRef({ owner, repo, ref: sha })
  return {
    state: data.state,
    statuses: data.statuses.map((s) => ({
      context: s.context,
      state: s.state,
      description: s.description ?? "",
    })),
  }
}
