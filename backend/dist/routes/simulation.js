import { supabase } from "../lib/supabase.js";
import { runSimulation, killSimulation, killAllSimulations, getRunningSimulations } from "../simulation/engine.js";
import { MODULE_CATALOG, getModuleById, getModulesForCve, getModulesByCategory } from "../simulation/modules.js";
export async function simulationRoutes(app) {
    // ─── Module Catalog ───────────────────────────────────────────────────────
    // GET /api/simulation/modules — list all available exploit modules
    app.get("/api/simulation/modules", async (req, reply) => {
        if (req.query.cve) {
            return reply.send(getModulesForCve(req.query.cve));
        }
        if (req.query.category) {
            return reply.send(getModulesByCategory(req.query.category));
        }
        return reply.send(MODULE_CATALOG);
    });
    // GET /api/simulation/modules/:id — single module details
    app.get("/api/simulation/modules/:id", async (req, reply) => {
        const m = getModuleById(req.params.id);
        if (!m)
            return reply.status(404).send({ error: "Module not found" });
        return reply.send(m);
    });
    // ─── Simulation Execution ─────────────────────────────────────────────────
    // POST /api/simulation/run — launch a simulation
    app.post("/api/simulation/run", async (req, reply) => {
        const { vuln_id, cve_id, module_id, target_host, target_port, operator_id, dry_run } = req.body;
        if (!vuln_id || !target_host || !operator_id) {
            return reply.status(400).send({ error: "vuln_id, target_host, operator_id are required" });
        }
        // Check vulnerability exists + get CVSS for gate
        const { data: vuln } = await supabase
            .from("vulnerabilities")
            .select("cvss_v3, cve_id, remediation_status")
            .eq("vuln_id", vuln_id)
            .single();
        if (!vuln)
            return reply.status(404).send({ error: "Vulnerability not found" });
        // Warn on patched/verified status
        if (vuln.remediation_status === "patched" || vuln.remediation_status === "verified") {
            return reply.status(409).send({
                error: `Cannot simulate — vulnerability is already ${vuln.remediation_status}`,
            });
        }
        const result = await runSimulation({
            vuln_id,
            cve_id: cve_id ?? vuln.cve_id,
            module_id,
            target_host,
            target_port,
            operator_id,
            dry_run,
        });
        return reply.status(201).send(result);
    });
    // DELETE /api/simulation/kill/:sandboxId — kill a running simulation
    app.delete("/api/simulation/kill/:sandboxId", async (req, reply) => {
        await killSimulation(req.params.sandboxId);
        return reply.send({ killed: req.params.sandboxId });
    });
    // DELETE /api/simulation/kill-all — emergency kill switch
    app.delete("/api/simulation/kill-all", async (_req, reply) => {
        const killed = await killAllSimulations();
        return reply.send({ killed_count: killed.length, sandbox_ids: killed });
    });
    // ─── Status + History ─────────────────────────────────────────────────────
    // GET /api/simulation/running — currently running simulations
    app.get("/api/simulation/running", async (_req, reply) => {
        return reply.send(getRunningSimulations());
    });
    // GET /api/simulation/results — historical results from Supabase
    app.get("/api/simulation/results", async (req, reply) => {
        let query = supabase
            .from("exploit_results")
            .select("*")
            .order("executed_at", { ascending: false })
            .limit(parseInt(req.query.limit ?? "50"));
        if (req.query.vuln_id)
            query = query.eq("vuln_id", req.query.vuln_id);
        if (req.query.success !== undefined)
            query = query.eq("success", req.query.success === "true");
        const { data, error } = await query;
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send(data);
    });
    // GET /api/simulation/results/:id — single result
    app.get("/api/simulation/results/:id", async (req, reply) => {
        const { data, error } = await supabase
            .from("exploit_results")
            .select("*")
            .eq("result_id", req.params.id)
            .single();
        if (error)
            return reply.status(404).send({ error: error.message });
        return reply.send(data);
    });
    // PATCH /api/simulation/results/:id — save terminal output after dry-run
    app.patch("/api/simulation/results/:id", async (req, reply) => {
        const { output_text } = req.body;
        if (!output_text)
            return reply.status(400).send({ error: "output_text required" });
        // Store in output_log_ref (repurposed for inline text in dry-run mode)
        const { data, error } = await supabase
            .from("exploit_results")
            .update({ output_log_ref: output_text.slice(0, 8000) })
            .eq("result_id", req.params.id)
            .select()
            .single();
        if (error)
            return reply.status(404).send({ error: error.message });
        return reply.send(data);
    });
    // GET /api/simulation/stats — aggregate simulation statistics
    app.get("/api/simulation/stats", async (_req, reply) => {
        const { data, error } = await supabase
            .from("exploit_results")
            .select("success, confidence, duration_ms, technique, executed_at");
        if (error)
            return reply.status(500).send({ error: error.message });
        const total = data.length;
        const succeeded = data.filter((r) => r.success).length;
        const avgConfidence = total
            ? data.reduce((s, r) => s + (r.confidence ?? 0), 0) / total
            : 0;
        const avgDuration = total
            ? data.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / total
            : 0;
        const techniqueCounts = {};
        for (const r of data) {
            if (r.technique)
                techniqueCounts[r.technique] = (techniqueCounts[r.technique] ?? 0) + 1;
        }
        return reply.send({
            total_simulations: total,
            successful: succeeded,
            failed: total - succeeded,
            success_rate: total ? succeeded / total : 0,
            avg_confidence: avgConfidence,
            avg_duration_ms: avgDuration,
            top_techniques: Object.entries(techniqueCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([technique, count]) => ({ technique, count })),
        });
    });
}
//# sourceMappingURL=simulation.js.map