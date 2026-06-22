/**
 * Collects Gemini API keys from env (no hardcoded keys).
 * Priority: GEMINI_API_KEY → GEMINI_API_KEY_2..10 → GEMINI_API_KEYS (comma-separated).
 */
export function loadGeminiApiKeys(): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];

  function add(key: string | undefined): void {
    const trimmed = key?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    keys.push(trimmed);
  }

  add(process.env.GEMINI_API_KEY);

  for (let i = 2; i <= 10; i++) {
    add(process.env[`GEMINI_API_KEY_${i}`]);
  }

  const bulk = process.env.GEMINI_API_KEYS;
  if (bulk) {
    for (const part of bulk.split(',')) {
      add(part);
    }
  }

  return keys;
}
