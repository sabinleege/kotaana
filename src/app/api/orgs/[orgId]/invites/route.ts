/**
 * GET  /api/orgs/:orgId/invites
 * POST /api/orgs/:orgId/invites  { email, role }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireOrgRole, createOrgInvite, listInvites } from "@/lib/orgs";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ orgId: string }> }) => {
  const me = await requireUser();
  const { orgId } = await ctx.params;
  await requireOrgRole(orgId, me.id, ["owner", "admin"]);
  const invites = await listInvites(orgId);
  return json({ invites });
});

const postSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "coach", "member"]).default("coach"),
});

export const POST = route(async (req: Request, ctx: { params: Promise<{ orgId: string }> }) => {
  const me = await requireUser();
  const { orgId } = await ctx.params;
  await requireOrgRole(orgId, me.id, ["owner", "admin"]);

  const body = postSchema.parse(await req.json());
  const invite = await createOrgInvite({
    orgId,
    email: body.email,
    role: body.role,
  });

  return json({
    invite,
    link: `/join?orgCode=${invite.inviteCode}`,
  }, 201);
});
