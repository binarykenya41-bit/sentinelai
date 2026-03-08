import { anthropic, AI_MODEL, AI_MAX_TOKENS } from "./client.js";
export async function mapToCompliance(req) {
    const frameworkDescriptions = {
        iso27001: "ISO 27001:2022 Annex A controls",
        soc2: "SOC 2 Trust Service Criteria (CC, A, PI, C, P series)",
        pcidss: "PCI-DSS v4.0 Requirements",
    };
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
]`;
    const msg = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].text.trim();
    return JSON.parse(text);
}
//# sourceMappingURL=compliance-mapping.js.map