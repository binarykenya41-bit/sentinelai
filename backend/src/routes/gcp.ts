import type { FastifyInstance } from "fastify"
import { listAllInstances, syncGcpInstancesToAssets } from "../integrations/gcp/compute.js"
import {
  getAdminActivityLogs,
  getVpcFirewallLogs,
  getAuthFailureLogs,
  getGkeLogs,
  getSecurityLogs,
} from "../integrations/gcp/logging.js"
import { getSccFindings, getCveFindingsFromScc, summarizeSccFindings } from "../integrations/gcp/scc.js"

export async function gcpRoutes(app: FastifyInstance) {
  // GET /api/gcp/compute/instances — all VM instances across zones
  app.get("/api/gcp/compute/instances", async (_req, reply) => {
    const instances = await listAllInstances()
    return reply.send(instances)
  })

  // POST /api/gcp/compute/sync — sync GCP instances into Sentinel assets table
  app.post<{ Body: { org_id: string } }>(
    "/api/gcp/compute/sync",
    async (req, reply) => {
      const { org_id } = req.body
      if (!org_id) return reply.status(400).send({ error: "org_id is required" })
      const result = await syncGcpInstancesToAssets(org_id)
      return reply.send(result)
    }
  )

  // GET /api/gcp/logs/admin — Cloud Audit admin activity logs
  app.get("/api/gcp/logs/admin", async (_req, reply) => {
    const logs = await getAdminActivityLogs()
    return reply.send(logs)
  })

  // GET /api/gcp/logs/firewall — VPC firewall deny logs
  app.get("/api/gcp/logs/firewall", async (_req, reply) => {
    const logs = await getVpcFirewallLogs()
    return reply.send(logs)
  })

  // GET /api/gcp/logs/auth-failures — IAM authentication failures
  app.get("/api/gcp/logs/auth-failures", async (_req, reply) => {
    const logs = await getAuthFailureLogs()
    return reply.send(logs)
  })

  // GET /api/gcp/logs/gke — GKE / container security events
  app.get("/api/gcp/logs/gke", async (_req, reply) => {
    const logs = await getGkeLogs()
    return reply.send(logs)
  })

  // GET /api/gcp/logs/custom — arbitrary Cloud Logging filter
  app.get<{ Querystring: { filter: string; pageSize?: string } }>(
    "/api/gcp/logs/custom",
    async (req, reply) => {
      const { filter, pageSize } = req.query
      if (!filter) return reply.status(400).send({ error: "filter is required" })
      const logs = await getSecurityLogs(filter, parseInt(pageSize ?? "100"))
      return reply.send(logs)
    }
  )

  // GET /api/gcp/scc/findings — Security Command Center findings
  app.get<{ Querystring: { state?: string; severity?: string } }>(
    "/api/gcp/scc/findings",
    async (req, reply) => {
      const state = (req.query.state as "ACTIVE" | "INACTIVE") ?? "ACTIVE"
      const severities = req.query.severity
        ? req.query.severity.split(",").map((s) => s.trim().toUpperCase())
        : ["CRITICAL", "HIGH", "MEDIUM"]
      const findings = await getSccFindings(state, severities)
      return reply.send(findings)
    }
  )

  // GET /api/gcp/scc/summary — SCC posture summary for dashboard
  app.get("/api/gcp/scc/summary", async (_req, reply) => {
    const findings = await getSccFindings()
    const summary = summarizeSccFindings(findings)
    return reply.send(summary)
  })

  // GET /api/gcp/scc/cve-findings — SCC findings that map to CVEs
  app.get("/api/gcp/scc/cve-findings", async (_req, reply) => {
    const findings = await getCveFindingsFromScc()
    return reply.send(findings)
  })
}
