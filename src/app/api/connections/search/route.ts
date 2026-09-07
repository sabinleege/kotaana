/**
 * GET /api/connections/search?q=name|email|code
 * Athletes (and others) can find coaches who registered.
 * Returns public-ish fields including MoMo when the coach saved them.
 */
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";

export const GET = route(async (req: Request) => {
  await requireUser();
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return json({ coaches: [], message: "Type at least 2 characters" });

  const qLower = q.toLowerCase();
  const isEmail = q.includes("@");

  const users = await prisma.user.findMany({
    where: {
      role: "coach",
      OR: [
        ...(isEmail ? [{ email: { equals: q, mode: "insensitive" as const } }] : [{ email: { contains: q, mode: "insensitive" as const } }]),
        { profile: { fullName: { contains: q, mode: "insensitive" as const } } },
        { profile: { connectCode: { equals: q.toUpperCase(), mode: "insensitive" as const } } },
        { profile: { connectCode: { contains: q, mode: "insensitive" as const } } },
      ],
    },
    take: 20,
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          fullName: true,
          avatarUrl: true,
          connectCode: true,
          momoNumber: true,
          momoName: true,
        },
      },
    },
  });

  const coaches = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.profile?.fullName || u.email,
    avatar_url: u.profile?.avatarUrl || null,
    connect_code: u.profile?.connectCode || null,
    // Visible when coach registered/saved MoMo — used when athlete chooses this coach
    momo_number: u.profile?.momoNumber || null,
    momo_name: u.profile?.momoName || null,
    has_momo: !!(u.profile?.momoNumber && u.profile?.momoName),
  }));

  // Prefer better name matches first
  coaches.sort((a, b) => {
    const as = (a.name || "").toLowerCase().startsWith(qLower) ? 0 : 1;
    const bs = (b.name || "").toLowerCase().startsWith(qLower) ? 0 : 1;
    return as - bs;
  });

  return json({ coaches });
});
