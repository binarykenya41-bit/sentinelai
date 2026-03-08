/**
 * CISA Known Exploited Vulnerabilities (KEV) Catalog
 * Docs: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
 */
import axios from "axios";
const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
let kevCache = null;
let kevCacheTime = 0;
const KEV_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
async function loadKev() {
    if (kevCache && Date.now() - kevCacheTime < KEV_CACHE_TTL_MS)
        return kevCache;
    const { data } = await axios.get(KEV_URL, { timeout: 15_000 });
    const map = new Map();
    for (const v of data.vulnerabilities ?? []) {
        const entry = {
            cve_id: v.cveID,
            vendor_project: v.vendorProject,
            product: v.product,
            vulnerability_name: v.vulnerabilityName,
            date_added: v.dateAdded,
            short_description: v.shortDescription,
            required_action: v.requiredAction,
            due_date: v.dueDate,
            known_ransomware_campaign_use: v.knownRansomwareCampaignUse?.toLowerCase() === "known",
            notes: v.notes ?? "",
        };
        map.set(v.cveID, entry);
    }
    kevCache = map;
    kevCacheTime = Date.now();
    return map;
}
export async function isKev(cveId) {
    const kev = await loadKev();
    return kev.has(cveId);
}
export async function getKevEntry(cveId) {
    const kev = await loadKev();
    return kev.get(cveId) ?? null;
}
export async function getAllKev() {
    const kev = await loadKev();
    return Array.from(kev.values());
}
export async function getRecentKev(daysBack = 30) {
    const kev = await loadKev();
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    return Array.from(kev.values()).filter((e) => new Date(e.date_added).getTime() >= cutoff);
}
//# sourceMappingURL=kev.js.map