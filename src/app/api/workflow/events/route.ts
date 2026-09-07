/**
 * GET /api/workflow/events — list available workflow definitions
 * (Useful for admin / debugging)
 */

import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { listDefinitions } from "@/lib/workflow/definitions";

export const GET = route(async () => {
  await requireUser();
  const defs = listDefinitions().map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    stepCount: d.steps.length,
  }));
  return json({ definitions: defs });
});
