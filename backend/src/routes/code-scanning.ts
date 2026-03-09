import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function codeScanningRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { repo?: string; tool?: string; severity?: string; status?: string; limit?: string; offset?: string } }>(
    "/api/code-scanning", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("code_findings").select("*", { count: "exact" })
        .order("detected_at", { ascending: false })
      if (req.query.repo) q = q.eq("repo", req.query.repo)
      if (req.query.tool) q = q.eq("tool", req.query.tool)
      if (req.query.severity) q = q.eq("severity", req.query.severity)
      if (req.query.status) q = q.eq("status", req.query.status)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "100"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, findings: data })
    }
  )

  app.get("/api/code-scanning/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("code_findings").select("repo, tool, severity, status, category")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    const open = rows.filter(r => r.status === "Open")
    // Score per repo: 100 - (critical*15 + high*7 + medium*3)
    const repoMap: Record<string, { critical: number; high: number; medium: number }> = {}
    for (const r of open) {
      if (!repoMap[r.repo]) repoMap[r.repo] = { critical: 0, high: 0, medium: 0 }
      if (r.severity === "Critical") repoMap[r.repo].critical++
      else if (r.severity === "High") repoMap[r.repo].high++
      else if (r.severity === "Medium") repoMap[r.repo].medium++
    }
    const repo_scores = Object.entries(repoMap).map(([repo, counts]) => ({
      repo,
      score: Math.max(0, 100 - counts.critical * 15 - counts.high * 7 - counts.medium * 3),
      ...counts,
    }))
    return reply.send({
      total: rows.length,
      open: open.length,
      critical: rows.filter(r => r.severity === "Critical").length,
      high: rows.filter(r => r.severity === "High").length,
      resolved: rows.filter(r => r.status === "Resolved").length,
      by_tool: rows.reduce((acc: Record<string, number>, r) => { acc[r.tool] = (acc[r.tool] ?? 0) + 1; return acc }, {}),
      by_severity: rows.reduce((acc: Record<string, number>, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc }, {}),
      by_category: rows.reduce((acc: Record<string, number>, r) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc }, {}),
      repo_scores,
    })
  })

  app.get<{ Params: { id: string } }>("/api/code-scanning/:id", async (req, reply) => {
    const { data, error } = await supabase.from("code_findings").select("*").eq("finding_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Finding not found" })
    return reply.send(data)
  })

  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    "/api/code-scanning/:id", async (req, reply) => {
      const update: Record<string, unknown> = { ...req.body }
      if (req.body.status === "Resolved") update.resolved_at = new Date().toISOString()
      const { data, error } = await supabase.from("code_findings").update(update).eq("finding_id", req.params.id).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )
}
