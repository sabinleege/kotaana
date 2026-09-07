import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { PORTAL, PORTALS } from "@/lib/portal";

const { auth } = NextAuth(authConfig);

/**
 * Three product areas:
 *  - /app   → athletes (role=user)
 *  - /coach → coaches (role=coach)
 *  - /admin → app owner metrics (role=admin)
 *
 * When NEXT_PUBLIC_PORTAL is set, this instance serves exactly ONE of them and
 * the other two are unreachable — see src/lib/portal.ts.
 *
 * Note on ports: browsers scope cookies by host, NOT by port, so a session
 * created on :8080 is also sent to :8081 and :8082. A portal therefore has to
 * expect a signed-in user holding the WRONG role, and must send them to its own
 * login rather than to "their" home — that home is foreign here, and bouncing
 * to it produces an infinite redirect loop.
 */
const AREA_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/app", roles: ["user"] },
  { prefix: "/coach", roles: ["coach"] },
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/onboarding", roles: ["user", "coach"] },
];

const LOGIN_PAGES = ["/auth", "/coach-auth", "/owner-auth"];

function homeFor(role?: string) {
  if (role === "coach") return "/coach";
  if (role === "admin") return "/admin";
  return "/app";
}

function loginFor(prefix: string) {
  if (prefix === "/coach") return "/coach-auth";
  if (prefix === "/admin") return "/owner-auth";
  return "/auth";
}

function under(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

/** Allowed on every portal. */
function isAlwaysPublic(pathname: string) {
  return (
    pathname.startsWith("/legal") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string } | undefined;
  const role = user?.role;

  // ── Single-portal instance ────────────────────────────────────────
  if (PORTAL !== "all" && !isAlwaysPublic(pathname)) {
    const spec = PORTALS[PORTAL];
    const rightAccount = Boolean(user) && role === spec.role;

    // This portal's own login is always reachable — it is the loop breaker.
    if (under(pathname, spec.login)) return NextResponse.next();

    // Where an off-portal request should land.
    const fallback = rightAccount ? spec.area : spec.login;

    const foreignLogin = LOGIN_PAGES.some((p) => p !== spec.login && under(pathname, p));
    const foreignArea = AREA_ROLES.some(
      (a) => a.prefix !== spec.area && a.prefix !== "/onboarding" && under(pathname, a.prefix),
    );
    if (foreignLogin || foreignArea) {
      return NextResponse.redirect(new URL(fallback, req.nextUrl));
    }

    // Only the athlete portal keeps the marketing landing page.
    if (pathname === "/" && PORTAL !== "athlete") {
      return NextResponse.redirect(new URL(fallback, req.nextUrl));
    }

    // Inside this portal's area: signed in, but as somebody else's role.
    if (under(pathname, spec.area) && user && !rightAccount) {
      const url = new URL(spec.login, req.nextUrl);
      url.searchParams.set("error", "WrongPortal");
      return NextResponse.redirect(url);
    }
  }

  // Public auth portals
  if (LOGIN_PAGES.some((p) => under(pathname, p))) {
    return NextResponse.next();
  }

  const area = AREA_ROLES.find((a) => under(pathname, a.prefix));
  if (!area) return NextResponse.next();

  if (!user) {
    const url = new URL(
      PORTAL === "all" ? loginFor(area.prefix) : PORTALS[PORTAL].login,
      req.nextUrl,
    );
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!area.roles.includes(role || "user")) {
    // Combined site: send them to their own area. Single portal: handled above.
    return NextResponse.redirect(new URL(homeFor(role), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/app/:path*",
    "/coach/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/auth",
    "/coach-auth/:path*",
    "/owner-auth/:path*",
  ],
};
