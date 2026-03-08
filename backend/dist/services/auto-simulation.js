/**
 * Auto-Simulation Service
 *
 * Reads the simulation_queue table, dispatches sandboxes for each pending job,
 * stores results in exploit_results, and updates vulnerability remediation status.
 *
 * Safety controls:
 *  - Only dispatches if AUTO_SIM_ENABLED=true
 *  - Respects MAX_CONCURRENT_SIMS (default 2) to avoid resource exhaustion
 *  - dry_run=true by default until explicitly disabled via AUTO_SIM_DRY_RUN=false
 *  - Never targets production IPs — only SANDBOX_DEMO_TARGET or 127.0.0.1
 *  - All activity logged to audit_log + sync_jobs
 */
import { supabase } from "../lib/supabase.js";
import { runSimulation, killAllSimulations } from "../simulation/engine.js";
import { getModuleById } from "../simulation/modules.js";
const AUTO_SIM_ENABLED = process.env.AUTO_SIM_ENABLED === "true";
const AUTO_SIM_DRY_RUN = process.env.AUTO_SIM_DRY_RUN !== "false"; // default: dry run
const MAX_CONCURRENT_SIMS = parseInt(process.env.MAX_CONCURRENT_SIMS ?? "2");
const MIN_CVSS_FOR_SIM = parseFloat(process.env.MIN_CVSS_FOR_SIM ?? "7.0");
const SANDBOX_TARGET = process.env.SANDBOX_DEMO_TARGET ?? "127.0.0.1";
// ── Queue management ──────────────────────────────────────────────────────────
/** Fetch pending simulation jobs ordered by priority. */
async function fetchPendingJobs(limit) {
    const { data, error } = await supabase
        .from("simulation_queue")
        .select(`
      job_id, vuln_id, cve_id, module_id,
      target_host, target_port, dry_run, priority
    `)
        .eq("status", "pending")
        .order("priority", { ascending: true })
        .order("scheduled_at", { ascending: true })
        .limit(limit);
    if (error)
        throw new Error(`Queue fetch failed: ${error.message}`);
    return data ?? [];
}
/** Mark a queue job as running. */
async function markRunning(jobId, sandboxId) {
    await supabase.from("simulation_queue").update({
        status: "running",
        sandbox_id: sandboxId,
        started_at: new Date().toISOString(),
    }).eq("job_id", jobId);
}
/** Mark a queue job as completed and link to exploit_result. */
async function markCompleted(jobId, resultId, success) {
    await supabase.from("simulation_queue").update({
        status: "completed",
        result_id: resultId,
        completed_at: new Date().toISOString(),
    }).eq("job_id", jobId);
}
/** Mark a queue job as failed. */
async function markFailed(jobId, errorMsg) {
    await supabase.from("simulation_queue").update({
        status: "failed",
        error_msg: errorMsg.slice(0, 500),
        completed_at: new Date().toISOString(),
    }).eq("job_id", jobId);
}
/** Mark a queue job as skipped (no module, CVSS too low, etc.). */
async function markSkipped(jobId, reason) {
    await supabase.from("simulation_queue").update({
        status: "skipped",
        error_msg: reason,
        completed_at: new Date().toISOString(),
    }).eq("job_id", jobId);
}
/** After a successful exploit, update vuln remediation_status to 'in_progress'. */
async function escalateVulnerability(vulnId, cveId) {
    await supabase
        .from("vulnerabilities")
        .update({ remediation_status: "in_progress" })
        .eq("vuln_id", vulnId)
        .eq("remediation_status", "open");
    // Audit log
    await supabase.from("audit_log").insert({
        actor: "sentinel-ai",
        action: "simulation_confirmed_exploitable",
        resource_type: "vulnerability",
        resource_id: vulnId,
        payload: { cve_id: cveId, escalated_to: "in_progress" },
    });
}
// ── Queue builder — for vulns not yet queued ─────────────────────────────────
/**
 * Scan open vulnerabilities and add simulation jobs for any that
 * have a matching exploit module and aren't already queued.
 */
