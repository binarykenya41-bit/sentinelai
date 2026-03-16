import { supabase } from "../lib/supabase.js";
export async function incidentsRoutes(app) {
    app.get("/api/incidents", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let q = supabase.from("incidents").select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .limit(parseInt(req.query.limit ?? "50"));
        if (req.query.status)
            q = q.eq("status", req.query.status);
        if (req.query.severity)
            q = q.eq("severity", req.query.severity);
        if (industry && industry !== 'all')
            q = q.eq("industry", industry);
        if (req.query.offset)
            q = q.range(parseInt(req.query.offset), parseInt(req.query.offset) + parseInt(req.query.limit ?? "50") - 1);
        const { data, error, count } = await q;
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send({ total: count, incidents: data });
    });
    app.get("/api/incidents/stats", async (req, reply) => {
        const industry = req.headers['x-industry'];
        let statsQ = supabase.from("incidents").select("severity, status, mttr_hours");
        if (industry && industry !== 'all')
            statsQ = statsQ.eq("industry", industry);
        const { data, error } = await statsQ;
        if (error)
            return reply.status(500).send({ error: error.message });
        const rows = data ?? [];
        const active = rows.filter(r => r.status !== "Resolved");
        const resolved = rows.filter(r => r.status === "Resolved");
        const mttrValues = resolved.map(r => r.mttr_hours).filter(Boolean);
        const avg_mttr = mttrValues.length ? mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length : 0;
        return reply.send({
            active: active.length,
            resolved_30d: resolved.length,
            avg_mttr: Math.round(avg_mttr * 10) / 10,
            open_playbooks: 12,
            by_severity: rows.reduce((acc, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc; }, {}),
            by_status: rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {}),
        });
    });
    app.get("/api/incidents/playbooks", async (_req, reply) => {
        const { data, error } = await supabase.from("incident_playbooks").select("*").order("name");
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send(data);
    });
    app.get("/api/incidents/:id", async (req, reply) => {
        const { data, error } = await supabase.from("incidents").select("*").eq("incident_id", req.params.id).single();
        if (error)
            return reply.status(404).send({ error: "Incident not found" });
        const { data: timeline } = await supabase.from("incident_timeline")
            .select("*").eq("incident_id", req.params.id).order("time", { ascending: true });
        return reply.send({ ...data, timeline: timeline ?? [] });
    });
    app.post("/api/incidents", async (req, reply) => {
        const industry = req.headers['x-industry'];
        const id = `inc-${Date.now().toString(36)}`;
        const { data, error } = await supabase.from("incidents").insert({
            incident_id: id,
            title: req.body.title,
            severity: req.body.severity,
            category: req.body.category ?? "Other",
            status: "Investigating",
            assigned_to: req.body.assigned_to ?? "unassigned",
            affected_assets: req.body.affected_assets ?? [],
            description: req.body.description ?? "",
            progress: 0,
            ...(industry && industry !== 'all' ? { industry } : {}),
        }).select().single();
        if (error)
            return reply.status(500).send({ error: error.message });
        await supabase.from("audit_log").insert({ actor: "api", action: "incident_created", resource_type: "incident", resource_id: id, payload: req.body });
        return reply.status(201).send(data);
    });
    app.patch("/api/incidents/:id", async (req, reply) => {
        const update = { ...req.body };
        if (req.body.status === "Resolved")
            update.resolved_at = new Date().toISOString();
        const { data, error } = await supabase.from("incidents").update(update).eq("incident_id", req.params.id).select().single();
        if (error)
            return reply.status(500).send({ error: error.message });
        return reply.send(data);
    });
}
//# sourceMappingURL=incidents.js.map