import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function infrastructureRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { type?: string; environment?: string; patch_status?: string; search?: string; limit?: string; offset?: string } }>(
    "/api/infrastructure", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("infrastructure_nodes").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
      if (req.query.type) q = q.eq("type", req.query.type)
      if (req.query.environment) q = q.eq("environment", req.query.environment)
      if (req.query.patch_status) q = q.eq("patch_status", req.query.patch_status)
      if (req.query.search) {
        q = q.or(`name.ilike.%${req.query.search}%,hostname.ilike.%${req.query.search}%,ip_address.ilike.%${req.query.search}%`)
      }
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "100"))
      if (req.query.offset) q = q.range(parseInt(req.query.offset), parseInt(req.query.offset) + parseInt(req.query.limit ?? "100") - 1)
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, nodes: data })
    }
  )

  app.get("/api/infrastructure/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("infrastructure_nodes")
      .select("type, environment, patch_status, external_tool, known_cves")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    const withCves = rows.filter(r => (r.known_cves ?? []).length > 0)
    return reply.send({
      total: rows.length,
      by_type: rows.reduce((acc: Record<string, number>, r) => { acc[r.type ?? "unknown"] = (acc[r.type ?? "unknown"] ?? 0) + 1; return acc }, {}),
      by_environment: rows.reduce((acc: Record<string, number>, r) => { acc[r.environment ?? "unknown"] = (acc[r.environment ?? "unknown"] ?? 0) + 1; return acc }, {}),
      by_patch_status: rows.reduce((acc: Record<string, number>, r) => { acc[r.patch_status ?? "unknown"] = (acc[r.patch_status ?? "unknown"] ?? 0) + 1; return acc }, {}),
      by_source: rows.reduce((acc: Record<string, number>, r) => { if (r.external_tool) { acc[r.external_tool] = (acc[r.external_tool] ?? 0) + 1 } return acc }, {}),
      vulnerable: withCves.length,
      behind_patches: rows.filter(r => r.patch_status === "behind").length,
    })
  })

  app.get<{ Params: { id: string } }>("/api/infrastructure/:id", async (req, reply) => {
    const { data, error } = await supabase.from("infrastructure_nodes").select("*").eq("node_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Node not found" })
    return reply.send(data)
  })

  app.post<{ Body: { name: string; type: string; environment: string; ip_address?: string; hostname?: string; os_name?: string; os_version?: string; patch_status?: string; external_tool?: string } }>(
    "/api/infrastructure", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      const { data, error } = await supabase.from("infrastructure_nodes").insert({
        org_id: "a1b2c3d4-0000-0000-0000-000000000001",
        name: req.body.name,
        type: req.body.type,
        environment: req.body.environment,
        ip_address: req.body.ip_address,
        hostname: req.body.hostname,
        os_name: req.body.os_name,
        os_version: req.body.os_version,
        patch_status: req.body.patch_status ?? "unknown",
        external_tool: req.body.external_tool,
        known_cves: [],
        ...(industry && industry !== 'all' ? { industry } : {}),
      }).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      await supabase.from("audit_log").insert({ actor: "api", action: "infra_node_added", resource_type: "infrastructure_node", resource_id: data.node_id, payload: req.body })
      return reply.status(201).send(data)
    }
  )

  app.patch<{ Params: { id: string }; Body: { patch_status?: string; known_cves?: string[]; external_tool?: string } }>(
    "/api/infrastructure/:id", async (req, reply) => {
      const { data, error } = await supabase.from("infrastructure_nodes")
        .update(req.body).eq("node_id", req.params.id).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )
}
