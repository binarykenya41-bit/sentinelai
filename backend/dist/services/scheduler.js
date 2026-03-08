/**
 * Sentinel AI — Scheduler
 *
 * Cron-based scheduler that runs background services automatically.
 *
 * Schedule (all times UTC):
 *  - CVE NVD sync    every 6 hours  (00:00, 06:00, 12:00, 18:00)
 *  - KEV sync        every 24 hours (02:00)
 *  - VulDB sync      every 12 hours (04:00, 16:00)
 *  - Auto-sim cycle  every 12 hours (05:00, 17:00) — only if AUTO_SIM_ENABLED
 *  - MITRE cache     on startup + every 24h (03:00)
 *
 * All jobs are fire-and-forget with error isolation — one failure
 * does not block others.
 */
import cron from "node-cron";
import { syncNvdLatest, syncKev, syncVulDb } from "./cve-sync.js";
import { runAutoSimCycle } from "./auto-simulation.js";
import { warmCache } from "../intel/mitre.js";
const AUTO_SIM_ENABLED = process.env.AUTO_SIM_ENABLED === "true";
// Track last run times for /api/sync/status
export const schedulerState = {
    nvd: { lastRun: null, lastResult: null },
    kev: { lastRun: null, lastResult: null },
    vuldb: { lastRun: null, lastResult: null },
    autoSim: { lastRun: null, lastResult: null },
    mitre: { lastRun: null, lastResult: null },
    running: false,
};
function safe(name, fn) {
    return async () => {
        console.log(`[SCHEDULER] Starting: ${name}`);
        try {
            const result = await fn();
            console.log(`[SCHEDULER] Completed: ${name}`);
            return result;
        }
        catch (err) {
            console.error(`[SCHEDULER] Failed: ${name}`, err);
        }
    };
}
export function startScheduler() {
    console.log("[SCHEDULER] Starting Sentinel AI background scheduler");
    console.log(`[SCHEDULER] AUTO_SIM_ENABLED=${AUTO_SIM_ENABLED}`);
    // ── CVE NVD Sync — every 6 hours ─────────────────────────────────────────
    cron.schedule("0 0,6,12,18 * * *", safe("nvd-sync", async () => {
        const result = await syncNvdLatest(6);
        schedulerState.nvd.lastRun = new Date().toISOString();
        schedulerState.nvd.lastResult = result;
        return result;
    }));
    // ── CISA KEV Sync — every 24 hours at 02:00 UTC ──────────────────────────
    cron.schedule("0 2 * * *", safe("kev-sync", async () => {
        const result = await syncKev(1);
        schedulerState.kev.lastRun = new Date().toISOString();
        schedulerState.kev.lastResult = result;
        return result;
    }));
    // ── VulDB Sync — every 12 hours at 04:00 and 16:00 UTC ──────────────────
    cron.schedule("0 4,16 * * *", safe("vuldb-sync", async () => {
        const result = await syncVulDb();
        schedulerState.vuldb.lastRun = new Date().toISOString();
        schedulerState.vuldb.lastResult = result;
        return result;
    }));
    // ── Auto Simulation Cycle — every 12 hours at 05:00 and 17:00 UTC ────────
    if (AUTO_SIM_ENABLED) {
        cron.schedule("0 5,17 * * *", safe("auto-sim-cycle", async () => {
            const result = await runAutoSimCycle();
            schedulerState.autoSim.lastRun = new Date().toISOString();
            schedulerState.autoSim.lastResult = result;
            return result;
        }));
    }
    // ── MITRE ATT&CK cache warm — every 24 hours at 03:00 UTC ───────────────
    cron.schedule("0 3 * * *", safe("mitre-cache-warm", async () => {
        const result = await warmCache();
        schedulerState.mitre.lastRun = new Date().toISOString();
        schedulerState.mitre.lastResult = result;
        return result;
    }));
    // ── Startup tasks (run immediately without blocking server start) ─────────
    setImmediate(() => {
        // Warm MITRE STIX cache in background (first request otherwise takes ~30s)
        safe("mitre-startup-warm", async () => {
            const result = await warmCache();
            schedulerState.mitre.lastRun = new Date().toISOString();
            schedulerState.mitre.lastResult = result;
            console.log(`[SCHEDULER] MITRE cache warm: ${result.techniques} techniques loaded`);
        })();
    });
    console.log("[SCHEDULER] All cron jobs registered:");
    console.log("  NVD sync:   every 6h  (00:00, 06:00, 12:00, 18:00 UTC)");
    console.log("  KEV sync:   daily at  02:00 UTC");
    console.log("  VulDB sync: every 12h (04:00, 16:00 UTC)");
    if (AUTO_SIM_ENABLED) {
        console.log("  Auto-sim:   every 12h (05:00, 17:00 UTC)");
    }
    else {
        console.log("  Auto-sim:   DISABLED (set AUTO_SIM_ENABLED=true to enable)");
    }
    console.log("  MITRE warm: daily at  03:00 UTC + startup");
}
//# sourceMappingURL=scheduler.js.map