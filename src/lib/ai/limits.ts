/**
 * Time budget for AI calls.
 *
 * Kotaana's AI runs inside serverless functions, so the whole request has a
 * hard ceiling. If a model stalls (some free OpenRouter models stream keep-alive
 * whitespace and never finish) the function is killed and the user gets no
 * response at all — a plan that "generates" forever and never appears.
 *
 * So: cap each individual call, and cap the whole fallback chain, leaving room
 * to return a real error instead of being terminated mid-flight.
 */

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** One provider call. Gemini ≈16s and OpenRouter ≈23s on a JSON plan, so 30s is generous. */
export const AI_CALL_TIMEOUT_MS = num(process.env.AI_CALL_TIMEOUT_MS, 30_000);

/**
 * The whole router chain. Must stay below the route's maxDuration so the
 * handler can still send an error response.
 */
export const AI_TOTAL_BUDGET_MS = num(process.env.AI_TOTAL_BUDGET_MS, 55_000);

/** Serverless ceiling for AI routes — Vercel Hobby allows up to 60s. */
export const AI_ROUTE_MAX_DURATION = num(process.env.AI_ROUTE_MAX_DURATION, 60);
