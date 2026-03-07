import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"
import { syncNvdLatest, syncKev, syncVulDb, syncAll } from "../services/cve-sync.js"
import { buildSimulationQueue, dispatchSimulationQueue, runAutoSimCycle, emergencyStop } from "../services/auto-simulation.js"
import { schedulerState } from "../services/scheduler.js"

export async function syncRoutes(app: FastifyInstance) {
  // ─── Scheduler Status ─────────────────────────────────────────────────────

  // GET /api/sync/status — last run times and results for all scheduled jobs
  app.get("/api/sync/status", async (_req, reply) => {
    // Also grab recent sync_jobs from DB
    const { data: recentJobs } = await supabase
      .from("sync_jobs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10)

    return reply.send({
      scheduler: schedulerState,
      recent_jobs: recentJobs ?? [],
      auto_sim_enabled: process.env.AUTO_SIM_ENABLED === "true",
      auto_sim_dry_run: process.env.AUTO_SIM_DRY_RUN !== "false",
    })
  })

  // ─── Manual Trigger Endpoints ─────────────────────────────────────────────

  // POST /api/sync/nvd — trigger NVD CVE sync
  app.post<{ Body: { hours_back?: number } }>("/api/sync/nvd", async (req, reply) => {
    const hours = req.body?.hours_back ?? 24
    const result = await syncNvdLatest(hours)
    schedulerState.nvd.lastRun = new Date().toISOString()
    schedulerState.nvd.lastResult = result
    return reply.send(result)
  })

  // POST /api/sync/kev — trigger KEV sync
  app.post<{ Body: { days_back?: number } }>("/api/sync/kev", async (req, reply) => {
    const days = req.body?.days_back ?? 7
    const result = await syncKev(days)
    schedulerState.kev.lastRun = new Date().toISOString()
    schedulerState.kev.lastResult = result
    return reply.send(result)
  })

  // POST /api/sync/vuldb — trigger VulDB sync
  app.post("/api/sync/vuldb", async (_req, reply) => {
    const result = await syncVulDb()
    schedulerState.vuldb.lastRun = new Date().toISOString()
    schedulerState.vuldb.lastResult = result
    return reply.send(result)
  })

  // POST /api/sync/all — trigger full sync (NVD + KEV + VulDB)
  app.post("/api/sync/all", async (_req, reply) => {
    const results = await syncAll()
    return reply.send(results)
  })

  // ─── Simulation Queue Management ──────────────────────────────────────────

  // GET /api/sync/queue — view current simulation queue
  app.get<{ Querystring: { status?: string; limit?: string } }>(
    "/api/sync/queue",
    async (req, reply) => {
      let query = supabase
        .from("simulation_queue")
        .select("*")
        .order("priority", { ascending: true })
        .order("scheduled_at", { ascending: true })
        .limit(parseInt(req.query.limit ?? "50"))

      if (req.query.status) query = query.eq("status", req.query.status)

      const { data, error } = await query
      if (error) return reply.status(500).send({ error: error.message })

      const stats = {
        pending:   data?.filter((j) => j.status === "pending").length ?? 0,
        running:   data?.filter((j) => j.status === "running").length ?? 0,
        completed: data?.filter((j) => j.status === "completed").length ?? 0,
        failed:    data?.filter((j) => j.status === "failed").length ?? 0,
        skipped:   data?.filter((j) => j.status === "skipped").length ?? 0,
      }

      return reply.send({ stats, jobs: data })
    }
  )

  // POST /api/sync/queue/build — scan open vulns and add simulation jobs
  app.post("/api/sync/queue/build", async (_req, reply) => {
    const queued = await buildSimulationQueue()
    return reply.send({ queued, message: `${queued} simulation jobs added to queue` })
  })

  // POST /api/sync/queue/dispatch — run pending simulation jobs
  app.post("/api/sync/queue/dispatch", async (_req, reply) => {
    const result = await dispatchSimulationQueue()
    return reply.send(result)
  })

  // POST /api/sync/simulate-all — full auto-sim cycle (build + dispatch)
  app.post("/api/sync/simulate-all", async (_req, reply) => {
    const result = await runAutoSimCycle()
    schedulerState.autoSim.lastRun = new Date().toISOString()
    schedulerState.autoSim.lastResult = result
    return reply.send(result)
  })

  // DELETE /api/sync/queue/emergency-stop — kill all sandboxes + clear queue
  app.delete("/api/sync/queue/emergency-stop", async (_req, reply) => {
    const result = await emergencyStop()
    return reply.send(result)
  })

  // ─── Threat Feed ──────────────────────────────────────────────────────────

  // GET /api/sync/threat-feed — paginated threat feed
  app.get<{
    Querystring: {
      limit?: string
      offset?: string
      kev?: string
      exploit?: string
      min_cvss?: string
      min_priority?: string
    }
  }>("/api/sync/threat-feed", async (req, reply) => {
    let query = supabase
      .from("threat_feed")
      .select("*")
      .order("priority_score", { ascending: false })
      .limit(parseInt(req.query.limit ?? "50"))
      .range(
        parseInt(req.query.offset ?? "0"),
        parseInt(req.query.offset ?? "0") + parseInt(req.query.limit ?? "50") - 1
      )

    if (req.query.kev === "true") query = query.eq("kev_status", true)
    if (req.query.exploit === "true") query = query.eq("exploit_available", true)
    if (req.query.min_cvss) query = query.gte("cvss_v3", parseFloat(req.query.min_cvss))
    if (req.query.min_priority) query = query.gte("priority_score", parseInt(req.query.min_priority))

    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ total: count, entries: data })
  })

  // GET /api/sync/threat-feed/:cveId — single threat feed entry
  app.get<{ Params: { cveId: string } }>(
    "/api/sync/threat-feed/:cveId",
    async (req, reply) => {
      const { data, error } = await supabase
        .from("threat_feed")
        .select("*")
        .eq("cve_id", req.params.cveId.toUpperCase())
        .single()
      if (error) return reply.status(404).send({ error: "Not found" })
      return reply.send(data)
    }
  )

  // GET /api/sync/threat-feed/stats — feed statistics summary
  app.get("/api/sync/threat-feed/stats", async (_req, reply) => {
    const { data, error } = await supabase
      .from("threat_feed")
      .select("cvss_v3, kev_status, exploit_available, exploit_maturity, priority_score, mitre_techniques")

    if (error) return reply.status(500).send({ error: error.message })

    const entries = data ?? []
    const techniqueCount: Record<string, number> = {}
    for (const e of entries) {
      for (const t of e.mitre_techniques ?? []) {
        techniqueCount[t] = (techniqueCount[t] ?? 0) + 1
      }
    }

    return reply.send({
      total: entries.length,
      kev_count: entries.filter((e) => e.kev_status).length,
      exploit_available: entries.filter((e) => e.exploit_available).length,
      weaponized: entries.filter((e) => e.exploit_maturity === "weaponized").length,
      functional: entries.filter((e) => e.exploit_maturity === "functional").length,
      poc: entries.filter((e) => e.exploit_maturity === "poc").length,
      critical_cvss: entries.filter((e) => (e.cvss_v3 ?? 0) >= 9.0).length,
      high_cvss: entries.filter((e) => (e.cvss_v3 ?? 0) >= 7.0 && (e.cvss_v3 ?? 0) < 9.0).length,
      avg_priority: entries.length
        ? Math.round(entries.reduce((s, e) => s + (e.priority_score ?? 0), 0) / entries.length)
        : 0,
      top_techniques: Object.entries(techniqueCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([technique, count]) => ({ technique, count })),
    })
  })
}
