/**
 * Attack Graph Builder
 *
 * Combines:
 *  - NVD CVE data (vulnerability details)
 *  - EPSS exploit probability
 *  - CISA KEV (active exploitation)
 *  - MITRE ATT&CK STIX (technique nodes, tactic ordering, relationships)
 *  - VulDB (exploit maturity, countermeasures)
 *
 * Outputs a graph (nodes + edges + tactic_flow) that can be:
 *  - Stored in Neo4j for path traversal
 *  - Sent to the frontend Recharts / D3 attack graph visualizer
 *  - Rendered as the ATT&CK matrix heat-map
 *
 * Node types:
 *   cve        — a specific vulnerability
 *   technique  — MITRE ATT&CK technique/sub-technique
 *   tactic     — MITRE ATT&CK tactic (kill-chain phase)
 *   asset      — infrastructure node affected by a CVE
 *
 * Edge types:
 *   exploits         — CVE exploits a technique
 *   enables          — technique enables next technique (lateral movement)
 *   targets          — CVE targets an asset
 *   mapped_to        — CVE mapped to technique via CWE
 *   subtechnique_of  — sub-technique → parent technique
 *   belongs_to       — technique → tactic
 */
import { fetchCveById } from "./nvd.js"
import { fetchEpssScore } from "./epss.js"
import { getKevEntry } from "./kev.js"
import { fetchVulDbByCve } from "./vuldb.js"
import {
  listAllTechniques,
  getTechnique,
  getTactics,
  mapCweToTechniques,
  getAttackChain,
  type MitreTechnique,
  type MitreTactic,
} from "./mitre.js"

// ── Types ─────────────────────────────────────────────────────────────────────

export type NodeType = "cve" | "technique" | "tactic" | "asset"
export type EdgeType = "exploits" | "enables" | "targets" | "mapped_to" | "subtechnique_of" | "belongs_to"

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  // Risk attributes (used for node coloring)
  risk_score: number        // 0–100
  cvss?: number
  epss?: number
  is_kev?: boolean
  exploit_available?: boolean
  // Display metadata
  tactic_phase?: string
  platform?: string[]
  description?: string
  url?: string
}

export interface GraphEdge {
  source: string            // node id
  target: string            // node id
  type: EdgeType
  label?: string
  weight?: number           // edge importance 0–1
}

export interface AttackGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  tactic_flow: string[]     // ordered tactic names
  meta: {
    cve_count: number
    technique_count: number
    tactic_count: number
    asset_count: number
    generated_at: string
    sources: string[]
  }
}

// ── MITRE tactic ordering ─────────────────────────────────────────────────────

const TACTIC_ORDER = [
  "reconnaissance", "resource-development", "initial-access",
  "execution", "persistence", "privilege-escalation",
  "defense-evasion", "credential-access", "discovery",
  "lateral-movement", "collection", "command-and-control",
  "exfiltration", "impact",
]

function tacticRiskColor(tactic: string): number {
  // Later-stage tactics = higher risk score
  const idx = TACTIC_ORDER.indexOf(tactic.toLowerCase().replace(/ /g, "-"))
  if (idx < 0) return 50
  return Math.round(30 + (idx / (TACTIC_ORDER.length - 1)) * 70)
}

// ── Core builder ──────────────────────────────────────────────────────────────

/**
 * Build an attack graph for one or more CVE IDs.
 * Fetches all data sources in parallel and wires nodes + edges.
 */
