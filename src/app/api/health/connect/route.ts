/**
 * GET  /api/health/connect — start Google Health OAuth (returns auth URL)
 * POST /api/health/connect — finish OAuth { code, redirectUri }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import {
  getGoogleHealthAuthUrl,
  exchangeGoogleHealthCode,
} from "@/lib/health/google-health";
import { setTrackMeEnabled } from "@/lib/health/track-me";

export const GET = route(async (req: Request) => {
  const me = await requireUser();
  const url = new URL(req.url);
  const redirectUri =
    url.searchParams.get("redirectUri") ||
    `${process.env.AUTH_URL || "http://localhost:8080"}/app/settings`;

  const authUrl = getGoogleHealthAuthUrl(me.id, redirectUri);
  return json({ authUrl, state: me.id });
});

const postSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = postSchema.parse(await req.json());

  const tokens = await exchangeGoogleHealthCode(body.code, body.redirectUri);
  // Real: store tokens encrypted on user/profile
  await setTrackMeEnabled(me.id, true, "google_health");

  return json({
    connected: true,
    provider: "google_health",
    expiresAt: tokens.expiresAt,
  });
});
