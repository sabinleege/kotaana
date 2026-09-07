/**
 * GET /api/workflow/history?instanceId=xxx
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getHistory } from "@/lib/workflow/history";

export const GET = route(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const instanceId = url.searchParams.get("instanceId");
  if (!instanceId) return json({ error: "instanceId required" }, 400);

  const history = await getHistory(instanceId);
  return json({ history });
});
