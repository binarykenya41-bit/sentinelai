import { supabase } from "../lib/supabase.js";
export async function darkWebRoutes(app) {
    app.get("/api/dark-web", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let q = supabase.from("dark_web_findings").select("*", { count: "exact" })
            .order("discovered_at", { ascending: false });
        if (req.query.category)
            q = q.eq("category", req.query.category);
        if (req.query.severity)
            q = q.eq("severity", req.query.severity);
        if (req.query.status)
            q = q.eq("status", req.query.status);
        if (industry && industry !== 'all')
            q = q.eq("industry", industry);
        q = q.limit(parseInt(req.query.limit ?? "50"));
        const { data, error, count } = await q;
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send({ total: count, findings: data });
    });
    app.get("/api/dark-web/stats", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let statsQ = supabase.from("dark_web_findings")
            .select("category, severity, status, threat_actor");
        if (industry && industry !== 'all')
            statsQ = statsQ.eq("industry", industry);
        const { data, error } = await statsQ;
        if (error)
            return reply.status(500).send({ error: error.message });
        const rows = data ?? [];
        const actors = [...new Set(rows.map(r => r.threat_actor).filter(Boolean))];
        return reply.send({
            total: rows.length,
            new: rows.filter(r => r.status === "New").length,
            investigating: rows.filter(r => r.status === "Investigating").length,
            critical: rows.filter(r => r.severity === "Critical").length,
            threat_actors: actors.length,
            by_category: rows.reduce((acc, r) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc; }, {}),
            by_severity: rows.reduce((acc, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc; }, {}),
            by_status: rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {}),
        });
    });
    app.get("/api/dark-web/:id", async (req, reply) => {
        const { data, error } = await supabase.from("dark_web_findings").select("*").eq("finding_id", req.params.id).single();
        if (error)
            return reply.status(404).send({ error: "Finding not found" });
        return reply.send(data);
    });
    app.patch("/api/dark-web/:id", async (req, reply) => {
        const { data, error } = await supabase.from("dark_web_findings").update(req.body).eq("finding_id", req.params.id).select().single();
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send(data);
    });
}
//# sourceMappingURL=dark-web.js.map