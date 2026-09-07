/**
 * POST /api/auth/register-owner
 * Creates the first app owner (role=admin) only if none exists.
 * Further owners must be promoted manually in DB — keeps the control plane tight.
 */
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { route, json } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
});

export const POST = route(async (req: Request) => {
  const body = schema.parse(await req.json());
  const email = body.email.toLowerCase().trim();

  const existingOwner = await prisma.user.count({ where: { role: "admin" } });
  if (existingOwner > 0) {
    return json(
      { error: "An app owner already exists. Sign in at /owner-auth or promote users in the database." },
      403,
    );
  }

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return json({ error: "Email already registered" }, 409);

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: body.name,
      passwordHash,
      role: "admin",
      // Without these the owner has no Profile row and gets stuck at LegalGate.
      profile: { create: { fullName: body.name, email } },
      subscription: { create: { planType: "free", status: "inactive" } },
    },
  });

  return json({ ok: true, userId: user.id }, 201);
});
