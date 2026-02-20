/**
 * Extracts and parses JSON from AI model responses.
 *
 * Handles common quirks from various AI providers:
 * - JSON wrapped in markdown code fences (```json ... ```)
 * - Extra text before/after the JSON object
 * - Plain JSON responses
 */
export function extractJson<T = any>(text: string): T {
  const trimmed = text.trim();

  // 1. Try direct parse first (cleanest case)
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to other strategies
  }

  // 2. Try extracting from markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // Continue to next strategy
    }
  }

  // 3. Try finding the first { ... } block (greedy match for outermost braces)
  const braceStart = trimmed.indexOf('{');
  const braceEnd = trimmed.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(trimmed.substring(braceStart, braceEnd + 1));
    } catch {
      // Continue to error
    }
  }

  throw new Error(
    `Failed to extract JSON from AI response. Response starts with: "${trimmed.substring(0, 100)}..."`,
  );
}
