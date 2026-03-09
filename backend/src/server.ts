import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { githubRoutes } from "./routes/github.js"
import { cloudflareRoutes } from "./routes/cloudflare.js"
import { gcpRoutes } from "./routes/gcp.js"
import { integrationRoutes } from "./routes/integrations.js"
import { aiRoutes } from "./routes/ai.js"
import { intelRoutes } from "./routes/intel.js"
import { simulationRoutes } from "./routes/simulation.js"
import { networkRoutes } from "./routes/network.js"
import { attackGraphRoutes } from "./routes/attack-graph.js"
import { syncRoutes } from "./routes/sync.js"
import { assetsRoutes } from "./routes/assets.js"
import { dashboardRoutes } from "./routes/dashboard.js"
import { vulnerabilitiesRoutes } from "./routes/vulnerabilities.js"
import { patchRoutes } from "./routes/patches.js"
import { infraScanRoutes } from "./routes/infra-scan.js"
import { incidentsRoutes } from "./routes/incidents.js"
import { risksRoutes } from "./routes/risks.js"
import { devsecopsRoutes } from "./routes/devsecops.js"
import { cloudSecurityRoutes } from "./routes/cloud-security.js"
import { codeScanningRoutes } from "./routes/code-scanning.js"
import { containerSecurityRoutes } from "./routes/container-security.js"
import { malwareRoutes } from "./routes/malware.js"
import { zeroDayRoutes } from "./routes/zero-day.js"
import { redTeamRoutes } from "./routes/red-team.js"
import { endpointSecurityRoutes } from "./routes/endpoint-security.js"
import { darkWebRoutes } from "./routes/dark-web.js"
import { phishingRoutes } from "./routes/phishing.js"
import { logisticsLabRoutes } from "./routes/logistics-lab.js"
import { settingsRoutes } from "./routes/settings.js"
import { infrastructureRoutes } from "./routes/infrastructure.js"
import { industriesRoutes } from "./routes/industries.js"
import { startScheduler } from "./services/scheduler.js"

const PORT = parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "8000")
const CORS_ORIGINS = (process.env.BACKEND_CORS_ORIGINS ?? "http://localhost:3000").split(",")

const app = Fastify({ logger: { level: "info" } })

// ---- CORS ----
await app.register(cors, {
  origin: CORS_ORIGINS,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
})

// ---- Health ----
app.get("/health", async () => ({
  status: "ok",
  ts: new Date().toISOString(),
  version: "0.2.0",
  services: {
    ai: !!process.env.ANTHROPIC_API_KEY,
    nvd: !!process.env.NVD_API_KEY,
    epss: true,
    kev: true,
    mitre_stix: true,
    vuldb: !!process.env.VULDB_API_KEY,
    simulation: true,
    network_monitoring: true,
    attack_graph: true,
    cve_sync: true,
    auto_simulation: process.env.AUTO_SIM_ENABLED === "true",
  },
}))

// ---- Integration routes ----
await app.register(integrationRoutes)
await app.register(githubRoutes)
await app.register(cloudflareRoutes)
await app.register(gcpRoutes)

// ---- AI Layer ----
await app.register(aiRoutes)

// ---- Threat Intelligence (CVE / NVD / EPSS / KEV / MITRE) ----
await app.register(intelRoutes)

// ---- Exploit Simulation Engine ----
await app.register(simulationRoutes)

// ---- Network Monitoring (ntopng, Suricata, Zabbix) ----
await app.register(networkRoutes)

// ---- Attack Graph (MITRE ATT&CK + CVE graph builder) ----
await app.register(attackGraphRoutes)

// ---- CVE Sync, Threat Feed & Auto-Simulation Scheduler ----
await app.register(syncRoutes)

// ---- Assets (digital twin inventory) ----
await app.register(assetsRoutes)

// ---- Dashboard aggregated stats ----
await app.register(dashboardRoutes)

// ---- Vulnerabilities (DB-backed list + stats) ----
await app.register(vulnerabilitiesRoutes)

// ---- Patch records ----
await app.register(patchRoutes)

// ---- Infrastructure Scanner (GitLab / WordPress / ERPNext / Keycloak / PG / Grafana) ----
await app.register(infraScanRoutes)

// ---- App Modules (Incident Response, Risks, DevSecOps, Cloud, Code, Container, Malware, etc.) ----
await app.register(incidentsRoutes)
await app.register(risksRoutes)
await app.register(devsecopsRoutes)
await app.register(cloudSecurityRoutes)
await app.register(codeScanningRoutes)
await app.register(containerSecurityRoutes)
await app.register(malwareRoutes)
await app.register(zeroDayRoutes)
await app.register(redTeamRoutes)
await app.register(endpointSecurityRoutes)
await app.register(darkWebRoutes)
await app.register(phishingRoutes)
await app.register(settingsRoutes)
await app.register(infrastructureRoutes)
await app.register(industriesRoutes)
await app.register(logisticsLabRoutes)

// ---- Global error handler ----
app.setErrorHandler((err, _req, reply) => {
  app.log.error(err)
  reply.status(err.statusCode ?? 500).send({
    error: err.message ?? "Internal server error",
  })
})

// ---- Start ----
try {
  await app.listen({ port: PORT, host: "0.0.0.0" })
  console.log(`Sentinel AI backend listening on port ${PORT}`)
  // Start background scheduler after server is up
  startScheduler()
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
