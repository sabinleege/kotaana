import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route, json } from "@/lib/api";
import { guardAuth } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().trim().min(1, "Name is required"),
  role: z.enum(["user", "coach"]).default("user"),
});

export const POST = route(async (req: Request) => {
  await guardAuth(req, "register", { perMin: 5, perHour: 20 });
  const body = await req.json();
  const { email, password, fullName, role } = registerSchema.parse(body);
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    return json({ error: "An account with this email already exists" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create the user, their profile, and a default free subscription together.
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: fullName,
      role,
      profile: {
        create: { fullName, email: normalizedEmail },
      },
      subscription: {
        create: { planType: "free", status: "inactive" },
      },
    },
    select: { id: true, email: true, role: true },
  });

  return json({ user }, 201);
});
