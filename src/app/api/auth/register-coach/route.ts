/**
 * POST /api/auth/register-coach
 * Creates a user with role=coach (separate from athlete register).
 */

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { route, json } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80),
});

export const POST = route(async (req: Request) => {
  const body = schema.parse(await req.json());
  const email = body.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return json({ error: "Email already registered" }, 409);

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: body.name,
      passwordHash,
      role: "coach",
    },
  });

  // Optional empty subscription row
  await prisma.subscription
    .create({
      data: {
        userId: user.id,
        planType: "free",
        status: "inactive",
        coversAthletes: true,
        seatLimit: 0,
      },
    })
    .catch(() => {});

  return json({ ok: true, userId: user.id }, 201);
});
