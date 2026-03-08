import { listZones } from "../integrations/cloudflare/client.js";
import { getDnsRecords, analyzeDnsExposure } from "../integrations/cloudflare/dns.js";
import { getFirewallRules, getWafPackages, summarizeWaf } from "../integrations/cloudflare/waf.js";
import { getSecurityEvents, aggregateFirewallStats } from "../integrations/cloudflare/logs.js";
export async function cloudflareRoutes(app) {
    // GET /api/cloudflare/zones — list all zones
    app.get("/api/cloudflare/zones", async (_req, reply) => {
        const zones = await listZones();
        return reply.send(zones);
    });
    // GET /api/cloudflare/zones/:zoneId/dns — DNS records + exposure analysis
    app.get("/api/cloudflare/zones/:zoneId/dns", async (req, reply) => {
        const { zoneId } = req.params;
        const records = await getDnsRecords(zoneId);
        const analysis = analyzeDnsExposure(records);
        return reply.send({ records, analysis });
    });
    // GET /api/cloudflare/zones/:zoneId/waf — WAF rules + posture summary
    app.get("/api/cloudflare/zones/:zoneId/waf", async (req, reply) => {
        const { zoneId } = req.params;
        const [rules, packages] = await Promise.all([
            getFirewallRules(zoneId),
            getWafPackages(zoneId).catch(() => []), // packages not available on all plans
        ]);
        const summary = summarizeWaf(rules);
        return reply.send({ rules, packages, summary });
    });
    // GET /api/cloudflare/zones/:zoneId/logs — firewall/security event log
    app.get("/api/cloudflare/zones/:zoneId/logs", async (req, reply) => {
        const { zoneId } = req.params;
        const since = req.query.since;
        const limit = parseInt(req.query.limit ?? "100");
        const events = await getSecurityEvents(zoneId, since, limit);
        const stats = aggregateFirewallStats(events);
        return reply.send({ events, stats });
    });
    // GET /api/cloudflare/zones/:zoneId/summary — all-in-one dashboard payload
    app.get("/api/cloudflare/zones/:zoneId/summary", async (req, reply) => {
        const { zoneId } = req.params;
        const [records, rules, events] = await Promise.all([
            getDnsRecords(zoneId),
            getFirewallRules(zoneId),
            getSecurityEvents(zoneId),
        ]);
        return reply.send({
            dns: analyzeDnsExposure(records),
            waf: summarizeWaf(rules),
            firewall_logs: aggregateFirewallStats(events),
        });
    });
}
//# sourceMappingURL=cloudflare.js.map