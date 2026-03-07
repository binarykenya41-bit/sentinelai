/**
 * FIRST EPSS (Exploit Prediction Scoring System) API
 * Docs: https://api.first.org/epss
 */
import axios from "axios"

const EPSS_BASE = "https://api.first.org/data/v1/epss"

export interface EpssScore {
  cve: string
  epss: number       // 0.0 – 1.0 probability of exploitation in next 30 days
  percentile: number // 0.0 – 1.0
  date: string
}

export async function fetchEpssScore(cveId: string): Promise<EpssScore | null> {
  const { data } = await axios.get(EPSS_BASE, {
    params: { cve: cveId },
    timeout: 10_000,
  })
  const entry = data?.data?.[0]
  if (!entry) return null
  return {
    cve: entry.cve,
    epss: parseFloat(entry.epss),
    percentile: parseFloat(entry.percentile),
    date: entry.date,
  }
}

export async function fetchEpssScores(cveIds: string[]): Promise<EpssScore[]> {
  const { data } = await axios.get(EPSS_BASE, {
    params: { cve: cveIds.join(",") },
    timeout: 15_000,
  })
  return (data?.data ?? []).map((entry: Record<string, string>) => ({
    cve: entry.cve,
    epss: parseFloat(entry.epss),
    percentile: parseFloat(entry.percentile),
    date: entry.date,
  }))
}

export async function fetchTopEpss(limit = 100, minEpss = 0.5): Promise<EpssScore[]> {
  const { data } = await axios.get(EPSS_BASE, {
    params: { "epss-gt": minEpss, order: "!epss", limit },
    timeout: 20_000,
  })
  return (data?.data ?? []).map((entry: Record<string, string>) => ({
    cve: entry.cve,
    epss: parseFloat(entry.epss),
    percentile: parseFloat(entry.percentile),
    date: entry.date,
  }))
}
