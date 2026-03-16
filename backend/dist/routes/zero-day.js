import { supabase } from "../lib/supabase.js";
export async function zeroDayRoutes(app) {
    app.get("/api/zero-day", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let q = supabase.from("zero_days").select("*", { count: "exact" })
            .order("discovered_at", { ascending: false });
        if (req.query.status)
            q = q.eq("status", req.query.status);
        if (req.query.severity)
            q = q.eq("severity", req.query.severity);
        if (industry && industry !== 'all')
            q = q.eq("industry", industry);
        q = q.limit(parseInt(req.query.limit ?? "50"));
        const { data, error, count } = await q;
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send({ total: count, zero_days: data });
    });
    app.get("/api/zero-day/stats", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let statsQ = supabase.from("zero_days")
            .select("severity, status, exploit_maturity, epss_score");
        if (industry && industry !== 'all')
            statsQ = statsQ.eq("industry", industry);
        const { data, error } = await statsQ;
        if (error)
            return reply.status(500).send({ error: error.message });
        const rows = data ?? [];
        return reply.send({
            total: rows.length,
            unpatched: rows.filter(r => r.status === "Unpatched").length,
            critical: rows.filter(r => r.severity === "Critical").length,
            weaponized: rows.filter(r => r.exploit_maturity === "weaponized").length,
            avg_epss: rows.length ? Math.round(rows.reduce((s, r) => s + (r.epss_score ?? 0), 0) / rows.length * 1000) / 1000 : 0,
            by_status: rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {}),
            by_severity: rows.reduce((acc, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc; }, {}),
            by_maturity: rows.reduce((acc, r) => { acc[r.exploit_maturity ?? "unknown"] = (acc[r.exploit_maturity ?? "unknown"] ?? 0) + 1; return acc; }, {}),
        });
    });
    app.get("/api/zero-day/:id", async (req, reply) => {
        const { data, error } = await supabase.from("zero_days").select("*").eq("zd_id", req.params.id).single();
        if (error)
            return reply.status(404).send({ error: "Zero-day not found" });
        return reply.send(data);
    });
}
//# sourceMappingURL=zero-day.js.map