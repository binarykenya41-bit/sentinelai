// server.js
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
// Import your route modules
import { githubRoutes } from "./routes/github.js";
import { cloudflareRoutes } from "./routes/cloudflare.js";
import { gcpRoutes } from "./routes/gcp.js";
import { integrationRoutes } from "./routes/integrations.js";
import { aiRoutes } from "./routes/ai.js";
import { intelRoutes } from "./routes/intel.js";
import { simulationRoutes } from "./routes/simulation.js";
import { networkRoutes } from "./routes/network.js";
import { attackGraphRoutes } from "./routes/attack-graph.js";
import { syncRoutes } from "./routes/sync.js";
import { assetsRoutes } from "./routes/assets.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { vulnerabilitiesRoutes } from "./routes/vulnerabilities.js";
import { patchRoutes } from "./routes/patches.js";
import { infraScanRoutes } from "./routes/infra-scan.js";
import { incidentsRoutes } from "./routes/incidents.js";
import { risksRoutes } from "./routes/risks.js";
import { devsecopsRoutes } from "./routes/devsecops.js";
import { cloudSecurityRoutes } from "./routes/cloud-security.js";
import { codeScanningRoutes } from "./routes/code-scanning.js";
import { containerSecurityRoutes } from "./routes/container-security.js";
import { malwareRoutes } from "./routes/malware.js";
import { zeroDayRoutes } from "./routes/zero-day.js";
import { redTeamRoutes } from "./routes/red-team.js";
import { endpointSecurityRoutes } from "./routes/endpoint-security.js";
import { darkWebRoutes } from "./routes/dark-web.js";
import { phishingRoutes } from "./routes/phishing.js";
import { logisticsLabRoutes } from "./routes/logistics-lab.js";
import { settingsRoutes } from "./routes/settings.js";
import { infrastructureRoutes } from "./routes/infrastructure.js";
import { industriesRoutes } from "./routes/industries.js";
import { startScheduler } from "./services/scheduler.js";
import { proxyRoutes } from './routes/proxy.js';
import { seedDataRoutes } from './routes/seed-data.js';
const PORT = parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "8000");
// Allowed frontend origins — supports exact matches and wildcard patterns
const EXTRA_ORIGINS = (process.env.BACKEND_CORS_ORIGINS ?? "").split(",").filter(Boolean);
function isAllowedOrigin(origin) {
    if (!origin)
        return true; // curl / Postman / server-to-server
    if (EXTRA_ORIGINS.includes(origin))
        return true;
    // Allow any GitHub Codespaces preview URL
    if (/^https:\/\/[a-z0-9-]+-3000\.app\.github\.dev$/.test(origin))
        return true;
    // Allow localhost on any port
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin))
        return true;
    // Allow any Cloudflare tunnel URL (backend calling itself, dev tunnels, etc.)
    if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin))
        return true;
    return false;
}
const app = Fastify({ logger: { level: "info" } });
// ---- CORS ----
await app.register(cors, {
    origin: (origin, cb) => {
        if (isAllowedOrigin(origin)) {
            cb(null, true);
        }
        else {
            cb(new Error("Not allowed by CORS"), false);
        }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
});
// ---- Health check ----
app.get("/health", async () => ({
    status: "ok",
    ts: new Date().toISOString(),
    version: "0.2.0",
}));
// ---- Register all routes ----
await app.register(integrationRoutes);
await app.register(githubRoutes);
await app.register(cloudflareRoutes);
await app.register(gcpRoutes);
await app.register(aiRoutes);
await app.register(intelRoutes);
await app.register(simulationRoutes);
await app.register(networkRoutes);
await app.register(attackGraphRoutes);
await app.register(syncRoutes);
await app.register(assetsRoutes);
await app.register(dashboardRoutes);
await app.register(vulnerabilitiesRoutes);
await app.register(patchRoutes);
await app.register(infraScanRoutes);
await app.register(incidentsRoutes);
await app.register(risksRoutes);
await app.register(devsecopsRoutes);
await app.register(cloudSecurityRoutes);
await app.register(codeScanningRoutes);
await app.register(containerSecurityRoutes);
await app.register(malwareRoutes);
await app.register(zeroDayRoutes);
await app.register(redTeamRoutes);
await app.register(endpointSecurityRoutes);
await app.register(darkWebRoutes);
await app.register(phishingRoutes);
await app.register(settingsRoutes);
await app.register(infrastructureRoutes);
await app.register(industriesRoutes);
await app.register(logisticsLabRoutes);
await app.register(proxyRoutes);
await app.register(seedDataRoutes);
// ---- Global error handler ----
app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.status(err.statusCode ?? 500).send({
        error: err.message ?? "Internal server error",
    });
});
// ---- Start server ----
try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Backend listening on port ${PORT}`);
    startScheduler();
}
catch (err) {
    app.log.error(err);
    process.exit(1);
}
//# sourceMappingURL=server.js.map