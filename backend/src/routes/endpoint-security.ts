import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function endpointSecurityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; severity?: string; tactic?: string; limit?: string; offset?: string } }>(
    "/api/endpoint-security", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("edr_alerts").select("*", { count: "exact" })
        .order("detected_at", { ascending: false })
      if (req.query.status) q = q.eq("status", req.query.status)
      if (req.query.severity) q = q.eq("severity", req.query.severity)
      if (req.query.tactic) q = q.eq("tactic", req.query.tactic)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "100"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, alerts: data })
    }
  )

  app.get("/api/endpoint-security/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("edr_alerts")
      .select("severity, status, tactic, technique_id, os")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data: alerts, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = alerts ?? []
    const active = rows.filter(r => r.status === "Active" || r.status === "Investigating")
    const techniqueCount: Record<string, number> = {}
    for (const r of rows) {
      if (r.technique_id) techniqueCount[r.technique_id] = (techniqueCount[r.technique_id] ?? 0) + 1
    }
    const top_techniques = Object.entries(techniqueCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([technique, count]) => ({ technique, count }))

    // Endpoint compliance (based on alert status)
    let endpointsQ = supabase.from("edr_alerts")
      .select("endpoint, hostname, os, status").order("endpoint")
    if (industry && industry !== 'all') endpointsQ = endpointsQ.eq("industry", industry)
    const { data: endpoints } = await endpointsQ
    const endpointMap: Record<string, { hostname: string; os: string; alerts: number; compliant: boolean }> = {}
    for (const r of (endpoints ?? [])) {
      if (!endpointMap[r.endpoint]) endpointMap[r.endpoint] = { hostname: r.hostname, os: r.os, alerts: 0, compliant: true }
      endpointMap[r.endpoint].alerts++
      if (r.status === "Active") endpointMap[r.endpoint].compliant = false
    }
    return reply.send({
      total_alerts: rows.length,
      active: active.length,
      resolved: rows.filter(r => r.status === "Resolved").length,
      false_positives: rows.filter(r => r.status === "False Positive").length,
      critical: rows.filter(r => r.severity === "Critical").length,
      by_severity: rows.reduce((acc: Record<string, number>, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc }, {}),
      by_tactic: rows.reduce((acc: Record<string, number>, r) => { if (r.tactic) { acc[r.tactic] = (acc[r.tactic] ?? 0) + 1 } return acc }, {}),
      top_techniques,
      total_endpoints: Object.keys(endpointMap).length,
      compliant_endpoints: Object.values(endpointMap).filter(e => e.compliant).length,
    })
  })

  app.get("/api/endpoint-security/endpoints", async (_req, reply) => {
    const { data, error } = await supabase.from("edr_alerts")
      .select("endpoint, hostname, os, status, detected_at")
    if (error) return reply.status(500).send({ error: error.message })
    const endpointMap: Record<string, { hostname: string; os: string; alerts: number; active_alerts: number; last_alert: string }> = {}
    for (const r of (data ?? [])) {
      if (!endpointMap[r.endpoint]) endpointMap[r.endpoint] = { hostname: r.hostname, os: r.os, alerts: 0, active_alerts: 0, last_alert: r.detected_at }
      endpointMap[r.endpoint].alerts++
      if (r.status === "Active" || r.status === "Investigating") endpointMap[r.endpoint].active_alerts++
      if (r.detected_at > endpointMap[r.endpoint].last_alert) endpointMap[r.endpoint].last_alert = r.detected_at
    }
    return reply.send(Object.entries(endpointMap).map(([id, ep]) => ({ id, ...ep })))
  })

  app.get<{ Params: { id: string } }>("/api/endpoint-security/:id", async (req, reply) => {
    const { data, error } = await supabase.from("edr_alerts").select("*").eq("alert_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Alert not found" })
    return reply.send(data)
  })

  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    "/api/endpoint-security/:id", async (req, reply) => {
      const update: Record<string, unknown> = { ...req.body }
      if (req.body.status === "Resolved" || req.body.status === "False Positive") {
        update.resolved_at = new Date().toISOString()
      }
      const { data, error } = await supabase.from("edr_alerts").update(update).eq("alert_id", req.params.id).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )
}
