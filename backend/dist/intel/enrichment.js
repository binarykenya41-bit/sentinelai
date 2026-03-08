/**
 * CVE Enrichment Pipeline
 * Sources: NVD + EPSS + CISA KEV + MITRE ATT&CK + VulDB
 */
import { fetchCveById } from "./nvd.js";
import { fetchEpssScore } from "./epss.js";
import { getKevEntry } from "./kev.js";
import { mapCweToTechniques } from "./mitre.js";
import { fetchVulDbByCve } from "./vuldb.js";
function computePriority(cvss, epss, isKev, exploitAvail, vuldbRisk) {
    const cvssScore = (cvss ?? 0) * 4; // 0–40
    const epssScore = (epss ?? 0) * 30; // 0–30
    const kevBonus = isKev ? 20 : 0; // 0–20
    const exploitBonus = exploitAvail ? 7 : 0; // 0–7
    const vuldbBonus = (vuldbRisk / 100) * 3; // 0–3
    return Math.min(100, Math.round(cvssScore + epssScore + kevBonus + exploitBonus + vuldbBonus));
}
export async function enrichCve(cveId) {
    // Fetch all sources in parallel — VulDB is optional (50 credits/day limit)
    const [nvdResult, epssResult, kevResult, vuldbResult] = await Promise.allSettled([
        fetchCveById(cveId),
        fetchEpssScore(cveId),
        getKevEntry(cveId),
        fetchVulDbByCve(cveId),
    ]);
    const nvd = nvdResult.status === "fulfilled" ? nvdResult.value : null;
    const epss = epssResult.status === "fulfilled" ? epssResult.value : null;
    const kev = kevResult.status === "fulfilled" ? kevResult.value : null;
    const vuldb = vuldbResult.status === "fulfilled" ? vuldbResult.value : null;
    if (!nvd)
        return null;
    const techniques = await mapCweToTechniques(nvd.cwe_ids);
    const priority = computePriority(nvd.cvss_v3_score, epss?.epss ?? null, kev !== null, vuldb?.exploit_available ?? false, vuldb?.risk_score ?? 0);
    return {
        ...nvd,
        epss_score: epss?.epss ?? null,
        epss_percentile: epss?.percentile ?? null,
        kev: {
            is_kev: kev !== null,
            date_added: kev?.date_added,
            required_action: kev?.required_action,
            due_date: kev?.due_date,
            known_ransomware: kev?.known_ransomware_campaign_use,
            vendor_product: kev ? `${kev.vendor_project} ${kev.product}` : undefined,
        },
        mitre_techniques: techniques.map((t) => ({
            id: t.id,
            name: t.name,
            tactic_phases: t.tactic_phases,
            url: t.url,
            platforms: t.platforms,
            detection: t.detection,
        })),
        vuldb: {
            available: vuldb !== null,
            vuldb_id: vuldb?.vuldb_id,
            vendor: vuldb?.vendor,
            product: vuldb?.product,
            vuln_class: vuldb?.vuln_class,
            exploit_available: vuldb?.exploit_available ?? false,
            exploit_maturity: vuldb?.exploit_maturity ?? null,
            exploit_price: vuldb?.exploit_price ?? null,
            risk_score: vuldb?.risk_score ?? 0,
            threat_level: vuldb?.threat_level ?? "medium",
            patch_available: vuldb?.patch_available ?? false,
            countermeasure: vuldb?.countermeasure ?? null,
            cvss_v3: vuldb?.cvss_v3,
            cvss_v4: vuldb?.cvss_v4,
            attack_techniques: vuldb?.attack_techniques ?? [],
        },
        priority_score: priority,
        enriched_at: new Date().toISOString(),
    };
}
//# sourceMappingURL=enrichment.js.map