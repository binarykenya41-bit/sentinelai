import { anthropic, AI_MODEL, AI_MAX_TOKENS } from "./client.js"

export type ComplianceFramework = "iso27001" | "soc2" | "pcidss"

export interface ComplianceMappingRequest {
  cve_id: string
  cwe_ids: string[]
  cvss_v3: number
  asset_type: string
  remediation_action: string
  frameworks: ComplianceFramework[]
}

export interface ControlMapping {
  control_id: string
  control_name: string
  relevance: "directly_applicable" | "partially_applicable" | "informational"
  narrative: string
  evidence_required: string[]
}

export interface ComplianceMappingResult {
  framework: ComplianceFramework
  controls: ControlMapping[]
  audit_narrative: string
  gap_identified: boolean
  gap_description?: string
}

export async function mapToCompliance(req: ComplianceMappingRequest): Promise<ComplianceMappingResult[]> {
  const frameworkDescriptions: Record<ComplianceFramework, string> = {
    iso27001: "ISO 27001:2022 Annex A controls",
    soc2: "SOC 2 Trust Service Criteria (CC, A, PI, C, P series)",
    pcidss: "PCI-DSS v4.0 Requirements",
  }

  const prompt = `You are a compliance officer for Sentinel AI. Map the following security finding to compliance controls.

## Finding
- CVE: ${req.cve_id}
- CWE: ${req.cwe_ids.join(", ")}
- CVSS v3: ${req.cvss_v3}
- Asset type: ${req.asset_type}
- Remediation action taken: ${req.remediation_action}

## Frameworks to map
${req.frameworks.map((f) => `- ${f}: ${frameworkDescriptions[f]}`).join("\n")}

For each framework, identify the most relevant controls and produce an audit-ready narrative.

Respond ONLY with valid JSON array (no markdown):
[
  {
    "framework": "iso27001",
    "controls": [
      {
        "control_id": "A.8.8",
        "control_name": "Management of technical vulnerabilities",
        "relevance": "directly_applicable",
        "narrative": "audit-ready text explaining how remediation satisfies this control",
        "evidence_required": ["patch record", "scan report showing remediation"]
      }
    ],
    "audit_narrative": "paragraph-level summary for auditors",
    "gap_identified": false
  }
]`

  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(text) as ComplianceMappingResult[]
}
