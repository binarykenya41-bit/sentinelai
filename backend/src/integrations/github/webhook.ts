import { createHmac, timingSafeEqual } from "crypto"
import { supabase } from "../../lib/supabase.js"

// Verify GitHub webhook signature (X-Hub-Signature-256)
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return false
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

// Handle check_run / workflow_run events → update patch_records ci_status
export async function handleWorkflowRunEvent(payload: WorkflowRunPayload) {
  const { workflow_run } = payload
  if (!workflow_run) return

  const branchName = workflow_run.head_branch
  if (!branchName?.startsWith("sentinel/")) return

  const ciStatus =
    workflow_run.status === "completed"
      ? workflow_run.conclusion === "success"
        ? "passed"
        : "failed"
      : "running"

  const { error } = await supabase
    .from("patch_records")
    .update({ ci_status: ciStatus })
    .eq("branch_name", branchName)
    .eq("commit_sha", workflow_run.head_sha)

  if (error) console.error("[github-webhook] patch_records update failed:", error.message)
}

// Handle pull_request events → update patch_records merge_status
export async function handlePullRequestEvent(payload: PullRequestPayload) {
  const { action, pull_request } = payload
  if (!pull_request) return

  const headRef = pull_request.head?.ref
  if (!headRef?.startsWith("sentinel/")) return

  const mergeStatus =
    action === "closed" && pull_request.merged
      ? "merged"
      : action === "closed"
      ? "blocked"
      : action === "submitted" // review approved
      ? "approved"
      : undefined

  if (!mergeStatus) return

  const { error } = await supabase
    .from("patch_records")
    .update({ merge_status: mergeStatus, pr_url: pull_request.html_url })
    .eq("branch_name", headRef)

  if (error) console.error("[github-webhook] pull_request update failed:", error.message)
}

// ---- Minimal payload types ----
interface WorkflowRunPayload {
  workflow_run?: {
    head_branch: string
    head_sha: string
    status: string
    conclusion: string | null
  }
}

interface PullRequestPayload {
  action: string
  pull_request?: {
    html_url: string
    merged?: boolean
    head?: { ref: string }
  }
}
