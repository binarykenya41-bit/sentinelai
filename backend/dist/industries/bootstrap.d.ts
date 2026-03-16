export type Industry = "logistics" | "fintech" | "ecommerce" | "healthcare";
export declare function bootstrapIndustry(industry: Industry): Promise<{
    status: "ok";
    org_id: string;
    services: string[];
    containers: string;
}>;
//# sourceMappingURL=bootstrap.d.ts.map