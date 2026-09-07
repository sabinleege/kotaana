/**
 * Portal isolation.
 *
 * One codebase, but each running instance can be locked to a single audience so
 * athletes, coaches and owners each get their own host/port instead of one site
 * where you pick a role. Set NEXT_PUBLIC_PORTAL per instance:
 *
 *   athlete → :8080  landing page + /auth  + /app     (Google sign-in)
 *   coach   → :8081  /coach-auth + /coach             (Google sign-in)
 *   owner   → :8082  /owner-auth + /admin             (password only)
 *
 * Unset (or "all") keeps the original single-site behaviour, which is what the
 * Vercel deployment uses — see docs/PORTALS_ON_VERCEL.md.
 */

export type Portal = "athlete" | "coach" | "owner" | "all";

export const PORTAL: Portal = (() => {
  const raw = (process.env.NEXT_PUBLIC_PORTAL || "all").toLowerCase().trim();
  return raw === "athlete" || raw === "coach" || raw === "owner" ? raw : "all";
})();

type PortalSpec = {
  /** Area this portal serves. */
  area: string;
  /** Sign-in page for this portal. */
  login: string;
  /** Role allowed to use this portal. */
  role: "user" | "coach" | "admin";
  /** Human label, used in nav/branding. */
  label: string;
  /** Does this portal offer Google sign-in? */
  google: boolean;
};

export const PORTALS: Record<Exclude<Portal, "all">, PortalSpec> = {
  athlete: { area: "/app", login: "/auth", role: "user", label: "Athlete", google: true },
  coach: { area: "/coach", login: "/coach-auth", role: "coach", label: "Coach", google: true },
  owner: { area: "/admin", login: "/owner-auth", role: "admin", label: "Owner", google: false },
};

/** The spec for the current instance, or null when running the combined site. */
export function currentPortal(): PortalSpec | null {
  return PORTAL === "all" ? null : PORTALS[PORTAL];
}

/** Only the athlete portal (and the combined site) shows the marketing landing page. */
export const SHOWS_LANDING = PORTAL === "all" || PORTAL === "athlete";

/**
 * Where the OTHER portals live, so "are you a coach?" links still work when each
 * portal is its own host. On the combined site these stay relative paths.
 */
const PORTAL_ORIGINS: Record<Exclude<Portal, "all">, string | undefined> = {
  athlete: process.env.NEXT_PUBLIC_ATHLETE_URL,
  coach: process.env.NEXT_PUBLIC_COACH_URL,
  owner: process.env.NEXT_PUBLIC_OWNER_URL,
};

/** Absolute URL to another portal's sign-in page (or a relative path when combined). */
export function portalLoginUrl(target: Exclude<Portal, "all">): string {
  const path = PORTALS[target].login;
  if (PORTAL === "all") return path;
  const origin = PORTAL_ORIGINS[target];
  return origin ? `${origin.replace(/\/$/, "")}${path}` : path;
}
