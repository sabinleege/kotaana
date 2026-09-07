/**
 * POST /api/orgs/accept  { code }
 * Accept an organization invite.
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { acceptOrgInvite } from "@/lib/orgs";

const schema = z.object({
  code: z.string().min(1),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { code } = schema.parse(await req.json());

  const result = await acceptOrgInvite(code, me.id, me.email || undefined);
  if (!result.ok) return json({ error: result.error }, 400);

  return json({ ok: true, orgId: result.orgId });
});
