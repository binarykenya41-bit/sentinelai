import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

const DEFAULT_ORG_ID = "a1b2c3d4-0000-0000-0000-000000000001"

export async function settingsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { org_id?: string } }>("/api/settings", async (req, reply) => {
    const orgId = req.query.org_id ?? DEFAULT_ORG_ID
    const { data, error } = await supabase.from("org_settings").select("*").eq("org_id", orgId).single()
    if (error) {
      // Return defaults if not found
      return reply.send({
        org_id: orgId,
        org_name: "Sentinel Demo Org",
        settings: {
          scan_interval_hours: 6,
          auto_patch: false,
          notify_email: "security@company.com",
          notify_slack: "#security-alerts",
          slack_webhook: "",
          severity_threshold: "High",
          sandbox_network: "sentinel-sandbox",
          sandbox_timeout_sec: 60,
          mfa_enforcement: true,
          sso_enabled: false,
          retention_days: 90,
          compliance_frameworks: ["iso27001", "soc2", "pcidss"],
          integrations_auto_sync: true,
          report_schedule: "weekly",
          api_rate_limit: 1000,
          sandbox_cpu_limit: "0.5",
          sandbox_memory_limit: "256m",
        },
      })
    }
    return reply.send(data)
  })

  app.put<{ Querystring: { org_id?: string }; Body: { org_name?: string; settings?: Record<string, unknown> } }>(
    "/api/settings", async (req, reply) => {
      const orgId = req.query.org_id ?? DEFAULT_ORG_ID
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (req.body.org_name) update.org_name = req.body.org_name
      if (req.body.settings) update.settings = req.body.settings
      const { data, error } = await supabase.from("org_settings")
        .upsert({ org_id: orgId, ...update }, { onConflict: "org_id" })
        .select().single()
      if (error) return reply.status(500).send({ error: error.message })
      await supabase.from("audit_log").insert({ actor: "api", action: "settings_updated", resource_type: "org_settings", resource_id: orgId, payload: req.body })
      return reply.send(data)
    }
  )
}
