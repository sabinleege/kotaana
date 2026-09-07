/**
 * GET /api/orgs/:orgId — org details (members can read)
 */

import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getOrganization, getMemberRole, listMembers } from "@/lib/orgs";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ orgId: string }> }) => {
  const me = await requireUser();
  const { orgId } = await ctx.params;

  const org = await getOrganization(orgId);
  if (!org) return json({ error: "Not found" }, 404);

  const role = await getMemberRole(orgId, me.id);
  if (!role) return json({ error: "Forbidden" }, 403);

  const memberList = await listMembers(orgId);

  return json({
    organization: org,
    role,
    members: memberList,
  });
});
