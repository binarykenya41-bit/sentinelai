import { analyzeRisk } from "../ai/risk-reasoning.js";
import { generatePatch } from "../ai/patch-generation.js";
import { modelAttackScenario } from "../ai/attack-modeling.js";
import { mapToCompliance } from "../ai/compliance-mapping.js";
import { generateExecutiveReport } from "../ai/executive-reporting.js";
export async function aiRoutes(app) {
    // POST /api/ai/risk — contextual risk reasoning for a CVE+asset pair
    app.post("/api/ai/risk", async (req, reply) => {
        const { vuln, asset, graph } = req.body;
        if (!vuln?.cve_id || !asset?.hostname) {
            return reply.status(400).send({ error: "vuln.cve_id and asset.hostname are required" });
        }
        const result = await analyzeRisk(vuln, asset, graph);
        return reply.send(result);
    });
    // POST /api/ai/patch — generate a secure code patch for a CVE
    app.post("/api/ai/patch", async (req, reply) => {
        const body = req.body;
        if (!body?.cve_id || !body?.affected_code || !body?.language) {
            return reply.status(400).send({ error: "cve_id, language, and affected_code are required" });
        }
        const result = await generatePatch(body);
        return reply.send(result);
    });
    // POST /api/ai/attack-model — generate multi-step attack scenario
    app.post("/api/ai/attack-model", async (req, reply) => {
        const body = req.body;
        if (!body?.cve_id) {
            return reply.status(400).send({ error: "cve_id is required" });
        }
        const result = await modelAttackScenario(body);
        return reply.send(result);
    });
    // POST /api/ai/compliance — map CVE remediation to compliance controls
    app.post("/api/ai/compliance", async (req, reply) => {
        const body = req.body;
        if (!body?.cve_id || !body?.frameworks?.length) {
            return reply.status(400).send({ error: "cve_id and frameworks[] are required" });
        }
        const result = await mapToCompliance(body);
        return reply.send(result);
    });
    // POST /api/ai/executive-report — generate board-level security briefing
    app.post("/api/ai/executive-report", async (req, reply) => {
        const { org_name, period, posture } = req.body;
        if (!org_name || !posture) {
            return reply.status(400).send({ error: "org_name and posture are required" });
        }
        const result = await generateExecutiveReport(org_name, period ?? "Current Quarter", posture);
        return reply.send(result);
    });
}
//# sourceMappingURL=ai.js.map