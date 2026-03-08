import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function patchRoutes(app: FastifyInstance) {
  // GET /api/patches — list all patch records with vuln context
  app.get<{
    Querystring: {
      ci_status?: string
      merge_status?: string
      resim_result?: string
      limit?: string
      offset?: string
    }
  }>("/api/patches", async (req, reply) => {
    let query = supabase
      .from("patch_records")
      .select(`
        *,
        vulnerabilities (
          cve_id, cvss_v3, kev_status, epss_score,
          mitre_techniques, blast_radius, remediation_status
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(parseInt(req.query.limit ?? "50"))
      .range(
        parseInt(req.query.offset ?? "0"),
        parseInt(req.query.offset ?? "0") + parseInt(req.query.limit ?? "50") - 1
      )

    if (req.query.ci_status) query = query.eq("ci_status", req.query.ci_status)
    if (req.query.merge_status) query = query.eq("merge_status", req.query.merge_status)
    if (req.query.resim_result) query = query.eq("resim_result", req.query.resim_result)

    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ total: count, patches: data })
  })

  // GET /api/patches/stats — summary
  app.get("/api/patches/stats", async (_req, reply) => {
    const { data, error } = await supabase
      .from("patch_records")
      .select("ci_status, merge_status, resim_result, created_at")

    if (error) return reply.status(500).send({ error: error.message })
    const patches = data ?? []

    return reply.send({
      total: patches.length,
      ci_passing: patches.filter((p) => p.ci_status === "passed").length,
      ci_failing: patches.filter((p) => p.ci_status === "failed").length,
      ci_running: patches.filter((p) => p.ci_status === "running").length,
      merged: patches.filter((p) => p.merge_status === "merged").length,
      pending_merge: patches.filter((p) => p.merge_status === "open" || p.merge_status === "approved").length,
      blocked: patches.filter((p) => p.merge_status === "blocked").length,
      exploit_confirmed_fixed: patches.filter((p) => p.resim_result === "exploit_failed").length,
      exploit_still_works: patches.filter((p) => p.resim_result === "exploit_succeeded").length,
    })
  })

  // GET /api/patches/:id — single patch record
  app.get<{ Params: { id: string } }>("/api/patches/:id", async (req, reply) => {
    const { data, error } = await supabase
      .from("patch_records")
      .select(`
        *,
        vulnerabilities (
          cve_id, cvss_v3, kev_status, epss_score,
          mitre_techniques, blast_radius, remediation_status,
          cwe_ids, scan_source
        )
      `)
      .eq("patch_id", req.params.id)
      .single()

    if (error) return reply.status(404).send({ error: "Patch record not found" })
    return reply.send(data)
  })

  // PATCH /api/patches/:id — update CI / merge status
  app.patch<{
    Params: { id: string }
    Body: {
      ci_status?: string
      merge_status?: string
      resim_result?: string
      commit_sha?: string
      pr_url?: string
    }
  }>("/api/patches/:id", async (req, reply) => {
    const { data, error } = await supabase
      .from("patch_records")
      .update(req.body)
      .eq("patch_id", req.params.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })

    await supabase.from("audit_log").insert({
      actor: "api",
      action: "patch_record_updated",
      resource_type: "patch_record",
      resource_id: req.params.id,
      payload: req.body,
    })

    return reply.send(data)
  })
}
