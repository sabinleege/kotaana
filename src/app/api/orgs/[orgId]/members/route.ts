/**
 * GET  /api/orgs/:orgId/members
 * POST /api/orgs/:orgId/members  — add existing user { userId, role }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { listMembers, requireOrgRole, addMember } from "@/lib/orgs";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ orgId: string }> }) => {
  const me = await requireUser();
  const { orgId } = await ctx.params;
  await requireOrgRole(orgId, me.id, ["owner", "admin", "coach", "member"]);
  const members = await listMembers(orgId);
  return json({ members });
});

const postSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "coach", "member"]).default("member"),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
});

export const POST = route(async (req: Request, ctx: { params: Promise<{ orgId: string }> }) => {
  const me = await requireUser();
  const { orgId } = await ctx.params;
  await requireOrgRole(orgId, me.id, ["owner", "admin"]);

  const body = postSchema.parse(await req.json());
  try {
    const member = await addMember({
      orgId,
      userId: body.userId,
      role: body.role,
      email: body.email,
      fullName: body.fullName,
    });
    return json({ member }, 201);
  } catch (e: any) {
    return json({ error: e.message || "Failed" }, e.status || 400);
  }
});
