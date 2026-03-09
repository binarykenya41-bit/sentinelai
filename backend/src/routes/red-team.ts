import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function redTeamRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; limit?: string } }>(
    "/api/red-team", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("red_team_campaigns").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
      if (req.query.status) q = q.eq("status", req.query.status)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "50"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, campaigns: data })
    }
  )

  app.get("/api/red-team/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("red_team_campaigns")
      .select("status, findings, critical_findings, kill_chain_stage")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    const active = rows.filter(r => r.status === "Active")
    return reply.send({
      total: rows.length,
      active: active.length,
      completed: rows.filter(r => r.status === "Completed").length,
      planned: rows.filter(r => r.status === "Planned").length,
      total_findings: rows.reduce((s, r) => s + (r.findings ?? 0), 0),
      critical_findings: rows.reduce((s, r) => s + (r.critical_findings ?? 0), 0),
      by_kill_chain: rows.reduce((acc: Record<string, number>, r) => { if (r.kill_chain_stage) { acc[r.kill_chain_stage] = (acc[r.kill_chain_stage] ?? 0) + 1 } return acc }, {}),
    })
  })

  app.get<{ Params: { id: string } }>("/api/red-team/:id", async (req, reply) => {
    const { data, error } = await supabase.from("red_team_campaigns").select("*").eq("campaign_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Campaign not found" })
    return reply.send(data)
  })

  app.post<{ Body: { name: string; objective: string; operator?: string; target_scope?: string[]; start_date?: string; description?: string } }>(
    "/api/red-team", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      const id = `rt-${Date.now().toString(36)}`
      const { data, error } = await supabase.from("red_team_campaigns").insert({
        campaign_id: id,
        name: req.body.name,
        objective: req.body.objective,
        status: "Planned",
        operator: req.body.operator ?? "unassigned",
        target_scope: req.body.target_scope ?? [],
        start_date: req.body.start_date ?? null,
        kill_chain_stage: "Initial Access",
        findings: 0,
        critical_findings: 0,
        description: req.body.description ?? "",
        ...(industry && industry !== 'all' ? { industry } : {}),
      }).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.status(201).send(data)
    }
  )

  app.patch<{ Params: { id: string }; Body: { status?: string; kill_chain_stage?: string; findings?: number; critical_findings?: number } }>(
    "/api/red-team/:id", async (req, reply) => {
      const update: Record<string, unknown> = { ...req.body }
      if (req.body.status === "Completed") update.end_date = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase.from("red_team_campaigns").update(update).eq("campaign_id", req.params.id).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )
}
