import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function risksRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; category?: string; limit?: string; offset?: string } }>(
    "/api/risks", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("risks").select("*", { count: "exact" })
        .order("risk_score", { ascending: false })
      if (req.query.status) q = q.eq("status", req.query.status)
      if (req.query.category) q = q.eq("category", req.query.category)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "100"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, risks: data })
    }
  )

  app.get("/api/risks/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("risks").select("status, category, risk_score")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    return reply.send({
      total: rows.length,
      critical: rows.filter(r => r.risk_score >= 15).length,
      high: rows.filter(r => r.risk_score >= 10 && r.risk_score < 15).length,
      medium: rows.filter(r => r.risk_score >= 5 && r.risk_score < 10).length,
      low: rows.filter(r => r.risk_score < 5).length,
      by_category: rows.reduce((acc: Record<string, number>, r) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc }, {}),
      by_status: rows.reduce((acc: Record<string, number>, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {}),
    })
  })

  app.get<{ Params: { id: string } }>("/api/risks/:id", async (req, reply) => {
    const { data, error } = await supabase.from("risks").select("*").eq("risk_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Risk not found" })
    return reply.send(data)
  })

  app.post<{ Body: { title: string; category: string; likelihood: number; impact: number; owner?: string; mitigation?: string; review_date?: string } }>(
    "/api/risks", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      const { title, category, likelihood, impact, owner, mitigation, review_date } = req.body
      const id = `risk-${Date.now().toString(36)}`
      const { data, error } = await supabase.from("risks").insert({
        risk_id: id, title, category, likelihood, impact,
        risk_score: likelihood * impact,
        status: "Open",
        owner: owner ?? "unassigned",
        mitigation: mitigation ?? "",
        review_date: review_date ?? null,
        ...(industry && industry !== 'all' ? { industry } : {}),
      }).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.status(201).send(data)
    }
  )

  app.patch<{ Params: { id: string }; Body: { status?: string; mitigation?: string; likelihood?: number; impact?: number } }>(
    "/api/risks/:id", async (req, reply) => {
      const update: Record<string, unknown> = { ...req.body }
      if (req.body.likelihood !== undefined && req.body.impact !== undefined) {
        update.risk_score = req.body.likelihood * req.body.impact
      }
      const { data, error } = await supabase.from("risks").update(update).eq("risk_id", req.params.id).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )
}
