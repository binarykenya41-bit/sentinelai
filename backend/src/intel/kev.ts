/**
 * CISA Known Exploited Vulnerabilities (KEV) Catalog
 * Docs: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
 */
import axios from "axios"

const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

export interface KevEntry {
  cve_id: string
  vendor_project: string
  product: string
  vulnerability_name: string
  date_added: string
  short_description: string
  required_action: string
  due_date: string
  known_ransomware_campaign_use: boolean
  notes: string
}

let kevCache: Map<string, KevEntry> | null = null
let kevCacheTime = 0
const KEV_CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

async function loadKev(): Promise<Map<string, KevEntry>> {
  if (kevCache && Date.now() - kevCacheTime < KEV_CACHE_TTL_MS) return kevCache

  const { data } = await axios.get(KEV_URL, { timeout: 15_000 })
  const map = new Map<string, KevEntry>()

  for (const v of data.vulnerabilities ?? []) {
    const entry: KevEntry = {
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
    }
    map.set(v.cveID, entry)
  }

  kevCache = map
  kevCacheTime = Date.now()
  return map
}

export async function isKev(cveId: string): Promise<boolean> {
  const kev = await loadKev()
  return kev.has(cveId)
}

export async function getKevEntry(cveId: string): Promise<KevEntry | null> {
  const kev = await loadKev()
  return kev.get(cveId) ?? null
}

export async function getAllKev(): Promise<KevEntry[]> {
  const kev = await loadKev()
  return Array.from(kev.values())
}

export async function getRecentKev(daysBack = 30): Promise<KevEntry[]> {
  const kev = await loadKev()
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000
  return Array.from(kev.values()).filter(
    (e) => new Date(e.date_added).getTime() >= cutoff
  )
}
