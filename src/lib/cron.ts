import { AuthError } from "@/lib/authz";

/**
 * Shared guard for /api/jobs/* cron routes.
 *
 * Accepts either:
 *   - `x-cron-secret: <CRON_SECRET>`         — manual / external schedulers
 *   - `Authorization: Bearer <CRON_SECRET>`  — what Vercel Cron actually sends
 *
 * Fails closed: with no CRON_SECRET configured, nobody gets in. (An earlier
 * version skipped the check entirely when the variable was unset, which left
 * the batch jobs open to anyone who found the URL.)
 */
export function assertCron(req: Request): void {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new AuthError(503, "CRON_SECRET is not configured — job routes are disabled.");
  }

  const header = req.headers.get("x-cron-secret");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (header !== expected && bearer !== expected) {
    throw new AuthError(401, "Unauthorized");
  }
}
