/**
 * VulDB Threat Intelligence Integration
 * API docs: https://vuldb.com/?doc.api
 *
 * Authentication: X-VulDB-ApiKey header
 * Endpoint:       POST https://vuldb.com/?api
 * Free tier:      50 API credits/day
 *
 * Provides:
 *  - CVE details with vendor/product context
 *  - Exploit availability + maturity
 *  - CVSS v2/v3/v4 scores
 *  - MITRE ATT&CK technique mappings
 *  - Risk scoring and threat timeline
 *  - Countermeasure / patch availability
 */
import axios from "axios";
const VULDB_URL = "https://vuldb.com/?api";
const VULDB_API_KEY = process.env.VULDB_API_KEY ?? "";
if (!VULDB_API_KEY) {
    console.warn("[VulDB] VULDB_API_KEY not set — VulDB features will be skipped");
}
// ── Raw API response parser ───────────────────────────────────────────────────
function parseEntry(raw) {
    const entry = (raw.entry ?? raw);
    const source = (entry.source ?? {});
    const cvss = (entry.cvss ?? {});
    const vuln = (entry.vulnerability ?? {});
    const affected = (entry.affected ?? {});
    const history = (entry.history ?? {});
    const countermeasure = (entry.countermeasure ?? {});
    const risk = (entry.risk ?? {});
    const exploit = (entry.exploit ?? {});
    // MITRE ATT&CK
    const attackRef = entry["vulnerability"];
    const techniques = [];
    if (attackRef?.["mitre-att&ck"]) {
        techniques.push(...String(attackRef?.["mitre-att&ck"]).split(",").map((t) => t.trim()));
    }
    // CVE ID
    const cveSource = (source["cve"] ?? {});
    const cveId = cveSource?.id ?? null;
    // References
    const refs = [];
    const rawRefs = (entry.references ?? []);
    if (Array.isArray(rawRefs)) {
        rawRefs.forEach((r) => { if (r.url)
            refs.push(r.url); });
    }
    // Exploit maturity
    const exploitMaturityRaw = exploit.maturity?.toLowerCase();
    const exploitMaturity = (["unproven", "poc", "functional", "weaponized"].includes(exploitMaturityRaw ?? "")
        ? exploitMaturityRaw
        : null);
    // Risk level
    const riskLevelRaw = (risk.level ?? "").toLowerCase();
    const threatLevel = (["low", "medium", "high", "critical"].includes(riskLevelRaw)
        ? riskLevelRaw
        : "medium");
    return {
        vuldb_id: parseInt(String(entry.id ?? "0")),
        title: String(entry.title ?? ""),
        cve_id: cveId,
        created_at: String(history.create?.date ?? ""),
        updated_at: String(history.change?.date ?? ""),
        vendor: String(affected.vendor?.name ?? ""),
        product: String(affected.product?.name ?? ""),
        version: String(affected.range?.version ?? ""),
        vuln_class: String(vuln?.type ?? ""),
        cwe_id: String(vuln?.cwe?.id ?? "") || null,
        cvss_v2: cvss.v2 ? parseFloat(String(cvss.v2.basescore ?? "0")) : null,
        cvss_v3: cvss.v3 ? parseFloat(String(cvss.v3.basescore ?? "0")) : null,
        cvss_v4: cvss.v4 ? parseFloat(String(cvss.v4.basescore ?? "0")) : null,
        exploit_available: exploit.availability !== "0" && !!exploit.availability,
        exploit_maturity: exploitMaturity,
        exploit_price: exploit.price ?? null,
        risk_score: parseInt(String(risk.score ?? "0")),
        threat_level: threatLevel,
        attack_techniques: techniques,
        patch_available: !!countermeasure.patch,
        countermeasure: countermeasure.recommendation ?? null,
        references: refs,
    };
}
// ── API call wrapper ──────────────────────────────────────────────────────────
async function vuldbPost(params) {
    if (!VULDB_API_KEY)
        return [];
    const formData = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        formData.append(k, String(v));
    }
    const { data } = await axios.post(VULDB_URL, formData.toString(), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-VulDB-ApiKey": VULDB_API_KEY,
            "User-Agent": "SentinelAI/0.2",
        },
        timeout: 15_000,
    });
    const results = data?.result ?? data?.response?.result ?? [];
    if (!Array.isArray(results))
        return [];
    return results.map(parseEntry);
}
// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Look up a CVE by ID on VulDB.
 * Returns detailed threat intelligence including exploit availability and ATT&CK mapping.
 */
export async function fetchVulDbByCve(cveId) {
    const results = await vuldbPost({ advancedsearch: 1, search: cveId, details: 1 });
    return results.find((r) => r.cve_id === cveId) ?? results[0] ?? null;
}
/**
 * Fetch the most recently added/updated entries.
 * Useful for a live threat feed dashboard widget.
 */
export async function fetchVulDbRecent(limit = 10) {
    return vuldbPost({ recent: 1, details: 0 })
        .then((r) => r.slice(0, limit));
}
/**
 * Search VulDB by free-text keyword (vendor, product, CVE, technique).
 */
export async function searchVulDb(query, limit = 20) {
    return vuldbPost({ advancedsearch: 1, search: query, details: 1 })
        .then((r) => r.slice(0, limit));
}
/**
 * Fetch CVEs with exploit code available — highest priority targets.
 */
export async function fetchExploitableVulns(limit = 20) {
    return vuldbPost({ advancedsearch: 1, exploitavailability: 1, details: 1 })
        .then((r) => r.slice(0, limit));
}
/**
 * Check exploit status for a batch of CVE IDs.
 * Conserves API credits by doing one request per CVE.
 * WARNING: each call uses 1 API credit.
 */
export async function batchExploitStatus(cveIds) {
    const result = {};
    // Process sequentially to avoid rate limit
    for (const cveId of cveIds) {
        const entry = await fetchVulDbByCve(cveId);
        result[cveId] = {
            exploit_available: entry?.exploit_available ?? false,
            exploit_maturity: entry?.exploit_maturity ?? null,
            risk_score: entry?.risk_score ?? 0,
        };
    }
    return result;
}
//# sourceMappingURL=vuldb.js.map