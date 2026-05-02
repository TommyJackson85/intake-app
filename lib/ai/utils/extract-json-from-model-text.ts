/**
 * Best-effort extraction of a single JSON object string from model output
 * (plain JSON, or fenced ``` / ```json blocks).
 */

export function extractJsonStringFromModelText(text: string): string {
  const trimmed = text.trim()

  const fenceMatch = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/m.exec(trimmed)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim()
  }

  return trimmed
}
