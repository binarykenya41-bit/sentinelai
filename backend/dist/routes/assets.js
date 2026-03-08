import { supabase } from "../lib/supabase.js";
export async function assetsRoutes(app) {
    // GET /api/assets — list assets with filtering and pagination
    app.get("/api/assets", async (req, reply) => {
        let query = supabase
            .from("assets")
            .select("*", { count: "exact" })
            .order("criticality", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(parseInt(req.query.limit ?? "100"))
            .range(parseInt(req.query.offset ?? "0"), parseInt(req.query.offset ?? "0") + parseInt(req.query.limit ?? "100") - 1);
        if (req.query.type)
            query = query.eq("type", req.query.type);
        if (req.query.criticality)
            query = query.eq("criticality", req.query.criticality);
        if (req.query.patch_status)
            query = query.eq("patch_status", req.query.patch_status);
        if (req.query.source)
            query = query.eq("source", req.query.source);
        if (req.query.search) {
            query = query.or(`hostname.ilike.%${req.query.search}%,os_version.ilike.%${req.query.search}%`);
        }
        const { data, error, count } = await query;
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send({ total: count, assets: data });
    });
    // GET /api/assets/stats — asset inventory summary
    app.get("/api/assets/stats", async (_req, reply) => {
        const { data, error } = await supabase
            .from("assets")
            .select("type, criticality, patch_status, source");
        if (error)
            return reply.status(500).send({ error: error.message });
        const assets = data ?? [];
        const byType = {};
        const byCriticality = {};
        const byPatchStatus = {};
        const bySource = {};
        for (const a of assets) {
            byType[a.type] = (byType[a.type] ?? 0) + 1;
            byCriticality[a.criticality] = (byCriticality[a.criticality] ?? 0) + 1;
            byPatchStatus[a.patch_status] = (byPatchStatus[a.patch_status] ?? 0) + 1;
            if (a.source)
                bySource[a.source] = (bySource[a.source] ?? 0) + 1;
        }
        return reply.send({
            total: assets.length,
            by_type: byType,
            by_criticality: byCriticality,
            by_patch_status: byPatchStatus,
            by_source: bySource,
        });
    });
    // GET /api/assets/:id — single asset detail
    app.get("/api/assets/:id", async (req, reply) => {
        const { data, error } = await supabase
            .from("assets")
            .select("*")
            .eq("asset_id", req.params.id)
            .single();
        if (error)
            return reply.status(404).send({ error: "Asset not found" });
        // Also fetch open vulns for this asset
        const { data: vulns } = await supabase
            .from("vulnerabilities")
            .select("vuln_id, cve_id, cvss_v3, kev_status, epss_score, remediation_status, mitre_techniques")
            .contains("affected_assets", [req.params.id])
            .neq("remediation_status", "patched")
            .neq("remediation_status", "verified")
            .order("cvss_v3", { ascending: false });
        return reply.send({ ...data, open_vulnerabilities: vulns ?? [] });
    });
    // PATCH /api/assets/:id — update asset fields
    app.patch("/api/assets/:id", async (req, reply) => {
        const { data, error } = await supabase
            .from("assets")
            .update({ ...req.body, last_scan_at: new Date().toISOString() })
            .eq("asset_id", req.params.id)
            .select()
            .single();
        if (error)
            return reply.status(500).send({ error: error.message });
        await supabase.from("audit_log").insert({
            actor: "api",
            action: "asset_updated",
            resource_type: "asset",
            resource_id: req.params.id,
            payload: req.body,
        });
        return reply.send(data);
    });
}
//# sourceMappingURL=assets.js.map