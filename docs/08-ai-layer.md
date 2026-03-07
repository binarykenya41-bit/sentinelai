# 8. AI Intelligence Layer

## Model

Sentinel AI uses **Anthropic Claude** (`claude-sonnet-4-6`) as the cognitive reasoning layer.

---

## Use Cases

### 1. Contextual Risk Reasoning
Claude receives the enriched VulnRecord + asset context + attack graph position and produces a narrative explaining **why** a vulnerability is critical in this specific environment — beyond generic CVSS scores.

**Input:**
```json
{
  "vuln": { "cve_id": "CVE-2024-1234", "cvss_v3": 9.8, "epss_score": 0.97 },
  "asset": { "type": "database", "criticality": "critical", "hostname": "prod-db-01" },
  "graph_position": { "inbound_paths": 14, "distance_from_edge": 2 }
}
```

### 2. Attack Scenario Modeling
Given a CVE + infrastructure topology, Claude generates a multi-step attack narrative showing how a threat actor would chain the vulnerability with adjacent weaknesses to reach critical assets.

### 3. Patch Code Generation
Claude generates syntactically correct, context-aware remediation code in the target language (Python, Java, Go, JavaScript, etc.) based on:
- CWE classification
- Affected code context
- Secure coding best practices

### 4. Compliance Mapping
Claude maps vulnerability characteristics and remediation actions to:
- ISO 27001 Annex A controls
- SOC 2 Trust Service Criteria
- PCI-DSS v4.0 Requirements
...generating audit-ready narrative text.

### 5. Executive Reporting
Claude authors board-level posture summaries, translating technical metrics into business risk language with financial impact estimates and remediation ROI calculations.

---

## AI Safety Controls

| Control | Detail |
|---|---|
| No direct production execution | All AI patches pass through CI/CD pipeline first |
| Static analysis gate | Semgrep + Grype audit every generated patch |
| Human approval for sensitive changes | Auth, crypto, and access control patches require human review |
| Confidence threshold | Output confidence < 0.75 escalates to human engineer queue |
| Full audit trail | Every Claude API call logged with prompt + response |

---

## Integration (backend/ai/client.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generatePatch(vulnRecord: VulnRecord, codeContext: string) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a security engineer. Generate a secure patch for:
CVE: ${vulnRecord.cve_id}
CWE: ${vulnRecord.cwe_ids.join(', ')}
Affected code:
\`\`\`
${codeContext}
\`\`\`
Return only the corrected code with a brief explanation.`
      }
    ]
  })
  return message.content[0].text
}
```
