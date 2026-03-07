import { anthropic, AI_MODEL, AI_MAX_TOKENS } from "./client.js"

export interface SecurityPosture {
  total_vulnerabilities: number
  critical: number
  high: number
  medium: number
  low: number
  kev_count: number
  avg_time_to_remediate_days: number
  patch_coverage_pct: number
  exploit_success_rate: number
  assets_at_risk: number
  top_cves: string[]
}

export interface ExecutiveReportResult {
  executive_summary: string
  headline_risk_statement: string
  key_metrics_narrative: string
  top_risks: { title: string; business_impact: string; status: string }[]
  remediation_roi_narrative: string
  recommendations: { priority: number; action: string; effort: string; impact: string }[]
  board_ready_rating: "critical" | "elevated" | "moderate" | "managed"
}

export async function generateExecutiveReport(
  org_name: string,
  period: string,
  posture: SecurityPosture
): Promise<ExecutiveReportResult> {
  const prompt = `You are a CISO-level security advisor writing an executive security briefing for ${org_name}.

## Reporting Period
${period}

## Security Posture Metrics
- Total vulnerabilities: ${posture.total_vulnerabilities}
- Critical: ${posture.critical} | High: ${posture.high} | Medium: ${posture.medium} | Low: ${posture.low}
- CISA KEV (actively exploited): ${posture.kev_count}
- Assets at risk: ${posture.assets_at_risk}
- Average time to remediate: ${posture.avg_time_to_remediate_days} days
- Patch coverage: ${posture.patch_coverage_pct}%
- Exploit simulation success rate: ${(posture.exploit_success_rate * 100).toFixed(1)}%
- Top CVEs: ${posture.top_cves.join(", ")}

Write a board-level security briefing. Translate technical metrics into business risk language. Include financial impact framing where relevant.

Respond ONLY with valid JSON (no markdown):
{
  "executive_summary": "3-4 sentence board-ready paragraph",
  "headline_risk_statement": "one powerful sentence for the cover slide",
  "key_metrics_narrative": "paragraph translating the numbers into business meaning",
  "top_risks": [
    {"title": "risk name", "business_impact": "what this means for the business", "status": "open|mitigated|in progress"}
  ],
  "remediation_roi_narrative": "paragraph on ROI of security investment",
  "recommendations": [
    {"priority": 1, "action": "what to do", "effort": "low|medium|high", "impact": "business impact"}
  ],
  "board_ready_rating": "critical|elevated|moderate|managed"
}`

  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(text) as ExecutiveReportResult
}
