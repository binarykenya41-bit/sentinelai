import { getWorkflowRuns, getPullRequests, getCommitStatus } from "../integrations/github/cicd.js";
import { getCodeScanningAlerts, getDependabotAlerts, getSecurityAdvisories, } from "../integrations/github/code-security.js";
import { verifyWebhookSignature, handleWorkflowRunEvent, handlePullRequestEvent } from "../integrations/github/webhook.js";
export async function githubRoutes(app) {
    // GET /api/github/:owner/:repo/runs — workflow run history
    app.get("/api/github/:owner/:repo/runs", async (req, reply) => {
        const { owner, repo } = req.params;
        const limit = parseInt(req.query.limit ?? "25");
        const runs = await getWorkflowRuns(owner, repo, limit);
        return reply.send(runs);
    });
    // GET /api/github/:owner/:repo/pulls — pull request list
    app.get("/api/github/:owner/:repo/pulls", async (req, reply) => {
        const { owner, repo } = req.params;
        const state = req.query.state ?? "open";
        const prs = await getPullRequests(owner, repo, state);
        return reply.send(prs);
    });
    // GET /api/github/:owner/:repo/commits/:sha/status — CI status for a commit
    app.get("/api/github/:owner/:repo/commits/:sha/status", async (req, reply) => {
        const { owner, repo, sha } = req.params;
        const status = await getCommitStatus(owner, repo, sha);
        return reply.send(status);
    });
    // GET /api/github/:owner/:repo/code-scanning — SAST alerts
    app.get("/api/github/:owner/:repo/code-scanning", async (req, reply) => {
        const { owner, repo } = req.params;
        const state = req.query.state ?? "open";
        const alerts = await getCodeScanningAlerts(owner, repo, state);
        return reply.send(alerts);
    });
    // GET /api/github/:owner/:repo/dependabot — SCA dependency alerts
    app.get("/api/github/:owner/:repo/dependabot", async (req, reply) => {
        const { owner, repo } = req.params;
        const state = req.query.state ?? "open";
        const alerts = await getDependabotAlerts(owner, repo, state);
        return reply.send(alerts);
    });
    // GET /api/github/advisories — public security advisories for a package
    app.get("/api/github/advisories", async (req, reply) => {
        const { ecosystem, package: pkg } = req.query;
        if (!ecosystem || !pkg)
            return reply.status(400).send({ error: "ecosystem and package are required" });
        const advisories = await getSecurityAdvisories(ecosystem, pkg);
        return reply.send(advisories);
    });
    // POST /api/github/webhook — receive GitHub events (workflow_run, pull_request)
    app.post("/api/github/webhook", {
        config: { rawBody: true },
    }, async (req, reply) => {
        const signature = req.headers["x-hub-signature-256"];
        const event = req.headers["x-github-event"];
        if (!signature || !verifyWebhookSignature(JSON.stringify(req.body), signature)) {
            return reply.status(401).send({ error: "Invalid signature" });
        }
        if (event === "workflow_run") {
            await handleWorkflowRunEvent(req.body);
        }
        else if (event === "pull_request") {
            await handlePullRequestEvent(req.body);
        }
        return reply.status(200).send({ ok: true });
    });
}
//# sourceMappingURL=github.js.map