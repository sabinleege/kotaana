/**
 * Types for the in-memory organizations scaffold (src/lib/orgs.ts).
 *
 * NOTE: This is a scaffold, not backed by Prisma yet. See docs/orgs.md for
 * the Organization / OrgMember / OrgInvite Prisma models to add when this
 * is promoted to a real, persisted feature. Until then, data created here
 * lives only in server memory and resets on redeploy/restart.
 */

export type OrgRole = "owner" | "admin" | "coach" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  planType: string;
  seatLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  email?: string;
  fullName?: string;
  joinedAt: string;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  status: "pending" | "accepted" | "expired";
  inviteCode: string;
  expiresAt: string;
  createdAt: string;
}
