/**
 * Seed Data Route — 2024 CVEs + Compliance Controls + Exploit Results + Threat Intel
 * POST /api/seed/exploits     — seeds 2024 CVE vulnerabilities + exploit results
 * POST /api/seed/compliance   — seeds compliance controls for logistics/container infra
 * POST /api/seed/threat-intel — seeds threat_feed, dark_web_findings, edr_alerts,
 *                               malware_samples, phishing_campaigns for logistics context
 */
import type { FastifyInstance } from "fastify";
export declare function seedDataRoutes(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=seed-data.d.ts.map