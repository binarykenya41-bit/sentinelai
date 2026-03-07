/**
 * NVD API v2 — National Vulnerability Database
 * Docs: https://nvd.nist.gov/developers/vulnerabilities
 */
import axios from "axios"

const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0"
const NVD_API_KEY = process.env.NVD_API_KEY // optional — rate limit raised with key

function nvdHeaders() {
  return NVD_API_KEY ? { apiKey: NVD_API_KEY } : {}
}

export interface NvdCve {
  cve_id: string
  description: string
  cvss_v3_score: number | null
  cvss_v3_vector: string | null
  cvss_v2_score: number | null
  cwe_ids: string[]
  references: string[]
  published: string
  last_modified: string
  vuln_status: string
}

export async function fetchCveById(cveId: string): Promise<NvdCve | null> {
  const { data } = await axios.get(NVD_BASE, {
    params: { cveId },
    headers: nvdHeaders(),
    timeout: 15_000,
  })

  const vulns = data?.vulnerabilities
  if (!vulns?.length) return null

  return parseNvdItem(vulns[0])
}

export async function searchCves(params: {
  keyword?: string
  cweId?: string
  cvssV3SeverityMin?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  pubStartDate?: string // ISO 8601
  pubEndDate?: string
  resultsPerPage?: number
  startIndex?: number
}): Promise<{ total: number; cves: NvdCve[] }> {
  const nvdParams: Record<string, string | number> = {}
  if (params.keyword) nvdParams.keywordSearch = params.keyword
  if (params.cweId) nvdParams.cweId = params.cweId
  if (params.cvssV3SeverityMin) nvdParams.cvssV3Severity = params.cvssV3SeverityMin
  if (params.pubStartDate) nvdParams.pubStartDate = params.pubStartDate
  if (params.pubEndDate) nvdParams.pubEndDate = params.pubEndDate
  nvdParams.resultsPerPage = params.resultsPerPage ?? 20
  nvdParams.startIndex = params.startIndex ?? 0

  const { data } = await axios.get(NVD_BASE, {
    params: nvdParams,
    headers: nvdHeaders(),
    timeout: 20_000,
  })

  return {
    total: data.totalResults ?? 0,
    cves: (data.vulnerabilities ?? []).map(parseNvdItem),
  }
}

function parseNvdItem(item: Record<string, unknown>): NvdCve {
  const cve = item.cve as Record<string, unknown>
  const cveId = cve.id as string

  // Description
  const descs = (cve.descriptions as { lang: string; value: string }[]) ?? []
  const description = descs.find((d) => d.lang === "en")?.value ?? ""

  // CVSS
  const metrics = cve.metrics as Record<string, unknown> ?? {}
  const cvssV3Data = (
    (metrics.cvssMetricV31 as Record<string, unknown>[])?.[0] ??
    (metrics.cvssMetricV30 as Record<string, unknown>[])?.[0]
  )
  const cvssV2Data = (metrics.cvssMetricV2 as Record<string, unknown>[])?.[0]

  const cvss_v3_score =
    (cvssV3Data?.cvssData as Record<string, number> | undefined)?.baseScore ?? null
  const cvss_v3_vector =
    (cvssV3Data?.cvssData as Record<string, string> | undefined)?.vectorString ?? null
  const cvss_v2_score =
    (cvssV2Data?.cvssData as Record<string, number> | undefined)?.baseScore ?? null

  // CWEs
  const weaknesses = cve.weaknesses as { description: { lang: string; value: string }[] }[] ?? []
  const cwe_ids = weaknesses.flatMap((w) =>
    w.description.filter((d) => d.lang === "en").map((d) => d.value)
  )

  // References
  const refs = cve.references as { url: string }[] ?? []
  const references = refs.map((r) => r.url)

  return {
    cve_id: cveId,
    description,
    cvss_v3_score,
    cvss_v3_vector,
    cvss_v2_score,
    cwe_ids,
    references,
    published: cve.published as string,
    last_modified: cve.lastModified as string,
    vuln_status: cve.vulnStatus as string ?? "Unknown",
  }
}
