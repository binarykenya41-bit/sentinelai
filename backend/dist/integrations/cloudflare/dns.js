import { cfFetch } from "./client.js";
// List all DNS records for a zone
export async function getDnsRecords(zoneId) {
    return cfFetch(`/zones/${zoneId}/dns_records?per_page=100`);
}
// Summarize DNS exposure: count by type, flag unproxied records
export function analyzeDnsExposure(records) {
    const byType = {};
    const unproxied = [];
    for (const r of records) {
        byType[r.type] = (byType[r.type] ?? 0) + 1;
        if (!r.proxied && (r.type === "A" || r.type === "AAAA" || r.type === "CNAME")) {
            unproxied.push(r);
        }
    }
    return {
        total: records.length,
        by_type: byType,
        unproxied_count: unproxied.length,
        unproxied_records: unproxied.map((r) => ({ name: r.name, type: r.type, content: r.content })),
        risk: unproxied.length > 0 ? "medium" : "low",
    };
}
//# sourceMappingURL=dns.js.map