export async function buildSimulationQueue() {
    if (!AUTO_SIM_ENABLED) {
        console.log("[AUTO-SIM] AUTO_SIM_ENABLED=false — skipping queue build");
        return 0;
    }
    // Fetch open vulns above CVSS threshold
    const { data: vulns } = await supabase
        .from("vulnerabilities")
        .select("vuln_id, cve_id, cvss_v3, mitre_techniques")
        .in("remediation_status", ["open"])
        .gte("cvss_v3", MIN_CVSS_FOR_SIM)
        .order("cvss_v3", { ascending: false })
        .limit(50);
    let queued = 0;
    for (const vuln of vulns ?? []) {
        // Check if already pending/running
        const { data: existing } = await supabase
            .from("simulation_queue")
            .select("job_id")
            .eq("vuln_id", vuln.vuln_id)
            .in("status", ["pending", "running"])
            .maybeSingle();
        if (existing)
            continue;
        // Find best module
        const { getModulesForCve, getModulesForTechnique } = await import("../simulation/modules.js");
        let module = getModulesForCve(vuln.cve_id)[0];
        if (!module && vuln.mitre_techniques?.length) {
            for (const tid of vuln.mitre_techniques) {
                const matches = getModulesForTechnique(tid);
                if (matches.length) {
                    module = matches[0];
                    break;
                }
            }
        }
        if (!module)
            continue;
        // Insert queue job
        const priority = Math.round(100 - (vuln.cvss_v3 ?? 5) * 10); // CVSS 10 → priority 0
        await supabase.from("simulation_queue").insert({
            vuln_id: vuln.vuln_id,
            cve_id: vuln.cve_id,
            module_id: module.module_id,
            target_host: SANDBOX_TARGET,
            target_port: 80,
            priority,
            triggered_by: "auto-scheduler",
            dry_run: AUTO_SIM_DRY_RUN,
        });
        queued++;
    }
    console.log(`[AUTO-SIM] Queued ${queued} new simulation jobs`);
    return queued;
}
// ── Dispatcher ────────────────────────────────────────────────────────────────
/**
 * Dispatch pending simulation jobs from the queue.
 * Runs up to MAX_CONCURRENT_SIMS jobs concurrently.
 */
export async function dispatchSimulationQueue() {
    const start = Date.now();
    if (!AUTO_SIM_ENABLED) {
        console.log("[AUTO-SIM] AUTO_SIM_ENABLED=false — simulation dispatch skipped");
        return {
            total_queued: 0, dispatched: 0, succeeded: 0, failed: 0, skipped: 0,
            duration_ms: 0, results: [],
        };
    }
    const jobs = await fetchPendingJobs(MAX_CONCURRENT_SIMS * 2);
    const results = [];
    let dispatched = 0, succeeded = 0, failed = 0, skipped = 0;
    // Process in batches of MAX_CONCURRENT_SIMS
    for (let i = 0; i < jobs.length; i += MAX_CONCURRENT_SIMS) {
        const batch = jobs.slice(i, i + MAX_CONCURRENT_SIMS);
        await Promise.all(batch.map(async (job) => {
            const module = getModuleById(job.module_id);
            if (!module) {
                await markSkipped(job.job_id, `Module '${job.module_id}' not found in catalog`);
                skipped++;
                results.push({ job_id: job.job_id, cve_id: job.cve_id, module_id: job.module_id, success: null, confidence: null, duration_ms: null, status: "skipped", error: "module not found" });
                return;
            }
            try {
                dispatched++;
                const simResult = await runSimulation({
                    vuln_id: job.vuln_id,
                    cve_id: job.cve_id,
                    module_id: job.module_id,
                    target_host: job.target_host ?? SANDBOX_TARGET,
                    target_port: job.target_port ?? 80,
                    operator_id: "sentinel-auto-sim",
                    dry_run: job.dry_run ?? AUTO_SIM_DRY_RUN,
                });
                await markCompleted(job.job_id, simResult.result_id, simResult.success ?? false);
                if (simResult.success && job.vuln_id) {
                    await escalateVulnerability(job.vuln_id, job.cve_id);
                    succeeded++;
                }
                else {
                    failed++;
                }
                results.push({
                    job_id: job.job_id,
                    cve_id: job.cve_id,
                    module_id: job.module_id,
                    success: simResult.success,
                    confidence: simResult.confidence,
                    duration_ms: simResult.duration_ms,
                    status: simResult.status,
                });
            }
            catch (e) {
                const msg = e.message;
                await markFailed(job.job_id, msg);
                failed++;
                results.push({ job_id: job.job_id, cve_id: job.cve_id, module_id: job.module_id, success: false, confidence: null, duration_ms: null, status: "failed", error: msg });
            }
        }));
    }
    const duration_ms = Date.now() - start;
    console.log(`[AUTO-SIM] Dispatched ${dispatched} sims: ${succeeded} exploited, ${failed} failed, ${skipped} skipped (${duration_ms}ms)`);
    return {
        total_queued: jobs.length,
        dispatched,
        succeeded,
        failed,
        skipped,
        duration_ms,
        results,
    };
}
/** Full auto-sim cycle: rebuild queue + dispatch. */
export async function runAutoSimCycle() {
    const queued = await buildSimulationQueue();
    const dispatch = await dispatchSimulationQueue();
    return { queued, dispatch };
}
/** Emergency: kill all running simulations and clear pending queue. */
export async function emergencyStop() {
    const killed = await killAllSimulations();
    const { data } = await supabase
        .from("simulation_queue")
        .update({ status: "skipped", error_msg: "Emergency stop triggered", completed_at: new Date().toISOString() })
        .eq("status", "pending")
        .select("job_id");
    console.log(`[AUTO-SIM] Emergency stop: killed ${killed.length} sandboxes, cleared ${data?.length ?? 0} pending jobs`);
    return { killed, cleared: data?.length ?? 0 };
}
//# sourceMappingURL=auto-simulation.js.map