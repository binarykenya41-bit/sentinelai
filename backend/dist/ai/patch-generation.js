import { anthropic, AI_MODEL, AI_MAX_TOKENS } from "./client.js";
export async function generatePatch(req) {
    const prompt = `You are a security engineer generating a secure code patch for Sentinel AI.

## Vulnerability
- CVE: ${req.cve_id}
- CWE classifications: ${req.cwe_ids.join(", ")}
- Language: ${req.language}
${req.framework ? `- Framework: ${req.framework}` : ""}
${req.file_path ? `- File: ${req.file_path}` : ""}

## Affected Code
\`\`\`${req.language}
${req.affected_code}
\`\`\`

## Instructions
1. Fix the vulnerability following secure coding best practices for ${req.language}
2. Do NOT change business logic or add unnecessary features
3. Preserve existing function signatures where possible
4. Add inline comments only where the security fix needs explanation

Respond ONLY with valid JSON (no markdown wrapper):
{
  "patched_code": "complete corrected code as a string",
  "explanation": "what was wrong and what was changed",
  "cwe_addressed": ["CWE-XXX"],
  "breaking_changes": false,
  "test_suggestions": ["test case 1", "test case 2"],
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
//# sourceMappingURL=patch-generation.js.map