import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function integrationRoutes(app: FastifyInstance) {
  // GET /api/integrations — list all integrations (optionally filter by org_id)
  app.get<{ Querystring: { org_id?: string; category?: string } }>(
    "/api/integrations",
    async (req, reply) => {
      let query = supabase.from("integrations").select("*").order("created_at", { ascending: false })
      if (req.query.org_id) query = query.eq("org_id", req.query.org_id)
      if (req.query.category) query = query.eq("category", req.query.category)
      const { data, error } = await query
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )

  // GET /api/integrations/:id — single integration record
  app.get<{ Params: { id: string } }>(
    "/api/integrations/:id",
    async (req, reply) => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("integration_id", req.params.id)
        .single()
      if (error) return reply.status(404).send({ error: error.message })
      return reply.send(data)
    }
  )

  // POST /api/integrations — create or update an integration config
  app.post<{
    Body: {
      org_id: string
      category: string
      tool_id: string
      name: string
      config?: Record<string, unknown>
    }
  }>("/api/integrations", async (req, reply) => {
    const { org_id, category, tool_id, name, config } = req.body
    if (!org_id || !category || !tool_id || !name) {
      return reply.status(400).send({ error: "org_id, category, tool_id, and name are required" })
    }

    const { data, error } = await supabase
      .from("integrations")
      .upsert(
        { org_id, category, tool_id, name, config: config ?? null, status: "pending", updated_at: new Date().toISOString() },
        { onConflict: "org_id,tool_id" }
      )
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send(data)
  })

  // PATCH /api/integrations/:id/status — update connection status + last_sync
  app.patch<{ Params: { id: string }; Body: { status: string; last_sync_status?: string } }>(
    "/api/integrations/:id/status",
    async (req, reply) => {
      const { status, last_sync_status } = req.body
      const { data, error } = await supabase
        .from("integrations")
        .update({
          status: status as "connected" | "disconnected" | "pending" | "error",
          last_sync_at: new Date().toISOString(),
          last_sync_status: last_sync_status ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("integration_id", req.params.id)
        .select()
        .single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )

  // DELETE /api/integrations/:id — remove integration
  app.delete<{ Params: { id: string } }>(
    "/api/integrations/:id",
    async (req, reply) => {
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("integration_id", req.params.id)
      if (error) return reply.status(500).send({ error: error.message })
      return reply.status(204).send()
    }
  )
}
