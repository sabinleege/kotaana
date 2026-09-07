import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/authz";
import { AiNotConfiguredError } from "@/lib/ai";
import { RateLimitError } from "@/lib/rate-limit";

/**
 * Wraps an API route handler, turning known error types into proper HTTP
 * responses. Keeps route handlers focused on the happy path.
 */
export function route<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof AiNotConfiguredError) {
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          { error: err.message },
          { status: 429, headers: { "Retry-After": String(err.retryAfter) } },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid request", issues: err.flatten() },
          { status: 400 },
        );
      }
      console.error("[api] Unhandled error:", err);
      const message =
        err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
