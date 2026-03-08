/**
 * FIRST EPSS (Exploit Prediction Scoring System) API
 * Docs: https://api.first.org/epss
 */
import axios from "axios";
const EPSS_BASE = "https://api.first.org/data/v1/epss";
export async function fetchEpssScore(cveId) {
    const { data } = await axios.get(EPSS_BASE, {
        params: { cve: cveId },
        timeout: 10_000,
    });
    const entry = data?.data?.[0];
    if (!entry)
        return null;
    return {
        cve: entry.cve,
        epss: parseFloat(entry.epss),
        percentile: parseFloat(entry.percentile),
        date: entry.date,
    };
}
export async function fetchEpssScores(cveIds) {
    const { data } = await axios.get(EPSS_BASE, {
        params: { cve: cveIds.join(",") },
        timeout: 15_000,
    });
    return (data?.data ?? []).map((entry) => ({
        cve: entry.cve,
        epss: parseFloat(entry.epss),
        percentile: parseFloat(entry.percentile),
        date: entry.date,
    }));
}
export async function fetchTopEpss(limit = 100, minEpss = 0.5) {
    const { data } = await axios.get(EPSS_BASE, {
        params: { "epss-gt": minEpss, order: "!epss", limit },
        timeout: 20_000,
    });
    return (data?.data ?? []).map((entry) => ({
        cve: entry.cve,
        epss: parseFloat(entry.epss),
        percentile: parseFloat(entry.percentile),
        date: entry.date,
    }));
}
//# sourceMappingURL=epss.js.map