import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function devsecopsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; limit?: string } }>(
    "/api/devsecops/pipelines", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("devsecops_pipelines").select("*", { count: "exact" })
        .order("run_at", { ascending: false })
      if (req.query.status) q = q.eq("status", req.query.status)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "50"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, pipelines: data })
    }
  )

  app.get("/api/devsecops/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("devsecops_pipelines")
      .select("status, policy_pass, sbom_findings, secrets_count, sast_issues, dast_issues")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    const policyPass = rows.filter(r => r.policy_pass === true).length
    return reply.send({
      total: rows.length,
      passed: rows.filter(r => r.status === "passed").length,
      failed: rows.filter(r => r.status === "failed").length,
      running: rows.filter(r => r.status === "running").length,
      sbom_findings: rows.reduce((s, r) => s + (r.sbom_findings ?? 0), 0),
      secrets_detected: rows.reduce((s, r) => s + (r.secrets_count ?? 0), 0),
      sast_issues: rows.reduce((s, r) => s + (r.sast_issues ?? 0), 0),
      dast_issues: rows.reduce((s, r) => s + (r.dast_issues ?? 0), 0),
      policy_pass_rate: rows.length ? Math.round((policyPass / rows.length) * 100) : 0,
    })
  })

  app.get<{ Querystring: { pipeline_id?: string } }>(
    "/api/devsecops/sbom", async (req, reply) => {
      let q = supabase.from("sbom_findings").select("*").order("severity")
      if (req.query.pipeline_id) q = q.eq("pipeline_id", req.query.pipeline_id)
      const { data, error } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )

  app.get("/api/devsecops/policies", async (_req, reply) => {
    const { data, error } = await supabase.from("devsecops_policies").select("*")
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send(data)
  })
}
