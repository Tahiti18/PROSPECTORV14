export interface ValidationResult {
  ok: boolean;
  missing: string[];
}

export interface ParseResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

/**
 * extractJsonEnvelope(text: string): string | null
 * - Trim everything before the first '{' and after the last '}'.
 * - Return null if no valid envelope exists.
 */
export const extractJsonEnvelope = (text: string): string | null => {
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  if (firstOpen === -1 || lastClose === -1 || lastClose < firstOpen) {
    return null;
  }
  return text.substring(firstOpen, lastClose + 1);
};

/**
 * safeJsonParse(text: string):
 * - Returns { ok: true, value } or { ok: false, error }
 */
export const safeJsonParse = <T>(text: string): ParseResult<T> => {
  try {
    // Attempt direct parse first
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    // Attempt envelope extraction on failure
    const envelope = extractJsonEnvelope(text);
    if (envelope) {
      try {
        return { ok: true, value: JSON.parse(envelope) };
      } catch (innerE) {
        return { ok: false, error: 'Malformed JSON envelope detected' };
      }
    }
    return { ok: false, error: 'No valid JSON object found in response' };
  }
};

/**
 * validateKeys(obj: any, requiredPaths: string[]):
 * - Supports dot-paths (e.g. "validated_intelligence.key_facts")
 * - Returns { ok: boolean, missing: string[] }
 */
export const validateKeys = (obj: any, requiredPaths: string[]): ValidationResult => {
  const missing: string[] = [];

  for (const path of requiredPaths) {
    const parts = path.split('.');
    let current = obj;
    let found = true;

    for (const part of parts) {
      if (current === null || typeof current !== 'object' || !(part in current)) {
        found = false;
        break;
      }
      current = current[part];
    }

    if (!found) missing.push(path);
  }

  return { ok: missing.length === 0, missing };
}
