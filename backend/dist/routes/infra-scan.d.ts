/**
 * Sentinel AI — Infrastructure Scanner
 * Scans company services: GitLab, WordPress, ERPNext, Keycloak, PostgreSQL, Grafana, Prometheus
 * Flow: identify services → detect CVEs → map vulnerabilities → generate attack graph → recommend patches
 */
import type { FastifyInstance } from "fastify";
export declare function infraScanRoutes(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=infra-scan.d.ts.map