export async function buildCveAttackGraph(
  cveIds: string[],
  assetIds: { id: string; hostname: string; type: string }[] = []
): Promise<AttackGraph> {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const seenNodes = new Set<string>()
  const seenEdges = new Set<string>()
  const sources: string[] = ["NVD", "EPSS", "CISA KEV", "MITRE ATT&CK STIX"]

  function addNode(node: GraphNode) {
    if (!seenNodes.has(node.id)) {
      seenNodes.add(node.id)
      nodes.push(node)
    }
  }

  function addEdge(edge: GraphEdge) {
    const key = `${edge.source}→${edge.target}:${edge.type}`
    if (!seenEdges.has(key)) {
      seenEdges.add(key)
      edges.push(edge)
    }
  }

  // ── 1. Fetch all CVE data in parallel ────────────────────────────────────
  const cveData = await Promise.all(
    cveIds.map(async (cveId) => {
      const [nvd, epss, kev, vuldb] = await Promise.allSettled([
        fetchCveById(cveId),
        fetchEpssScore(cveId),
        getKevEntry(cveId),
        fetchVulDbByCve(cveId),
      ])
      return {
        cveId,
        nvd: nvd.status === "fulfilled" ? nvd.value : null,
        epss: epss.status === "fulfilled" ? epss.value : null,
        kev: kev.status === "fulfilled" ? kev.value : null,
        vuldb: vuldb.status === "fulfilled" ? vuldb.value : null,
      }
    })
  )

  if (cveData.some((d) => d.vuldb)) sources.push("VulDB")

  // ── 2. Add CVE nodes ─────────────────────────────────────────────────────
  for (const d of cveData) {
    const cvss = d.nvd?.cvss_v3_score ?? 0
    const epssScore = d.epss?.epss ?? 0
    const isKev = d.kev !== null
    const exploitAvail = d.vuldb?.exploit_available ?? false

    // Composite risk: CVSS 40% + EPSS 30% + KEV 20% + exploit 10%
    const risk = Math.min(100, Math.round(
      cvss * 4 + epssScore * 30 + (isKev ? 20 : 0) + (exploitAvail ? 10 : 0)
    ))

    addNode({
      id: d.cveId,
      type: "cve",
      label: d.cveId,
      risk_score: risk,
      cvss,
      epss: epssScore,
      is_kev: isKev,
      exploit_available: exploitAvail,
      description: d.nvd?.description?.slice(0, 200),
      url: `https://nvd.nist.gov/vuln/detail/${d.cveId}`,
    })
  }

  // ── 3. Map CVEs → MITRE techniques via CWE ───────────────────────────────
  const techniqueSet = new Map<string, MitreTechnique>()

  for (const d of cveData) {
    if (!d.nvd?.cwe_ids?.length) continue
    const techniques = await mapCweToTechniques(d.nvd.cwe_ids)

    for (const tech of techniques) {
      techniqueSet.set(tech.id, tech)

      // CVE → technique edge
      addEdge({
        source: d.cveId,
        target: tech.id,
        type: "mapped_to",
        label: `CWE→${tech.id}`,
        weight: 0.8,
      })
    }

    // Also check VulDB ATT&CK mappings
    if (d.vuldb?.attack_techniques?.length) {
      for (const techId of d.vuldb.attack_techniques) {
        const tech = await getTechnique(techId)
        if (tech) {
          techniqueSet.set(tech.id, tech)
          addEdge({
            source: d.cveId,
            target: tech.id,
            type: "exploits",
            label: "VulDB mapping",
            weight: 0.9,
          })
        }
      }
    }
  }

  // ── 4. Add technique nodes ────────────────────────────────────────────────
  const tacticSet = new Map<string, MitreTactic>()
  const allTactics = await getTactics()
  for (const tactic of allTactics) {
    tacticSet.set(tactic.short_name, tactic)
  }

  for (const tech of techniqueSet.values()) {
    addNode({
      id: tech.id,
      type: "technique",
      label: `${tech.id}: ${tech.name}`,
      risk_score: tacticRiskColor(tech.tactic_phases[0] ?? ""),
      tactic_phase: tech.tactic_phases[0],
      platform: tech.platforms,
      description: tech.description.slice(0, 200),
      url: tech.url,
    })

    // Sub-technique → parent edge
    if (tech.parent_id) {
      addEdge({
        source: tech.id,
        target: tech.parent_id,
        type: "subtechnique_of",
        weight: 0.5,
      })
    }

    // Technique → tactic edge
    for (const phase of tech.tactic_phases) {
      const tactic = tacticSet.get(phase)
      if (!tactic) continue

      // Add tactic node
      addNode({
        id: tactic.id,
        type: "tactic",
        label: tactic.name,
        risk_score: tacticRiskColor(tactic.short_name),
        tactic_phase: tactic.short_name,
        description: tactic.description.slice(0, 200),
        url: tactic.url,
      })

      addEdge({
        source: tech.id,
        target: tactic.id,
        type: "belongs_to",
        weight: 0.3,
      })
    }
  }

  // ── 5. Add lateral movement edges between techniques ─────────────────────
  // Connect techniques that appear in consecutive tactic phases
  const techniquesByTactic = new Map<string, string[]>()
  for (const tech of techniqueSet.values()) {
    for (const phase of tech.tactic_phases) {
      if (!techniquesByTactic.has(phase)) techniquesByTactic.set(phase, [])
      techniquesByTactic.get(phase)!.push(tech.id)
    }
  }

  for (let i = 0; i < TACTIC_ORDER.length - 1; i++) {
    const currTacticTechs = techniquesByTactic.get(TACTIC_ORDER[i]) ?? []
    const nextTacticTechs = techniquesByTactic.get(TACTIC_ORDER[i + 1]) ?? []
    for (const src of currTacticTechs) {
      for (const dst of nextTacticTechs) {
        addEdge({
          source: src,
          target: dst,
          type: "enables",
          label: `${TACTIC_ORDER[i]} → ${TACTIC_ORDER[i + 1]}`,
          weight: 0.4,
        })
      }
    }
  }

  // ── 6. Add asset nodes ────────────────────────────────────────────────────
  for (const asset of assetIds) {
    addNode({
      id: `asset:${asset.id}`,
      type: "asset",
      label: asset.hostname,
      risk_score: 50,
      description: asset.type,
    })

    // CVE → asset edges (all CVEs target all provided assets for now)
    for (const d of cveData) {
      addEdge({
        source: d.cveId,
        target: `asset:${asset.id}`,
        type: "targets",
        weight: 0.7,
      })
    }
  }

  // ── 7. Tactic flow (ordered subset actually present) ─────────────────────
  const usedTactics = new Set(
    nodes
      .filter((n) => n.type === "technique" && n.tactic_phase)
      .map((n) => n.tactic_phase!)
  )
  const tactic_flow = TACTIC_ORDER.filter((t) => usedTactics.has(t))

  return {
    nodes,
    edges,
    tactic_flow,
    meta: {
      cve_count: cveIds.length,
      technique_count: techniqueSet.size,
      tactic_count: new Set(nodes.filter((n) => n.type === "tactic").map((n) => n.id)).size,
      asset_count: assetIds.length,
      generated_at: new Date().toISOString(),
      sources,
    },
  }
}

