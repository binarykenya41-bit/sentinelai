import { getTopFlows, getInterfaces, getRecentSuricataAlerts, getZabbixProblems, getNetworkPosture, } from "../integrations/network/monitor.js";
export async function networkRoutes(app) {
    // GET /api/network/posture — aggregated network security posture
    app.get("/api/network/posture", async (_req, reply) => {
        const posture = await getNetworkPosture();
        return reply.send(posture);
    });
    // GET /api/network/flows — live flows from ntopng
    app.get("/api/network/flows", async (req, reply) => {
        const flows = await getTopFlows(parseInt(req.query.iface ?? "0"), parseInt(req.query.limit ?? "50"));
        return reply.send(flows);
    });
    // GET /api/network/interfaces — network interfaces from ntopng
    app.get("/api/network/interfaces", async (_req, reply) => {
        const ifaces = await getInterfaces();
        return reply.send(ifaces);
    });
    // GET /api/network/alerts — Suricata IDS alerts
    app.get("/api/network/alerts", async (req, reply) => {
        const alerts = await getRecentSuricataAlerts(parseInt(req.query.limit ?? "100"));
        return reply.send(alerts);
    });
    // GET /api/network/problems — Zabbix infrastructure problems
    app.get("/api/network/problems", async (req, reply) => {
        const problems = await getZabbixProblems(parseInt(req.query.min_severity ?? "2"));
        return reply.send(problems);
    });
}
//# sourceMappingURL=network.js.map