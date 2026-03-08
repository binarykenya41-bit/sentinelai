import { buildCveAttackGraph, buildFullAttackMatrix } from "../intel/attack-graph.js";
import { getAttackChain, warmCache } from "../intel/mitre.js";
import { supabase } from "../lib/supabase.js";
export async function attackGraphRoutes(app) {
    // POST /api/attack-graph/build — build graph for given CVE IDs + optional assets
    app.post("/api/attack-graph/build", async (req, reply) => {
        const { cve_ids, asset_ids } = req.body;
        if (!cve_ids?.length) {
            return reply.status(400).send({ error: "cve_ids array is required" });
        }
        if (cve_ids.length > 20) {
            return reply.status(400).send({ error: "Max 20 CVEs per graph build" });
        }
        const graph = await buildCveAttackGraph(cve_ids.map((id) => id.toUpperCase()), asset_ids ?? []);
        return reply.send(graph);
    });
    // POST /api/attack-graph/build-auto — build graph from all open vulnerabilities in DB
    app.post("/api/attack-graph/build-auto", async (_req, reply) => {
        const { data: vulns, error } = await supabase
            .from("vulnerabilities")
            .select("vuln_id, cve_id, affected_assets")
            .in("remediation_status", ["open", "in_progress"])
            .order("cvss_v3", { ascending: false })
            .limit(20);
        if (error)
            return reply.status(500).send({ error: error.message });
        if (!vulns?.length) {
            // Return empty graph instead of 404
            return reply.send({ nodes: [], edges: [], tactic_flow: [], meta: { cve_count: 0, technique_count: 0, tactic_count: 0, generated_at: new Date().toISOString() } });
        }
        const cveIds = [...new Set(vulns.map((v) => v.cve_id).filter(Boolean))];
        const assetIdSet = new Set(vulns.flatMap((v) => v.affected_assets ?? []));
        const { data: assets } = await supabase
            .from("assets")
            .select("asset_id, hostname, type")
            .in("asset_id", Array.from(assetIdSet));
        const graph = await buildCveAttackGraph(cveIds, (assets ?? []).map((a) => ({ id: a.asset_id, hostname: a.hostname ?? "", type: a.type ?? "" })));
        return reply.send(graph);
    });
    // POST /api/attack-graph/build-from-vuln — build graph from Supabase vuln IDs
    app.post("/api/attack-graph/build-from-vuln", async (req, reply) => {
        const { vuln_ids } = req.body;
        if (!vuln_ids?.length) {
            return reply.status(400).send({ error: "vuln_ids required" });
        }
        // Fetch CVE IDs + affected assets from Supabase
        const { data: vulns, error } = await supabase
            .from("vulnerabilities")
            .select("cve_id, affected_assets")
            .in("vuln_id", vuln_ids);
        if (error)
            return reply.status(500).send({ error: error.message });
        if (!vulns?.length)
            return reply.status(404).send({ error: "No vulnerabilities found" });
        const cveIds = [...new Set(vulns.map((v) => v.cve_id).filter(Boolean))];
        const assetIdSet = new Set(vulns.flatMap((v) => v.affected_assets ?? []));
        // Fetch asset details
        const { data: assets } = await supabase
            .from("assets")
            .select("asset_id, hostname, type")
            .in("asset_id", Array.from(assetIdSet));
        const graph = await buildCveAttackGraph(cveIds, (assets ?? []).map((a) => ({ id: a.asset_id, hostname: a.hostname ?? "", type: a.type ?? "" })));
        return reply.send(graph);
    });
    // GET /api/attack-graph/matrix — full ATT&CK technique matrix (all techniques by tactic)
    app.get("/api/attack-graph/matrix", async (_req, reply) => {
        const matrix = await buildFullAttackMatrix();
        return reply.send(matrix);
    });
    // GET /api/attack-graph/chain — ordered attack chain for given technique IDs
    app.get("/api/attack-graph/chain", async (req, reply) => {
        const ids = (req.query.techniques ?? "").split(",").map((t) => t.trim()).filter(Boolean);
        if (!ids.length)
            return reply.status(400).send({ error: "techniques param required (comma-separated)" });
        const chain = await getAttackChain(ids);
        return reply.send(chain);
    });
    // POST /api/attack-graph/warm-cache — pre-warm the MITRE STIX cache
    // Call this on backend startup or via a cron to avoid first-request latency
    app.post("/api/attack-graph/warm-cache", async (_req, reply) => {
        const result = await warmCache();
        return reply.send({ ...result, cached_at: new Date().toISOString() });
    });
}
//# sourceMappingURL=attack-graph.js.map