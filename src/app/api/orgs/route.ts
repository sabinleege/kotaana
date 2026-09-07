/**
 * GET  /api/orgs — list orgs for current user
 * POST /api/orgs — create org { name }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { createOrganization, listUserOrganizations } from "@/lib/orgs";

export const GET = route(async () => {
  const me = await requireUser();
  const orgs = await listUserOrganizations(me.id);
  return json({ organizations: orgs });
});

const createSchema = z.object({
  name: z.string().min(2).max(80),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = createSchema.parse(await req.json());

  const org = await createOrganization({
    name: body.name,
    ownerUserId: me.id,
    ownerEmail: me.email || undefined,
    ownerName: me.name || undefined,
  });

  return json({ organization: org }, 201);
});
