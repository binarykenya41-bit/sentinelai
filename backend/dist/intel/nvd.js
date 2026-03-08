/**
 * NVD API v2 — National Vulnerability Database
 * Docs: https://nvd.nist.gov/developers/vulnerabilities
 */
import axios from "axios";
const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const NVD_API_KEY = process.env.NVD_API_KEY; // optional — rate limit raised with key
function nvdHeaders() {
    return NVD_API_KEY ? { apiKey: NVD_API_KEY } : {};
}
export async function fetchCveById(cveId) {
    const { data } = await axios.get(NVD_BASE, {
        params: { cveId },
        headers: nvdHeaders(),
        timeout: 15_000,
    });
    const vulns = data?.vulnerabilities;
    if (!vulns?.length)
        return null;
    return parseNvdItem(vulns[0]);
}
export async function searchCves(params) {
    const nvdParams = {};
    if (params.keyword)
        nvdParams.keywordSearch = params.keyword;
    if (params.cweId)
        nvdParams.cweId = params.cweId;
    if (params.cvssV3SeverityMin)
        nvdParams.cvssV3Severity = params.cvssV3SeverityMin;
    if (params.pubStartDate) {
        nvdParams.pubStartDate = params.pubStartDate;
        // NVD requires pubEndDate when pubStartDate is set; default to now (capped at 2025-12-31)
        nvdParams.pubEndDate = params.pubEndDate
            ?? new Date(Math.min(Date.now(), new Date("2025-12-31T23:59:59.000Z").getTime()))
                .toISOString().replace("Z", "+00:00");
    }
    nvdParams.resultsPerPage = params.resultsPerPage ?? 20;
    nvdParams.startIndex = params.startIndex ?? 0;
    const { data } = await axios.get(NVD_BASE, {
        params: nvdParams,
        headers: nvdHeaders(),
        timeout: 20_000,
    });
    return {
        total: data.totalResults ?? 0,
        cves: (data.vulnerabilities ?? []).map(parseNvdItem),
    };
}
function parseNvdItem(item) {
    const cve = item.cve;
    const cveId = cve.id;
    // Description
    const descs = cve.descriptions ?? [];
    const description = descs.find((d) => d.lang === "en")?.value ?? "";
    // CVSS
    const metrics = cve.metrics ?? {};
    const cvssV3Data = (metrics.cvssMetricV31?.[0] ??
        metrics.cvssMetricV30?.[0]);
    const cvssV2Data = metrics.cvssMetricV2?.[0];
    const cvss_v3_score = cvssV3Data?.cvssData?.baseScore ?? null;
    const cvss_v3_vector = cvssV3Data?.cvssData?.vectorString ?? null;
    const cvss_v2_score = cvssV2Data?.cvssData?.baseScore ?? null;
    // CWEs
    const weaknesses = cve.weaknesses ?? [];
    const cwe_ids = weaknesses.flatMap((w) => w.description.filter((d) => d.lang === "en").map((d) => d.value));
    // References
    const refs = cve.references ?? [];
    const references = refs.map((r) => r.url);
    return {
        cve_id: cveId,
        description,
        cvss_v3_score,
        cvss_v3_vector,
        cvss_v2_score,
        cwe_ids,
        references,
        published: cve.published,
        last_modified: cve.lastModified,
        vuln_status: cve.vulnStatus ?? "Unknown",
    };
}
//# sourceMappingURL=nvd.js.map