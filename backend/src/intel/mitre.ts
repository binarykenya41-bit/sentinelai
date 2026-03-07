/**
 * MITRE ATT&CK Integration
 *
 * Data source hierarchy (tries in order):
 *  1. MITRE CTI GitHub — raw STIX 2.0 JSON bundle (fastest, no auth)
 *     https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json
 *
 *  2. TAXII 2.0 REST API — cti-taxii.mitre.org (official server)
 *     Server:     https://cti-taxii.mitre.org/taxii/
 *     Collection: 95ecc380-afe9-11e4-9b6c-751b66dd541e
 *
 * STIX object types used:
 *   attack-pattern  → Techniques / Sub-techniques
 *   x-mitre-tactic  → Tactics
 *   course-of-action → Mitigations
 *   relationship    → Technique ↔ Mitigation links
 *
 * Equivalent Python approach (for reference):
 *   from taxii2client.v20 import Server
 *   server = Server("https://cti-taxii.mitre.org/taxii/")
 *   collection = server.collections["95ecc380-afe9-11e4-9b6c-751b66dd541e"]
 *   bundle = collection.get_objects()
 */
import axios from "axios"

// ── Source URLs ───────────────────────────────────────────────────────────────
const MITRE_GITHUB_STIX =
  "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"

const TAXII_BASE = "https://cti-taxii.mitre.org"
const TAXII_COLLECTION = "95ecc380-afe9-11e4-9b6c-751b66dd541e" // Enterprise ATT&CK

// ── Cache ─────────────────────────────────────────────────────────────────────
let techniqueCache: Map<string, MitreTechnique> | null = null
let tacticCache: Map<string, MitreTactic> | null = null
let stixRelationships: StixRelationship[] = []
let cacheTime = 0
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MitreTechnique {
  id: string                // e.g. "T1059"
  stix_id: string           // "attack-pattern--..."
  name: string
  description: string
  tactic_phases: string[]   // kill-chain phase names, e.g. ["execution"]
  platforms: string[]       // Windows, Linux, macOS, Cloud, etc.
  detection: string
  data_sources: string[]
  url: string               // https://attack.mitre.org/techniques/T1059/
  is_subtechnique: boolean
  parent_id?: string        // "T1059" if this is T1059.001
  mitigations: string[]     // course-of-action names
  permissions_required: string[]
  defense_bypassed: string[]
}

export interface MitreTactic {
  id: string                // e.g. "TA0002"
  stix_id: string
  name: string              // e.g. "Execution"
  short_name: string        // e.g. "execution"
  description: string
  url: string
}

interface StixRelationship {
  source_ref: string        // STIX ID of technique
  target_ref: string        // STIX ID of mitigation
  relationship_type: string
}

// ── CWE → ATT&CK technique mapping (curated) ─────────────────────────────────
const CWE_TO_TECHNIQUES: Record<string, string[]> = {
  "CWE-78":  ["T1059", "T1059.004"],
  "CWE-79":  ["T1059.007"],
  "CWE-89":  ["T1190"],
  "CWE-22":  ["T1083", "T1005"],
  "CWE-94":  ["T1059", "T1203"],
  "CWE-287": ["T1078", "T1110"],
  "CWE-306": ["T1078.001"],
  "CWE-502": ["T1059", "T1203"],
  "CWE-611": ["T1190", "T1083"],
  "CWE-918": ["T1090", "T1090.001"],
  "CWE-295": ["T1557", "T1040"],
  "CWE-416": ["T1203", "T1068"],
  "CWE-787": ["T1203", "T1068"],
  "CWE-190": ["T1203"],
  "CWE-798": ["T1552.001"],
  "CWE-276": ["T1083", "T1005"],
  "CWE-434": ["T1105", "T1190"],
  "CWE-352": ["T1185", "T1539"],
  "CWE-601": ["T1566.002"],
  "CWE-770": ["T1499"],
  "CWE-400": ["T1499.001"],
  "CWE-20":  ["T1190"],
  "CWE-200": ["T1005", "T1083"],
  "CWE-312": ["T1552"],
  "CWE-321": ["T1552.001"],
  "CWE-330": ["T1110"],
  "CWE-338": ["T1110"],
  "CWE-427": ["T1574.008"],
  "CWE-862": ["T1078"],
  "CWE-863": ["T1548"],
}

// ── STIX object parsers ───────────────────────────────────────────────────────

