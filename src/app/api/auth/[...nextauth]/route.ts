/**
 * Auth.js (NextAuth v5) catch-all handler.
 *
 * This mounts everything the client half of NextAuth talks to:
 *   /api/auth/session, /api/auth/providers, /api/auth/csrf,
 *   /api/auth/signin, /api/auth/signout, /api/auth/callback/*
 *
 * Without it, `auth.ts` builds the handlers but nothing serves them — every
 * one of those URLs 404s, `useSession()` never resolves, and signing in is
 * impossible even though the login pages themselves render fine.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
