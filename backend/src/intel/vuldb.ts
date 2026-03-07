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
import axios from "axios"

const VULDB_URL = "https://vuldb.com/?api"
const VULDB_API_KEY = process.env.VULDB_API_KEY ?? ""

if (!VULDB_API_KEY) {
  console.warn("[VulDB] VULDB_API_KEY not set — VulDB features will be skipped")
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VulDbEntry {
  vuldb_id: number
  title: string
  cve_id: string | null
  // Timestamps
  created_at: string
  updated_at: string
  // Affected
  vendor: string
  product: string
  version: string
  // Vulnerability details
  vuln_class: string      // e.g. "SQL Injection", "Path Traversal"
  cwe_id: string | null
  // CVSS
  cvss_v2: number | null
  cvss_v3: number | null
  cvss_v4: number | null
  // Exploit
  exploit_available: boolean
  exploit_maturity: "unproven" | "poc" | "functional" | "weaponized" | null
  exploit_price: string | null
  // Risk
  risk_score: number      // VulDB composite 0–100
  threat_level: "low" | "medium" | "high" | "critical"
  // MITRE
  attack_techniques: string[]   // ATT&CK technique IDs
  // Remediation
  patch_available: boolean
  countermeasure: string | null
  // Source
  references: string[]
}

// ── Raw API response parser ───────────────────────────────────────────────────

function parseEntry(raw: Record<string, unknown>): VulDbEntry {
  const entry = (raw.entry ?? raw) as Record<string, unknown>
  const source = (entry.source ?? {}) as Record<string, unknown>
  const cvss = (entry.cvss ?? {}) as Record<string, Record<string, string | number>>
  const vuln = (entry.vulnerability ?? {}) as Record<string, unknown>
  const affected = (entry.affected ?? {}) as Record<string, unknown>
  const history = (entry.history ?? {}) as Record<string, unknown>
  const countermeasure = (entry.countermeasure ?? {}) as Record<string, unknown>
  const risk = (entry.risk ?? {}) as Record<string, unknown>
  const exploit = (entry.exploit ?? {}) as Record<string, unknown>

  // MITRE ATT&CK
  const attackRef = (entry["vulnerability"] as Record<string, unknown> | undefined)
  const techniques: string[] = []
  if ((attackRef?.["mitre-att&ck"] as string)) {
    techniques.push(...String(attackRef?.["mitre-att&ck"]).split(",").map((t) => t.trim()))
  }

  // CVE ID
  const cveSource = (source["cve"] ?? {}) as Record<string, string>
  const cveId = cveSource?.id ?? null

  // References
  const refs: string[] = []
  const rawRefs = (entry.references ?? []) as Record<string, string>[]
  if (Array.isArray(rawRefs)) {
    rawRefs.forEach((r) => { if (r.url) refs.push(r.url) })
  }

  // Exploit maturity
  const exploitMaturityRaw = (exploit.maturity as string | undefined)?.toLowerCase()
  const exploitMaturity = (
    ["unproven", "poc", "functional", "weaponized"].includes(exploitMaturityRaw ?? "")
      ? exploitMaturityRaw
      : null
  ) as VulDbEntry["exploit_maturity"]

  // Risk level
  const riskLevelRaw = ((risk.level as string) ?? "").toLowerCase()
  const threatLevel = (["low", "medium", "high", "critical"].includes(riskLevelRaw)
    ? riskLevelRaw
    : "medium") as VulDbEntry["threat_level"]

  return {
    vuldb_id: parseInt(String(entry.id ?? "0")),
    title: String(entry.title ?? ""),
    cve_id: cveId,
    created_at: String((history.create as Record<string, string>)?.date ?? ""),
    updated_at: String((history.change as Record<string, string>)?.date ?? ""),
    vendor: String((affected.vendor as Record<string, string>)?.name ?? ""),
    product: String((affected.product as Record<string, string>)?.name ?? ""),
    version: String((affected.range as Record<string, string>)?.version ?? ""),
    vuln_class: String((vuln as Record<string, string>)?.type ?? ""),
    cwe_id: String((vuln as Record<string, Record<string, string>>)?.cwe?.id ?? "") || null,
    cvss_v2: cvss.v2 ? parseFloat(String(cvss.v2.basescore ?? "0")) : null,
    cvss_v3: cvss.v3 ? parseFloat(String(cvss.v3.basescore ?? "0")) : null,
    cvss_v4: cvss.v4 ? parseFloat(String(cvss.v4.basescore ?? "0")) : null,
    exploit_available: (exploit.availability as string) !== "0" && !!exploit.availability,
    exploit_maturity: exploitMaturity,
    exploit_price: (exploit.price as string) ?? null,
    risk_score: parseInt(String(risk.score ?? "0")),
    threat_level: threatLevel,
    attack_techniques: techniques,
    patch_available: !!countermeasure.patch,
    countermeasure: (countermeasure.recommendation as string) ?? null,
    references: refs,
  }
}

// ── API call wrapper ──────────────────────────────────────────────────────────

async function vuldbPost(params: Record<string, string | number>): Promise<VulDbEntry[]> {
  if (!VULDB_API_KEY) return []

  const formData = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    formData.append(k, String(v))
  }

  const { data } = await axios.post(VULDB_URL, formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-VulDB-ApiKey": VULDB_API_KEY,
      "User-Agent": "SentinelAI/0.2",
    },
    timeout: 15_000,
  })

  const results = data?.result ?? data?.response?.result ?? []
  if (!Array.isArray(results)) return []
  return results.map(parseEntry)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Look up a CVE by ID on VulDB.
 * Returns detailed threat intelligence including exploit availability and ATT&CK mapping.
 */
export async function fetchVulDbByCve(cveId: string): Promise<VulDbEntry | null> {
  const results = await vuldbPost({ advancedsearch: 1, search: cveId, details: 1 })
  return results.find((r) => r.cve_id === cveId) ?? results[0] ?? null
}

/**
 * Fetch the most recently added/updated entries.
 * Useful for a live threat feed dashboard widget.
 */
export async function fetchVulDbRecent(limit = 10): Promise<VulDbEntry[]> {
  return vuldbPost({ recent: 1, details: 0 })
    .then((r) => r.slice(0, limit))
}

/**
 * Search VulDB by free-text keyword (vendor, product, CVE, technique).
 */
export async function searchVulDb(
  query: string,
  limit = 20
): Promise<VulDbEntry[]> {
  return vuldbPost({ advancedsearch: 1, search: query, details: 1 })
    .then((r) => r.slice(0, limit))
}

/**
 * Fetch CVEs with exploit code available — highest priority targets.
 */
export async function fetchExploitableVulns(limit = 20): Promise<VulDbEntry[]> {
  return vuldbPost({ advancedsearch: 1, exploitavailability: 1, details: 1 })
    .then((r) => r.slice(0, limit))
}

/**
 * Check exploit status for a batch of CVE IDs.
 * Conserves API credits by doing one request per CVE.
 * WARNING: each call uses 1 API credit.
 */
export async function batchExploitStatus(
  cveIds: string[]
): Promise<Record<string, { exploit_available: boolean; exploit_maturity: string | null; risk_score: number }>> {
  const result: Record<string, { exploit_available: boolean; exploit_maturity: string | null; risk_score: number }> = {}
  // Process sequentially to avoid rate limit
  for (const cveId of cveIds) {
    const entry = await fetchVulDbByCve(cveId)
    result[cveId] = {
      exploit_available: entry?.exploit_available ?? false,
      exploit_maturity: entry?.exploit_maturity ?? null,
      risk_score: entry?.risk_score ?? 0,
    }
  }
  return result
}
