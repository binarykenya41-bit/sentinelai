import { supabase } from "../lib/supabase.js";
export async function cloudSecurityRoutes(app) {
    app.get("/api/cloud-security", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let q = supabase.from("cloud_findings").select("*", { count: "exact" })
            .order("detected_at", { ascending: false });
        if (req.query.provider)
            q = q.eq("provider", req.query.provider);
        if (req.query.severity)
            q = q.eq("severity", req.query.severity);
        if (req.query.status)
            q = q.eq("status", req.query.status);
        if (industry && industry !== 'all')
            q = q.eq("industry", industry);
        q = q.limit(parseInt(req.query.limit ?? "100"));
        const { data, error, count } = await q;
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send({ total: count, findings: data });
    });
    app.get("/api/cloud-security/stats", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let statsQ = supabase.from("cloud_findings").select("provider, severity, status");
        if (industry && industry !== 'all')
            statsQ = statsQ.eq("industry", industry);
        const { data, error } = await statsQ;
        if (error)
            return reply.status(500).send({ error: error.message });
        const rows = data ?? [];
        const open = rows.filter(r => r.status === "Open");
        const providers = ["AWS", "Azure", "GCP"];
        const by_provider = providers.reduce((acc, p) => {
            const pRows = rows.filter(r => r.provider === p);
            const pOpen = pRows.filter(r => r.status === "Open");
            const critCount = pOpen.filter(r => r.severity === "Critical").length;
            const highCount = pOpen.filter(r => r.severity === "High").length;
            const score = Math.max(0, 100 - critCount * 15 - highCount * 7);
            acc[p] = { total: pRows.length, open: pOpen.length, score };
            return acc;
        }, {});
        return reply.send({
            total: rows.length,
            open: open.length,
            critical: rows.filter(r => r.severity === "Critical").length,
            high: rows.filter(r => r.severity === "High").length,
            resolved: rows.filter(r => r.status === "Resolved").length,
            by_severity: rows.reduce((acc, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc; }, {}),
            by_provider: rows.reduce((acc, r) => { acc[r.provider] = (acc[r.provider] ?? 0) + 1; return acc; }, {}),
            provider_scores: by_provider,
        });
    });
    app.get("/api/cloud-security/:id", async (req, reply) => {
        const { data, error } = await supabase.from("cloud_findings").select("*").eq("finding_id", req.params.id).single();
        if (error)
            return reply.status(404).send({ error: "Finding not found" });
        return reply.send(data);
    });
    app.patch("/api/cloud-security/:id", async (req, reply) => {
        const update = { ...req.body };
        if (req.body.status === "Resolved")
            update.resolved_at = new Date().toISOString();
        const { data, error } = await supabase.from("cloud_findings").update(update).eq("finding_id", req.params.id).select().single();
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send(data);
    });
}
//# sourceMappingURL=cloud-security.js.map