function parseAttackPattern(obj: Record<string, unknown>): MitreTechnique | null {
  const extRefs = (obj["external_references"] as Record<string, string>[]) ?? []
  const attackRef = extRefs.find((r) => r.source_name === "mitre-attack")
  if (!attackRef?.external_id) return null

  const techId = attackRef.external_id
  const phases = ((obj["kill_chain_phases"] as { phase_name: string }[]) ?? []).map(
    (p) => p.phase_name
  )

  return {
    id: techId,
    stix_id: obj.id as string,
    name: obj.name as string,
    description: (obj.description as string) ?? "",
    tactic_phases: phases,
    platforms: (obj["x-mitre-platforms"] as string[]) ?? [],
    detection: (obj["x-mitre-detection"] as string) ?? "",
    data_sources: (obj["x-mitre-data-sources"] as string[]) ?? [],
    url: attackRef.url ?? `https://attack.mitre.org/techniques/${techId.replace(".", "/")}/`,
    is_subtechnique: (obj["x-mitre-is-subtechnique"] as boolean) ?? false,
    parent_id: techId.includes(".") ? techId.split(".")[0] : undefined,
    mitigations: [],
    permissions_required: (obj["x-mitre-permissions-required"] as string[]) ?? [],
    defense_bypassed: (obj["x-mitre-defense-bypassed"] as string[]) ?? [],
  }
}

function parseTactic(obj: Record<string, unknown>): MitreTactic | null {
  const extRefs = (obj["external_references"] as Record<string, string>[]) ?? []
  const attackRef = extRefs.find((r) => r.source_name === "mitre-attack")
  if (!attackRef?.external_id) return null

  const name = obj.name as string
  const shortName = (obj["x-mitre-shortname"] as string)
    || name.toLowerCase().replace(/ /g, "-")

  return {
    id: attackRef.external_id,
    stix_id: obj.id as string,
    name,
    short_name: shortName,
    description: (obj.description as string) ?? "",
    url: attackRef.url ?? `https://attack.mitre.org/tactics/${attackRef.external_id}/`,
  }
}

// ── Bundle loader ─────────────────────────────────────────────────────────────

async function fetchBundleFromGitHub(): Promise<Record<string, unknown>[]> {
  const { data } = await axios.get(MITRE_GITHUB_STIX, {
    timeout: 60_000,
    headers: { Accept: "application/json" },
  })
  return (data.objects ?? []) as Record<string, unknown>[]
}

async function fetchBundleFromTaxii(): Promise<Record<string, unknown>[]> {
  // TAXII 2.0 — query the collection objects endpoint
  const url = `${TAXII_BASE}/stix/collections/${TAXII_COLLECTION}/objects/`
  const { data } = await axios.get(url, {
    timeout: 60_000,
    headers: {
      Accept: "application/vnd.oasis.stix+json; version=2.0",
      "Content-Type": "application/vnd.oasis.stix+json; version=2.0",
    },
  })
  return (data.objects ?? []) as Record<string, unknown>[]
}

