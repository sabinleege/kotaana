/**
 * Organization helpers (in-memory scaffold).
 * Replace with Prisma Organization / OrgMember / OrgInvite models.
 */

import type { Organization, OrgMember, OrgInvite, OrgRole } from "@/types/org";
import { randomBytes } from "crypto";

const orgs = new Map<string, Organization>();
const members = new Map<string, OrgMember[]>(); // orgId -> members
const invites = new Map<string, OrgInvite[]>();

function uid(prefix = "org") {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

export async function createOrganization(input: {
  name: string;
  ownerUserId: string;
  ownerEmail?: string;
  ownerName?: string;
}): Promise<Organization> {
  const slug =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || uid("team");

  const org: Organization = {
    id: uid("org"),
    name: input.name,
    slug,
    planType: "starter",
    seatLimit: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orgs.set(org.id, org);

  const owner: OrgMember = {
    id: uid("mem"),
    orgId: org.id,
    userId: input.ownerUserId,
    role: "owner",
    email: input.ownerEmail,
    fullName: input.ownerName,
    joinedAt: new Date().toISOString(),
  };
  members.set(org.id, [owner]);
  invites.set(org.id, []);

  return org;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  return orgs.get(orgId) ?? null;
}

export async function listUserOrganizations(userId: string): Promise<Organization[]> {
  const result: Organization[] = [];
  for (const [orgId, list] of members.entries()) {
    if (list.some((m) => m.userId === userId)) {
      const org = orgs.get(orgId);
      if (org) result.push(org);
    }
  }
  return result;
}

export async function listMembers(orgId: string): Promise<OrgMember[]> {
  return members.get(orgId) ?? [];
}

export async function getMemberRole(orgId: string, userId: string): Promise<OrgRole | null> {
  const list = members.get(orgId) ?? [];
  return list.find((m) => m.userId === userId)?.role ?? null;
}

export async function requireOrgRole(
  orgId: string,
  userId: string,
  allowed: OrgRole[],
): Promise<OrgRole> {
  const role = await getMemberRole(orgId, userId);
  if (!role || !allowed.includes(role)) {
    const err = new Error("Forbidden — insufficient org role");
    (err as any).status = 403;
    throw err;
  }
  return role;
}

export async function addMember(input: {
  orgId: string;
  userId: string;
  role: OrgRole;
  email?: string;
  fullName?: string;
}): Promise<OrgMember> {
  const list = members.get(input.orgId) ?? [];
  if (list.some((m) => m.userId === input.userId)) {
    throw Object.assign(new Error("User already a member"), { status: 409 });
  }
  const member: OrgMember = {
    id: uid("mem"),
    orgId: input.orgId,
    userId: input.userId,
    role: input.role,
    email: input.email,
    fullName: input.fullName,
    joinedAt: new Date().toISOString(),
  };
  list.push(member);
  members.set(input.orgId, list);
  return member;
}

export async function createOrgInvite(input: {
  orgId: string;
  email: string;
  role: OrgRole;
}): Promise<OrgInvite> {
  const invite: OrgInvite = {
    id: uid("oinv"),
    orgId: input.orgId,
    email: input.email.toLowerCase(),
    role: input.role,
    status: "pending",
    inviteCode: randomBytes(6).toString("hex"),
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  const list = invites.get(input.orgId) ?? [];
  list.push(invite);
  invites.set(input.orgId, list);
  return invite;
}

export async function listInvites(orgId: string): Promise<OrgInvite[]> {
  return invites.get(orgId) ?? [];
}

export async function acceptOrgInvite(code: string, userId: string, email?: string) {
  for (const [orgId, list] of invites.entries()) {
    const inv = list.find((i) => i.inviteCode === code && i.status === "pending");
    if (!inv) continue;
    if (new Date(inv.expiresAt) < new Date()) {
      inv.status = "expired";
      return { ok: false, error: "Invite expired" };
    }
    if (email && inv.email !== email.toLowerCase()) {
      return { ok: false, error: "Invite email mismatch" };
    }
    inv.status = "accepted";
    await addMember({
      orgId,
      userId,
      role: inv.role,
      email: inv.email,
    });
    return { ok: true, orgId };
  }
  return { ok: false, error: "Invite not found" };
}
