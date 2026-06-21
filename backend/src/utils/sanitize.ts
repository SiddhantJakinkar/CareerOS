export function sanitizeForAI(input: string, maxLength = 10000): string {
  let sanitized = input
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/ignore (previous|above|all) instructions/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeMongoQuery(value: string): string {
  return value.replace(/[${}]/g, '');
}
