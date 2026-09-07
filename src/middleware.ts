import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Only three product areas:
 *  - /app   → athletes (role=user)
 *  - /coach → coaches (role=coach)
 *  - /admin → app owner metrics (role=admin)
 */
const AREA_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/app", roles: ["user"] },
  { prefix: "/coach", roles: ["coach"] },
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/onboarding", roles: ["user", "coach"] },
];

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

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public auth portals
  if (
    pathname.startsWith("/coach-auth") ||
    pathname.startsWith("/owner-auth") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  const area = AREA_ROLES.find(
    (a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"),
  );
  if (!area) return NextResponse.next();

  const user = req.auth?.user as { role?: string } | undefined;
  if (!user) {
    const url = new URL(loginFor(area.prefix), req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = user.role || "user";
  if (!area.roles.includes(role)) {
    return NextResponse.redirect(new URL(homeFor(role), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/coach/:path*", "/admin/:path*", "/onboarding/:path*"],
};