/**
 * Build the full ATT&CK matrix as a graph — all techniques organised by tactic.
 * Used for the ATT&CK heat-map view.
 */
export async function buildFullAttackMatrix(): Promise<AttackGraph> {
  const [allTechniques, allTactics] = await Promise.all([
    listAllTechniques(),
    getTactics(),
  ])

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Tactic nodes
  for (const tactic of allTactics) {
    nodes.push({
      id: tactic.id,
      type: "tactic",
      label: tactic.name,
      risk_score: tacticRiskColor(tactic.short_name),
      tactic_phase: tactic.short_name,
      description: tactic.description.slice(0, 200),
      url: tactic.url,
    })
  }

  const tacticMap = new Map(allTactics.map((t) => [t.short_name, t.id]))

  // Technique nodes + edges
  for (const tech of allTechniques) {
    nodes.push({
      id: tech.id,
      type: "technique",
      label: `${tech.id}: ${tech.name}`,
      risk_score: 50,
      tactic_phase: tech.tactic_phases[0],
      platform: tech.platforms,
      description: tech.description.slice(0, 200),
      url: tech.url,
    })

    for (const phase of tech.tactic_phases) {
      const tacticId = tacticMap.get(phase)
      if (tacticId) {
        edges.push({ source: tech.id, target: tacticId, type: "belongs_to", weight: 0.5 })
      }
    }

    if (tech.parent_id) {
      edges.push({ source: tech.id, target: tech.parent_id, type: "subtechnique_of", weight: 0.3 })
    }
  }

  return {
    nodes,
    edges,
    tactic_flow: TACTIC_ORDER,
    meta: {
      cve_count: 0,
      technique_count: allTechniques.length,
      tactic_count: allTactics.length,
      asset_count: 0,
      generated_at: new Date().toISOString(),
      sources: ["MITRE ATT&CK STIX (GitHub)"],
    },
  }
}
