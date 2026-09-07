/**
 * GET  /api/health/track-me  — current Track Me status
 * POST /api/health/track-me  — enable/disable { enabled, provider? }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getTrackMeStatus, setTrackMeEnabled } from "@/lib/health/track-me";

export const GET = route(async () => {
  const me = await requireUser();
  const status = await getTrackMeStatus(me.id);
  return json(status);
});

const postSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(["none", "google_health", "health_connect", "manual"]).optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = postSchema.parse(await req.json());
  const status = await setTrackMeEnabled(
    me.id,
    body.enabled,
    body.provider ?? (body.enabled ? "manual" : "none"),
  );
  return json(status);
});
