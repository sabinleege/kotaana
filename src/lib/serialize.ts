/**
 * Deep camelCase → snake_case key conversion for API responses.
 * Lets the ported (Supabase-era) frontend keep consuming snake_case shapes
 * while the server/Prisma layer stays camelCase. Dates are left as-is;
 * NextResponse.json serializes them to ISO strings.
 */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

export function toSnake<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((v) => toSnake(v)) as unknown as T;
  }
  if (value instanceof Date) {
    return value as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[camelToSnake(k)] = toSnake(v);
    }
    return out as T;
  }
  return value as T;
}
