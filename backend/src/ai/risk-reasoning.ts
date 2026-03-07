import { anthropic, AI_MODEL, AI_MAX_TOKENS } from "./client.js"

export interface VulnContext {
  cve_id: string
  cvss_v3: number
  epss_score: number
  kev_status: boolean
  cwe_ids: string[]
  mitre_techniques: string[]
  description?: string
}

export interface AssetContext {
  type?: string
  asset_type?: string
  hostname: string
  criticality: "low" | "medium" | "high" | "critical"
  environment?: string
  tags?: string[]
}

export interface GraphPosition {
  inbound_paths: number
  distance_from_edge: number
  adjacent_techniques?: string[]
}

export interface RiskReasoningResult {
  summary: string
  blast_radius: string
  priority_score: number // 0-100 composite
  recommended_action: string
  urgency: "immediate" | "high" | "medium" | "low"
  confidence: number
}

export async function analyzeRisk(
  vuln: VulnContext,
  asset: AssetContext,
  graph?: GraphPosition
): Promise<RiskReasoningResult> {
  graph = graph ?? { inbound_paths: 0, distance_from_edge: 1 }
  const prompt = `You are a senior security analyst for Sentinel AI. Analyze the following vulnerability in context and produce a structured risk assessment.

## Vulnerability
- CVE: ${vuln.cve_id}
- CVSS v3: ${vuln.cvss_v3}
- EPSS Probability: ${(vuln.epss_score * 100).toFixed(2)}%
- CISA KEV: ${vuln.kev_status ? "YES — actively exploited in the wild" : "No"}
- CWE: ${(vuln.cwe_ids ?? []).join(", ") || "N/A"}
- MITRE Techniques: ${(vuln.mitre_techniques ?? []).join(", ") || "N/A"}
${vuln.description ? `- Description: ${vuln.description}` : ""}

## Affected Asset
- Type: ${asset.type ?? asset.asset_type ?? "unknown"}
- Hostname: ${asset.hostname}
- Criticality: ${asset.criticality}
- Tags: ${asset.tags?.join(", ") ?? "none"}

## Attack Graph Position
- Inbound attack paths: ${graph.inbound_paths}
- Distance from network edge: ${graph.distance_from_edge} hops
- Adjacent ATT&CK techniques: ${graph.adjacent_techniques?.join(", ") ?? "unknown"}

Respond ONLY with a valid JSON object matching this exact schema (no markdown):
{
  "summary": "2-3 sentence narrative explaining why this CVE is critical in THIS environment",
  "blast_radius": "concise description of what an attacker could reach if this is exploited",
  "priority_score": <integer 0-100 composite risk score>,
  "recommended_action": "specific next step for the security team",
  "urgency": "<immediate|high|medium|low>",
  "confidence": <float 0.0-1.0>
}`

  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(text) as RiskReasoningResult
}
