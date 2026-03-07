import type { FastifyInstance } from "fastify"
import { fetchCveById, searchCves } from "../intel/nvd.js"
import { fetchEpssScore, fetchEpssScores, fetchTopEpss } from "../intel/epss.js"
import { getKevEntry, getAllKev, getRecentKev } from "../intel/kev.js"
import { getTechnique, getTechniquesByTactic, mapCweToTechniques, searchTechniques, listAllTechniques, getTactics } from "../intel/mitre.js"
import { enrichCve } from "../intel/enrichment.js"
import { fetchVulDbByCve, fetchVulDbRecent, searchVulDb, fetchExploitableVulns, batchExploitStatus } from "../intel/vuldb.js"

export async function intelRoutes(app: FastifyInstance) {
  // ─── CVE / NVD ──────────────────────────────────────────────────────────────

  // GET /api/intel/cve/:id — fetch single CVE from NVD
  app.get<{ Params: { id: string } }>("/api/intel/cve/:id", async (req, reply) => {
    const cve = await fetchCveById(req.params.id.toUpperCase())
    if (!cve) return reply.status(404).send({ error: "CVE not found" })
    return reply.send(cve)
  })

  // GET /api/intel/cve/:id/enriched — full enrichment (NVD + EPSS + KEV + MITRE)
  app.get<{ Params: { id: string } }>("/api/intel/cve/:id/enriched", async (req, reply) => {
    const enriched = await enrichCve(req.params.id.toUpperCase())
    if (!enriched) return reply.status(404).send({ error: "CVE not found" })
    return reply.send(enriched)
  })

  // GET /api/intel/cves/search — search NVD CVEs
  app.get<{
    Querystring: {
      keyword?: string
      cweId?: string
      severity?: string
      pubStart?: string
      pubEnd?: string
      limit?: string
      offset?: string
    }
  }>("/api/intel/cves/search", async (req, reply) => {
    const result = await searchCves({
      keyword: req.query.keyword,
      cweId: req.query.cweId,
      cvssV3SeverityMin: req.query.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined,
      pubStartDate: req.query.pubStart,
      pubEndDate: req.query.pubEnd,
      resultsPerPage: parseInt(req.query.limit ?? "20"),
      startIndex: parseInt(req.query.offset ?? "0"),
    })
    return reply.send(result)
  })

  // POST /api/intel/cves/batch-enrich — enrich multiple CVEs
  app.post<{ Body: { cve_ids: string[] } }>("/api/intel/cves/batch-enrich", async (req, reply) => {
    const { cve_ids } = req.body
    if (!cve_ids?.length) return reply.status(400).send({ error: "cve_ids array is required" })
    if (cve_ids.length > 50) return reply.status(400).send({ error: "Max 50 CVEs per batch" })

    const results = await Promise.allSettled(cve_ids.map((id) => enrichCve(id.toUpperCase())))
    const enriched = results
      .map((r, i) => ({ cve_id: cve_ids[i], result: r.status === "fulfilled" ? r.value : null }))

    return reply.send({ enriched })
  })

  // ─── EPSS ────────────────────────────────────────────────────────────────────

  // GET /api/intel/epss/:cveId — single EPSS score
  app.get<{ Params: { cveId: string } }>("/api/intel/epss/:cveId", async (req, reply) => {
    const score = await fetchEpssScore(req.params.cveId.toUpperCase())
    if (!score) return reply.status(404).send({ error: "EPSS score not found" })
    return reply.send(score)
  })

  // GET /api/intel/epss/top — top CVEs by EPSS score
  app.get<{ Querystring: { limit?: string; min?: string } }>(
    "/api/intel/epss/top",
    async (req, reply) => {
      const scores = await fetchTopEpss(
        parseInt(req.query.limit ?? "100"),
        parseFloat(req.query.min ?? "0.5")
      )
      return reply.send(scores)
    }
  )

  // POST /api/intel/epss/batch — batch EPSS lookup
  app.post<{ Body: { cve_ids: string[] } }>("/api/intel/epss/batch", async (req, reply) => {
    const { cve_ids } = req.body
    if (!cve_ids?.length) return reply.status(400).send({ error: "cve_ids required" })
    const scores = await fetchEpssScores(cve_ids)
    return reply.send(scores)
  })

  // ─── CISA KEV ────────────────────────────────────────────────────────────────

  // GET /api/intel/kev — full KEV catalog
  app.get("/api/intel/kev", async (_req, reply) => {
    const kev = await getAllKev()
    return reply.send({ total: kev.length, entries: kev })
  })

  // GET /api/intel/kev/recent — KEV entries added in last N days
  app.get<{ Querystring: { days?: string } }>("/api/intel/kev/recent", async (req, reply) => {
    const days = parseInt(req.query.days ?? "30")
    const entries = await getRecentKev(days)
    return reply.send({ days, total: entries.length, entries })
  })

  // GET /api/intel/kev/:cveId — check if CVE is in KEV
  app.get<{ Params: { cveId: string } }>("/api/intel/kev/:cveId", async (req, reply) => {
    const entry = await getKevEntry(req.params.cveId.toUpperCase())
    return reply.send({ is_kev: entry !== null, entry })
  })

  // ─── MITRE ATT&CK ────────────────────────────────────────────────────────────

  // GET /api/intel/mitre/techniques — list all techniques
  app.get<{ Querystring: { tactic?: string; q?: string } }>(
    "/api/intel/mitre/techniques",
    async (req, reply) => {
      if (req.query.q) {
        const results = await searchTechniques(req.query.q)
        return reply.send(results)
      }
      if (req.query.tactic) {
        const results = await getTechniquesByTactic(req.query.tactic)
        return reply.send(results)
      }
      const all = await listAllTechniques()
      return reply.send({ total: all.length, techniques: all })
    }
  )

  // GET /api/intel/mitre/techniques/:id — single technique
  app.get<{ Params: { id: string } }>("/api/intel/mitre/techniques/:id", async (req, reply) => {
    const t = await getTechnique(req.params.id.toUpperCase())
    if (!t) return reply.status(404).send({ error: "Technique not found" })
    return reply.send(t)
  })

  // POST /api/intel/mitre/map-cwe — map CWE IDs to ATT&CK techniques
  app.post<{ Body: { cwe_ids: string[] } }>("/api/intel/mitre/map-cwe", async (req, reply) => {
    const { cwe_ids } = req.body
    if (!cwe_ids?.length) return reply.status(400).send({ error: "cwe_ids required" })
    const techniques = await mapCweToTechniques(cwe_ids)
    return reply.send(techniques)
  })

  // GET /api/intel/mitre/tactics — all MITRE ATT&CK tactics
  app.get("/api/intel/mitre/tactics", async (_req, reply) => {
    const tactics = await getTactics()
    return reply.send(tactics)
  })

  // ─── VulDB Threat Intelligence ────────────────────────────────────────────

  // GET /api/intel/vuldb/cve/:id — VulDB threat data for a CVE
  app.get<{ Params: { id: string } }>("/api/intel/vuldb/cve/:id", async (req, reply) => {
    const entry = await fetchVulDbByCve(req.params.id.toUpperCase())
    if (!entry) return reply.status(404).send({ error: "Not found in VulDB" })
    return reply.send(entry)
  })

  // GET /api/intel/vuldb/recent — latest VulDB entries
  app.get<{ Querystring: { limit?: string } }>("/api/intel/vuldb/recent", async (req, reply) => {
    const entries = await fetchVulDbRecent(parseInt(req.query.limit ?? "10"))
    return reply.send(entries)
  })

  // GET /api/intel/vuldb/search — search VulDB by keyword
  app.get<{ Querystring: { q: string; limit?: string } }>(
    "/api/intel/vuldb/search",
    async (req, reply) => {
      if (!req.query.q) return reply.status(400).send({ error: "q param required" })
      const results = await searchVulDb(req.query.q, parseInt(req.query.limit ?? "20"))
      return reply.send(results)
    }
  )

  // GET /api/intel/vuldb/exploitable — CVEs with exploit code available
  app.get<{ Querystring: { limit?: string } }>(
    "/api/intel/vuldb/exploitable",
    async (req, reply) => {
      const results = await fetchExploitableVulns(parseInt(req.query.limit ?? "20"))
      return reply.send(results)
    }
  )

  // POST /api/intel/vuldb/batch-exploit-status — check exploit status for CVE list
  app.post<{ Body: { cve_ids: string[] } }>(
    "/api/intel/vuldb/batch-exploit-status",
    async (req, reply) => {
      const { cve_ids } = req.body
      if (!cve_ids?.length) return reply.status(400).send({ error: "cve_ids required" })
      if (cve_ids.length > 10) return reply.status(400).send({ error: "Max 10 CVEs (API credit limit)" })
      const result = await batchExploitStatus(cve_ids)
      return reply.send(result)
    }
  )
}
