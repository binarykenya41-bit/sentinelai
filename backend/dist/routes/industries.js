import { bootstrapIndustry } from "../industries/bootstrap.js";
const INDUSTRIES = ["logistics", "fintech", "ecommerce", "healthcare"];
const INDUSTRY_INFO = {
    logistics: {
        name: "GlobalShip Logistics",
        description: "Fleet management, ERP, supply chain security simulation",
        icon: "🚢",
        services: ["ERPNext", "GitLab", "Grafana", "Kafka", "PostgreSQL", "Redis", "Prometheus"],
        composeFile: "containers/industries/logistics/docker-compose.yml",
    },
    fintech: {
        name: "NexaPay Financial",
        description: "Core banking, payment processing, fraud detection",
        icon: "💳",
        services: ["Fineract Banking", "Payment API", "Fraud Detection", "PostgreSQL", "Vault", "Redis"],
        composeFile: "containers/industries/fintech/docker-compose.yml",
    },
    ecommerce: {
        name: "ShopVault Commerce",
        description: "E-commerce platform, inventory, payment gateway",
        icon: "🛒",
        services: ["Storefront", "Product API", "Elasticsearch", "PostgreSQL", "Redis", "MinIO"],
        composeFile: "containers/industries/ecommerce/docker-compose.yml",
    },
    healthcare: {
        name: "MediCore Health Systems",
        description: "EHR, FHIR API, patient portal, DICOM imaging",
        icon: "🏥",
        services: ["OpenEMR", "FHIR API", "Patient Portal", "DICOM Viewer", "PostgreSQL", "Keycloak"],
        composeFile: "containers/industries/healthcare/docker-compose.yml",
    },
};
export async function industriesRoutes(app) {
    // GET /api/industries — list all available industry environments
    app.get("/api/industries", async (_req, reply) => {
        return reply.send({
            industries: INDUSTRIES.map((id) => ({ id, ...INDUSTRY_INFO[id] })),
        });
    });
    // POST /api/industries/bootstrap — wipe DB, seed industry data, start containers
    app.post("/api/industries/bootstrap", async (req, reply) => {
        const { industry } = req.body ?? {};
        if (!industry || !INDUSTRIES.includes(industry)) {
            return reply.status(400).send({
                error: `Invalid industry. Must be one of: ${INDUSTRIES.join(", ")}`,
            });
        }
        try {
            const result = await bootstrapIndustry(industry);
            return reply.send(result);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Bootstrap failed";
            app.log.error(err);
            return reply.status(500).send({ error: msg });
        }
    });
    // GET /api/industries/current — return metadata for a given industry
    app.get("/api/industries/current", async (req, reply) => {
        const { industry } = req.query;
        if (!industry || !INDUSTRIES.includes(industry)) {
            return reply.send({ industry: null });
        }
        return reply.send({ industry, ...INDUSTRY_INFO[industry] });
    });
}
//# sourceMappingURL=industries.js.map