import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function containerSecurityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; limit?: string; offset?: string } }>(
    "/api/container-security", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("container_scans").select("*", { count: "exact" })
        .order("scanned_at", { ascending: false })
      if (req.query.status) q = q.eq("status", req.query.status)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "50"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, scans: data })
    }
  )

  app.get("/api/container-security/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("container_scans")
      .select("status, policy_pass, critical_vulns, high_vulns, medium_vulns, low_vulns, total_vulns, runtime_alerts")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    return reply.send({
      total_images: rows.length,
      clean: rows.filter(r => r.status === "Clean").length,
      vulnerable: rows.filter(r => r.status === "Vulnerable").length,
      critical: rows.filter(r => r.status === "Critical").length,
      policy_pass: rows.filter(r => r.policy_pass).length,
      policy_fail: rows.filter(r => r.policy_pass === false).length,
      total_vulns: rows.reduce((s, r) => s + (r.total_vulns ?? 0), 0),
      critical_vulns: rows.reduce((s, r) => s + (r.critical_vulns ?? 0), 0),
      high_vulns: rows.reduce((s, r) => s + (r.high_vulns ?? 0), 0),
      runtime_alerts: rows.reduce((s, r) => s + (r.runtime_alerts ?? 0), 0),
    })
  })

  app.get<{ Params: { id: string } }>("/api/container-security/:id", async (req, reply) => {
    const { data, error } = await supabase.from("container_scans").select("*").eq("scan_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Scan not found" })
    return reply.send(data)
  })
}
