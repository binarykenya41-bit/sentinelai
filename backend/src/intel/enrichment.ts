/**
 * CVE Enrichment Pipeline
 * Sources: NVD + EPSS + CISA KEV + MITRE ATT&CK + VulDB
 */
import { fetchCveById } from "./nvd.js"
import { fetchEpssScore } from "./epss.js"
import { getKevEntry } from "./kev.js"
import { mapCweToTechniques } from "./mitre.js"
import { fetchVulDbByCve } from "./vuldb.js"

export interface EnrichedCve {
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
  // EPSS
  epss_score: number | null
  epss_percentile: number | null
  // KEV
  kev: {
    is_kev: boolean
    date_added?: string
    required_action?: string
    due_date?: string
    known_ransomware?: boolean
    vendor_product?: string
  }
  // MITRE ATT&CK
  mitre_techniques: {
    id: string
    name: string
    tactic_phases: string[]
    url: string
    platforms: string[]
    detection: string
  }[]
  // VulDB threat intelligence
  vuldb: {
    available: boolean
    vuldb_id?: number
    vendor?: string
    product?: string
    vuln_class?: string
    exploit_available: boolean
    exploit_maturity: string | null
    exploit_price: string | null
    risk_score: number
    threat_level: string
    patch_available: boolean
    countermeasure: string | null
    cvss_v3?: number | null
    cvss_v4?: number | null
    attack_techniques: string[]
  }
  // Composite priority score (0–100)
  priority_score: number
  enriched_at: string
}

function computePriority(
  cvss: number | null,
  epss: number | null,
  isKev: boolean,
  exploitAvail: boolean,
  vuldbRisk: number
): number {
  const cvssScore = (cvss ?? 0) * 4            // 0–40
  const epssScore = (epss ?? 0) * 30           // 0–30
  const kevBonus  = isKev ? 20 : 0             // 0–20
  const exploitBonus = exploitAvail ? 7 : 0    // 0–7
  const vuldbBonus = (vuldbRisk / 100) * 3     // 0–3
  return Math.min(100, Math.round(cvssScore + epssScore + kevBonus + exploitBonus + vuldbBonus))
}

export async function enrichCve(cveId: string): Promise<EnrichedCve | null> {
  // Fetch all sources in parallel — VulDB is optional (50 credits/day limit)
  const [nvdResult, epssResult, kevResult, vuldbResult] = await Promise.allSettled([
    fetchCveById(cveId),
    fetchEpssScore(cveId),
    getKevEntry(cveId),
    fetchVulDbByCve(cveId),
  ])

  const nvd    = nvdResult.status === "fulfilled" ? nvdResult.value : null
  const epss   = epssResult.status === "fulfilled" ? epssResult.value : null
  const kev    = kevResult.status === "fulfilled" ? kevResult.value : null
  const vuldb  = vuldbResult.status === "fulfilled" ? vuldbResult.value : null

  if (!nvd) return null

  const techniques = await mapCweToTechniques(nvd.cwe_ids)

  const priority = computePriority(
    nvd.cvss_v3_score,
    epss?.epss ?? null,
    kev !== null,
    vuldb?.exploit_available ?? false,
    vuldb?.risk_score ?? 0
  )

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
  }
}
