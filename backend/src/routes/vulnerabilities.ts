import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function vulnerabilitiesRoutes(app: FastifyInstance) {
  // GET /api/vulnerabilities — paginated list with rich filtering
  app.get<{
    Querystring: {
      status?: string
      kev?: string
      min_cvss?: string
      max_cvss?: string
      scan_source?: string
      cve?: string
      limit?: string
      offset?: string
    }
  }>("/api/vulnerabilities", async (req, reply) => {
    let query = supabase
      .from("vulnerabilities")
      .select("*", { count: "exact" })
      .order("cvss_v3", { ascending: false })
      .order("epss_score", { ascending: false })
      .limit(parseInt(req.query.limit ?? "100"))
      .range(
        parseInt(req.query.offset ?? "0"),
        parseInt(req.query.offset ?? "0") + parseInt(req.query.limit ?? "100") - 1
      )

    if (req.query.status) query = query.eq("remediation_status", req.query.status)
    if (req.query.kev === "true") query = query.eq("kev_status", true)
    if (req.query.min_cvss) query = query.gte("cvss_v3", parseFloat(req.query.min_cvss))
    if (req.query.max_cvss) query = query.lte("cvss_v3", parseFloat(req.query.max_cvss))
    if (req.query.scan_source) query = query.eq("scan_source", req.query.scan_source)
    if (req.query.cve) query = query.ilike("cve_id", `%${req.query.cve}%`)

    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ total: count, vulnerabilities: data })
  })

  // GET /api/vulnerabilities/stats — summary stats
  app.get("/api/vulnerabilities/stats", async (_req, reply) => {
    const { data, error } = await supabase
      .from("vulnerabilities")
      .select("cvss_v3, kev_status, remediation_status, epss_score, scan_source, mitre_techniques")

    if (error) return reply.status(500).send({ error: error.message })
    const vulns = data ?? []

    const techniqueCount: Record<string, number> = {}
    const sourceCount: Record<string, number> = {}
    for (const v of vulns) {
      for (const t of v.mitre_techniques ?? []) {
        techniqueCount[t] = (techniqueCount[t] ?? 0) + 1
      }
      if (v.scan_source) sourceCount[v.scan_source] = (sourceCount[v.scan_source] ?? 0) + 1
    }

    return reply.send({
      total: vulns.length,
      open: vulns.filter((v) => v.remediation_status === "open").length,
      in_progress: vulns.filter((v) => v.remediation_status === "in_progress").length,
      patched: vulns.filter((v) => v.remediation_status === "patched").length,
      verified: vulns.filter((v) => v.remediation_status === "verified").length,
      critical: vulns.filter((v) => (v.cvss_v3 ?? 0) >= 9.0).length,
      high: vulns.filter((v) => (v.cvss_v3 ?? 0) >= 7.0 && (v.cvss_v3 ?? 0) < 9.0).length,
      medium: vulns.filter((v) => (v.cvss_v3 ?? 0) >= 4.0 && (v.cvss_v3 ?? 0) < 7.0).length,
      low: vulns.filter((v) => (v.cvss_v3 ?? 0) < 4.0).length,
      kev_open: vulns.filter((v) => v.kev_status && v.remediation_status === "open").length,
      high_epss: vulns.filter((v) => (v.epss_score ?? 0) >= 0.7).length,
      by_source: sourceCount,
      top_techniques: Object.entries(techniqueCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([technique, count]) => ({ technique, count })),
    })
  })

  // GET /api/vulnerabilities/:id — single vuln with exploit history
  app.get<{ Params: { id: string } }>("/api/vulnerabilities/:id", async (req, reply) => {
    // Accept both UUID and CVE ID
    const isUuid = /^[0-9a-f-]{36}$/.test(req.params.id)
    let query = supabase.from("vulnerabilities").select("*")
    if (isUuid) {
      query = query.eq("vuln_id", req.params.id)
    } else {
      query = query.ilike("cve_id", req.params.id)
    }
    const { data, error } = await query.single()
    if (error) return reply.status(404).send({ error: "Vulnerability not found" })

    const { data: exploits } = await supabase
      .from("exploit_results")
      .select("*")
      .eq("vuln_id", data.vuln_id)
      .order("executed_at", { ascending: false })

    const { data: patches } = await supabase
      .from("patch_records")
      .select("*")
      .eq("vuln_id", data.vuln_id)
      .order("created_at", { ascending: false })

    return reply.send({
      ...data,
      exploit_history: exploits ?? [],
      patch_history: patches ?? [],
    })
  })

  // PATCH /api/vulnerabilities/:id/status — update remediation status
  app.patch<{
    Params: { id: string }
    Body: { status: string; note?: string }
  }>("/api/vulnerabilities/:id/status", async (req, reply) => {
    const validStatuses = ["open", "in_progress", "patched", "verified"]
    if (!validStatuses.includes(req.body.status)) {
      return reply.status(400).send({ error: `status must be one of: ${validStatuses.join(", ")}` })
    }

    const { data, error } = await supabase
      .from("vulnerabilities")
      .update({ remediation_status: req.body.status })
      .eq("vuln_id", req.params.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })

    await supabase.from("audit_log").insert({
      actor: "api",
      action: "vulnerability_status_updated",
      resource_type: "vulnerability",
      resource_id: req.params.id,
      payload: { status: req.body.status, note: req.body.note },
    })

    return reply.send(data)
  })
}
