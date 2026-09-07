import NextAuth from "next-auth";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // On Google sign-in, make sure the user (+ profile + free subscription) exists.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();

        // Which portal did they start from? Only ever used to pick the role of a
        // BRAND-NEW account — an existing user's role is never touched here, so
        // the cookie can't be used to escalate. Self-selecting coach at signup is
        // already allowed by /api/auth/register.
        let intendedRole: "user" | "coach" = "user";
        try {
          const jar = await cookies();
          if (jar.get("kotaana_role_intent")?.value === "coach") intendedRole = "coach";
        } catch {
          // Not in a request context — fall back to athlete.
        }

        await prisma.user.upsert({
          where: { email },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: intendedRole,
            profile: { create: { fullName: user.name ?? "", email } },
            subscription: { create: { planType: "free", status: "inactive" } },
          },
        });
      }
      return true;
    },
    // Resolve our DB id + role into the JWT (Node side; middleware uses the edge-safe copy).
    async jwt({ token, user }) {
      if (user) {
        const anyUser = user as { id?: string; role?: unknown; email?: string | null };
        if (anyUser.role && anyUser.id) {
          token.id = anyUser.id;
          token.role = anyUser.role as (typeof token)["role"];
        } else if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
  },
});
