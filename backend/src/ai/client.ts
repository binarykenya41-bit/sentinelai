import Anthropic from "@anthropic-ai/sdk"

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[AI] ANTHROPIC_API_KEY not set — AI features will fail")
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const AI_MODEL = "claude-sonnet-4-6"
export const AI_MAX_TOKENS = 4096
