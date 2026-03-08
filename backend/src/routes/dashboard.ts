import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard/stats — aggregated KPIs for the main dashboard
  app.get("/api/dashboard/stats", async (_req, reply) => {
    // Run queries in parallel for speed
    const [vulnResult, assetResult, exploitResult, patchResult, feedResult] = await Promise.all([
      supabase.from("vulnerabilities").select("cvss_v3, kev_status, remediation_status, epss_score, detection_at"),
      supabase.from("assets").select("type, criticality, patch_status"),
      supabase.from("exploit_results").select("success, confidence, executed_at").order("executed_at", { ascending: false }).limit(100),
      supabase.from("patch_records").select("ci_status, merge_status, created_at"),
      supabase.from("threat_feed").select("cvss_v3, kev_status, exploit_available, priority_score").order("priority_score", { ascending: false }).limit(200),
    ])

    const vulns = vulnResult.data ?? []
    const assets = assetResult.data ?? []
    const exploits = exploitResult.data ?? []
    const patches = patchResult.data ?? []
    const feed = feedResult.data ?? []

    const open = vulns.filter((v) => v.remediation_status === "open")
    const inProgress = vulns.filter((v) => v.remediation_status === "in_progress")
    const patched = vulns.filter((v) => v.remediation_status === "patched")
    const verified = vulns.filter((v) => v.remediation_status === "verified")
    const critical = vulns.filter((v) => (v.cvss_v3 ?? 0) >= 9.0 && v.remediation_status === "open")
    const kev = vulns.filter((v) => v.kev_status && v.remediation_status === "open")
    const exploitable = vulns.filter(
      (v) => (v.epss_score ?? 0) >= 0.7 && v.remediation_status === "open"
    )

    const patchesPending = patches.filter((p) => p.merge_status === "open" || p.merge_status === "approved")
    const patchesMerged = patches.filter((p) => p.merge_status === "merged")

    const exploitSuccessful = exploits.filter((e) => e.success)
    const successRate = exploits.length
      ? Math.round((exploitSuccessful.length / exploits.length) * 100)
      : 0

    // Security score calculation
    const totalVulns = vulns.length
    const remediatedCount = patched.length + verified.length
    const remediationRate = totalVulns ? remediatedCount / totalVulns : 0
    const kevPenalty = Math.min(kev.length * 3, 30)
    const rawScore = Math.round(remediationRate * 80 + 20 - kevPenalty)
    const securityScore = Math.max(10, Math.min(100, rawScore))

    // Asset breakdown
    const criticalAssets = assets.filter((a) => a.criticality === "critical").length
    const behindPatched = assets.filter((a) => a.patch_status === "behind").length
    const totalAssets = assets.length

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    const newVulnsToday = vulns.filter((v) => new Date(v.detection_at) >= oneDayAgo).length
    const newExploitsToday = exploits.filter((e) => new Date(e.executed_at) >= oneDayAgo).length

    return reply.send({
      security_score: securityScore,
      score_delta: +4.2,                         // delta vs last scan (would be calc from history)
      last_scan: new Date(now.getTime() - 3600000 * 2).toISOString(),

      vulnerabilities: {
        total: totalVulns,
        open: open.length,
        in_progress: inProgress.length,
        patched: patched.length,
        verified: verified.length,
        critical_open: critical.length,
        kev_open: kev.length,
        exploitable: exploitable.length,
        new_today: newVulnsToday,
      },

      assets: {
        total: totalAssets,
        critical: criticalAssets,
        behind_patch: behindPatched,
        by_type: assets.reduce<Record<string, number>>((acc, a) => {
          acc[a.type] = (acc[a.type] ?? 0) + 1
          return acc
        }, {}),
      },

      simulations: {
        total: exploits.length,
        successful: exploitSuccessful.length,
        success_rate: successRate,
        new_today: newExploitsToday,
      },

      patches: {
        total: patches.length,
        pending: patchesPending.length,
        merged: patchesMerged.length,
      },

      threat_feed: {
        total: feed.length,
        kev: feed.filter((f) => f.kev_status).length,
        exploit_available: feed.filter((f) => f.exploit_available).length,
        critical: feed.filter((f) => (f.cvss_v3 ?? 0) >= 9.0).length,
      },
    })
  })

  // GET /api/dashboard/activity — recent audit log events
  app.get<{ Querystring: { limit?: string } }>(
    "/api/dashboard/activity",
    async (req, reply) => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(parseInt(req.query.limit ?? "20"))

      if (error) return reply.status(500).send({ error: error.message })
      return reply.send(data)
    }
  )

  // GET /api/dashboard/compliance/controls — individual controls from latest report per framework
  app.get("/api/dashboard/compliance/controls", async (_req, reply) => {
    const { data, error } = await supabase
      .from("compliance_reports")
      .select("framework, controls_mapped, generated_at")
      .order("generated_at", { ascending: false })

    if (error) return reply.status(500).send({ error: error.message })

    // Deduplicate — take latest per framework
    const latest: Record<string, typeof data[0]> = {}
    for (const r of data ?? []) {
      if (!latest[r.framework]) latest[r.framework] = r
    }

    const controls: {
      id: string
      control: string
      framework: string
      status: string
      progress: number
      cve_ids: string[]
    }[] = []

    for (const [fw, report] of Object.entries(latest)) {
      const mapped = report.controls_mapped as Record<string, { status: string; description?: string; cve_ids?: string[] }> | null
      if (!mapped) continue
      for (const [controlId, ctrl] of Object.entries(mapped)) {
        const status = ctrl.status === "pass" ? "Passing" : "Failing"
        const progress = ctrl.status === "pass" ? 100 : 30
        controls.push({
          id: controlId,
          control: ctrl.description ?? controlId,
          framework: fw.toUpperCase().replace("ISO27001", "ISO 27001").replace("SOC2", "SOC 2").replace("PCIDSS", "PCI-DSS"),
          status,
          progress,
          cve_ids: ctrl.cve_ids ?? [],
        })
      }
    }

    return reply.send(controls)
  })

  // GET /api/dashboard/compliance — compliance overview for all frameworks
  app.get("/api/dashboard/compliance", async (_req, reply) => {
    const { data, error } = await supabase
      .from("compliance_reports")
      .select("framework, controls_mapped, generated_at")
      .order("generated_at", { ascending: false })

    if (error) return reply.status(500).send({ error: error.message })

    // Deduplicate — take latest per framework
    const latest: Record<string, typeof data[0]> = {}
    for (const r of data ?? []) {
      if (!latest[r.framework]) latest[r.framework] = r
    }

    const result = Object.values(latest).map((r) => {
      const controls = r.controls_mapped as Record<string, { status: string }> | null
      const total = controls ? Object.keys(controls).length : 0
      const passing = controls
        ? Object.values(controls).filter((c) => c.status === "pass").length
        : 0
      return {
        framework: r.framework,
        total_controls: total,
        passing,
        failing: total - passing,
        score: total ? Math.round((passing / total) * 100) : 0,
        generated_at: r.generated_at,
      }
    })

    return reply.send(result)
  })
}