async function loadBundle(): Promise<{
  techniques: Map<string, MitreTechnique>
  tactics: Map<string, MitreTactic>
  relationships: StixRelationship[]
}> {
  if (techniqueCache && Date.now() - cacheTime < CACHE_TTL_MS) {
    return { techniques: techniqueCache, tactics: tacticCache!, relationships: stixRelationships }
  }

  // Try GitHub first (larger payload but no auth; always up-to-date)
  let objects: Record<string, unknown>[] = []
  try {
    console.log("[MITRE] Loading ATT&CK STIX bundle from GitHub...")
    objects = await fetchBundleFromGitHub()
    console.log(`[MITRE] Loaded ${objects.length} STIX objects from GitHub`)
  } catch (err) {
    console.warn("[MITRE] GitHub fetch failed, falling back to TAXII 2.0...", err)
    objects = await fetchBundleFromTaxii()
    console.log(`[MITRE] Loaded ${objects.length} STIX objects from TAXII`)
  }

  const techniques = new Map<string, MitreTechnique>()
  const tactics = new Map<string, MitreTactic>()
  const relationships: StixRelationship[] = []
  const mitigationNames = new Map<string, string>() // stix_id → name

  for (const obj of objects) {
    const deprecated = (obj["x-mitre-deprecated"] as boolean) ?? false
    const revoked = (obj["revoked"] as boolean) ?? false
    if (deprecated || revoked) continue

    switch (obj.type) {
      case "attack-pattern": {
        const t = parseAttackPattern(obj)
        if (t) techniques.set(t.id, t)
        break
      }
      case "x-mitre-tactic": {
        const tactic = parseTactic(obj)
        if (tactic) tactics.set(tactic.id, tactic)  // key by TA-id to avoid empty short_name collisions
        break
      }
      case "course-of-action":
        mitigationNames.set(obj.id as string, obj.name as string)
        break
      case "relationship":
        relationships.push({
          source_ref: obj.source_ref as string,
          target_ref: obj.target_ref as string,
          relationship_type: obj.relationship_type as string,
        })
        break
    }
  }

  // Wire mitigations onto techniques
  for (const rel of relationships) {
    if (rel.relationship_type === "mitigates") {
      // target_ref is the technique stix_id
      const mitName = mitigationNames.get(rel.source_ref)
      if (!mitName) continue
      for (const tech of techniques.values()) {
        if (tech.stix_id === rel.target_ref) {
          tech.mitigations.push(mitName)
        }
      }
    }
  }

  techniqueCache = techniques
  tacticCache = tactics
  stixRelationships = relationships
  cacheTime = Date.now()
  return { techniques, tactics, relationships }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getTechnique(techniqueId: string): Promise<MitreTechnique | null> {
  const { techniques } = await loadBundle()
  return techniques.get(techniqueId.toUpperCase()) ?? null
}

export async function getTactics(): Promise<MitreTactic[]> {
  const { tactics } = await loadBundle()
  return Array.from(tactics.values())
}

export async function getTechniquesByTactic(tactic: string): Promise<MitreTechnique[]> {
  const { techniques } = await loadBundle()
  const normalized = tactic.toLowerCase().replace(/ /g, "-")
  return Array.from(techniques.values()).filter((t) =>
    t.tactic_phases.some((p) => p.toLowerCase().replace(/ /g, "-") === normalized)
  )
}

export async function mapCweToTechniques(cweIds: string[]): Promise<MitreTechnique[]> {
  const { techniques } = await loadBundle()
  const ids = new Set<string>()
  for (const cwe of cweIds) {
    const normalized = cwe.startsWith("CWE-") ? cwe : `CWE-${cwe}`
    ;(CWE_TO_TECHNIQUES[normalized] ?? []).forEach((id) => ids.add(id))
  }
  return Array.from(ids)
    .map((id) => techniques.get(id))
    .filter((t): t is MitreTechnique => t !== undefined)
}

export async function searchTechniques(query: string): Promise<MitreTechnique[]> {
  const { techniques } = await loadBundle()
  const q = query.toLowerCase()
  return Array.from(techniques.values()).filter(
    (t) =>
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
  )
}

export async function listAllTechniques(): Promise<MitreTechnique[]> {
  const { techniques } = await loadBundle()
  return Array.from(techniques.values())
}

export async function getAttackChain(techniqueIds: string[]): Promise<{
  nodes: MitreTechnique[]
  edges: { source: string; target: string; type: string }[]
  tactic_flow: string[]
}> {
  const { techniques, tactics } = await loadBundle()

  const nodes: MitreTechnique[] = []
  for (const id of techniqueIds) {
    const t = techniques.get(id)
    if (t) nodes.push(t)
  }

  // Build tactic-ordered flow
  const tacticOrder = [
    "reconnaissance", "resource-development", "initial-access",
    "execution", "persistence", "privilege-escalation",
    "defense-evasion", "credential-access", "discovery",
    "lateral-movement", "collection", "command-and-control",
    "exfiltration", "impact",
  ]

  const usedTactics = new Set(nodes.flatMap((n) => n.tactic_phases))
  const tactic_flow = tacticOrder.filter((t) => usedTactics.has(t))

  // Edges: connect techniques that share adjacent tactics
  const edges: { source: string; target: string; type: string }[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: "follows",
    })
    // Also add parent→sub-technique edges
    if (nodes[i + 1].parent_id === nodes[i].id) {
      edges[edges.length - 1].type = "subtechnique"
    }
  }

  return { nodes, edges, tactic_flow }
}

export async function warmCache(): Promise<{ techniques: number; tactics: number }> {
  const { techniques, tactics } = await loadBundle()
  return { techniques: techniques.size, tactics: tactics.size }
}
