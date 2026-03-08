import { anthropic, AI_MODEL, AI_MAX_TOKENS } from "./client.js";
export async function modelAttackScenario(req) {
    const prompt = `You are a threat intelligence analyst for Sentinel AI. Model a realistic attack scenario for the following vulnerability.

## Vulnerability
- CVE: ${req.cve_id}
- CVSS v3: ${req.cvss_v3}
- Mapped MITRE ATT&CK techniques: ${req.mitre_techniques.join(", ")}

## Target Asset
- Type: ${req.asset_type}
- Internet-facing: ${req.network_topology.internet_facing}
- Adjacent assets: ${req.network_topology.adjacent_assets.join(", ")}
- Trust zones: ${req.network_topology.trust_zones.join(", ")}

Model a realistic multi-step attack chain showing how a threat actor would exploit this CVE and pivot through the environment.

Respond ONLY with valid JSON (no markdown):
{
  "scenario_title": "short descriptive title",
  "threat_actor_profile": "likely threat actor type and motivation",
  "attack_chain": [
    {
      "step": 1,
      "tactic": "Initial Access",
      "technique_id": "T1190",
      "technique_name": "Exploit Public-Facing Application",
      "description": "what the attacker does in this step",
      "detection_opportunity": "how defenders could detect this step"
    }
  ],
  "dwell_time_estimate": "e.g. 2-7 days before detection",
  "impact_description": "business impact if attack succeeds",
  "detection_gaps": ["gap 1", "gap 2"],
  "mitigation_priorities": ["action 1", "action 2"],
  "confidence": 0.0
}`;
    const msg = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].text.trim();
    return JSON.parse(text);
}
//# sourceMappingURL=attack-modeling.js.map