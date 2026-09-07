/**
 * POST /api/workflow/start
 * Body: { definitionId: string, context?: object }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { startWorkflow } from "@/lib/workflow/engine";
import { listDefinitions } from "@/lib/workflow/definitions";

const schema = z.object({
  definitionId: z.string().min(1),
  context: z.record(z.unknown()).optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  const known = listDefinitions().map((d) => d.id);
  if (!known.includes(body.definitionId)) {
    return json({ error: "Unknown workflow definition", known }, 400);
  }

  const { instanceId } = await startWorkflow(body.definitionId, {
    userId: me.id,
    ...body.context,
  });

  return json({ instanceId, status: "running" }, 201);
});
