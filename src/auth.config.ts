import type { NextAuthConfig } from "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

/**
 * Edge-safe base config: no Prisma, no bcrypt. Shared by the full Node config
 * (src/auth.ts) and the middleware. Providers are added in src/auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  // Send auth failures back to our own login page (with ?error=...) instead of
  // Auth.js's built-in error route, which renders a broken page.
  pages: { signIn: "/auth", error: "/auth" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
