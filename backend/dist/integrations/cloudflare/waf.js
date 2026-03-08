import { cfFetch } from "./client.js";
// List custom Firewall Rules (WAF custom rules)
export async function getFirewallRules(zoneId) {
    const raw = await cfFetch(`/zones/${zoneId}/firewall/rules?per_page=100`);
    return raw.map((r) => ({
        id: r.id,
        description: r.description,
        action: r.action,
        enabled: r.enabled,
        priority: r.priority ?? null,
        expression: r.filter.expression,
        created_on: r.created_on,
        modified_on: r.modified_on,
    }));
}
// List WAF managed ruleset packages
export async function getWafPackages(zoneId) {
    return cfFetch(`/zones/${zoneId}/firewall/waf/packages?per_page=50`);
}
// Summarize WAF posture
export function summarizeWaf(rules) {
    const enabled = rules.filter((r) => r.enabled);
    const blocking = enabled.filter((r) => r.action === "block");
    const challenging = enabled.filter((r) => r.action === "challenge" || r.action === "js_challenge");
    return {
        total_rules: rules.length,
        enabled_rules: enabled.length,
        blocking_rules: blocking.length,
        challenging_rules: challenging.length,
        disabled_rules: rules.length - enabled.length,
        posture: blocking.length >= 3 ? "strong" : blocking.length >= 1 ? "partial" : "weak",
    };
}
//# sourceMappingURL=waf.js.map