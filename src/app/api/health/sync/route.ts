/**
 * POST /api/health/sync
 * Pull Google Health data OR accept Health Connect batch from client.
 *
 * Body options:
 *  A) { provider: "google_health", days?: number }
 *  B) { provider: "health_connect", records: [...] }
 *  C) { provider: "manual", samples: [{ date, distanceKm }] }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { fetchGoogleDistance } from "@/lib/health/google-health";
import { normaliseHealthConnectBatch } from "@/lib/health/health-connect";
import { cacheDistanceSamples, getDistanceSummary } from "@/lib/health/distance-cache";

const schema = z.object({
  provider: z.enum(["google_health", "health_connect", "manual"]),
  days: z.number().int().min(1).max(30).optional(),
  records: z
    .array(
      z.object({
        date: z.string(),
        distanceMeters: z.number().optional(),
        distanceKm: z.number().optional(),
        steps: z.number().optional(),
        activeMinutes: z.number().optional(),
      }),
    )
    .optional(),
  samples: z
    .array(
      z.object({
        date: z.string(),
        distanceKm: z.number().positive(),
        durationSec: z.number().optional(),
        calories: z.number().optional(),
      }),
    )
    .optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  let written = 0;

  if (body.provider === "google_health") {
    // Tokens would be loaded from DB; mock path returns sample data
    const samples = await fetchGoogleDistance(
      { accessToken: "stored_token" },
      body.days ?? 7,
    );
    const result = await cacheDistanceSamples(
      me.id,
      samples.map((s) => ({
        date: s.date,
        distanceKm: s.distanceKm,
        source: "gps",
        activityType: "walk",
      })),
    );
    written = result.written;
  }

  if (body.provider === "health_connect" && body.records) {
    const normalised = normaliseHealthConnectBatch(body.records);
    const result = await cacheDistanceSamples(
      me.id,
      normalised.map((s) => ({
        date: s.date,
        distanceKm: s.distanceKm,
        source: "gps",
        activityType: "walk",
      })),
    );
    written = result.written;
  }

  if (body.provider === "manual" && body.samples) {
    const result = await cacheDistanceSamples(
      me.id,
      body.samples.map((s) => ({
        ...s,
        source: "manual",
        activityType: "walk",
      })),
    );
    written = result.written;
  }

  const summary = await getDistanceSummary(me.id, body.days ?? 7);

  return json({
    ok: true,
    written,
    summary,
  });
});

/** GET /api/health/sync — return recent distance summary */
export const GET = route(async (req: Request) => {
  const me = await requireUser();
  const days = Number(new URL(req.url).searchParams.get("days") || 7);
  const summary = await getDistanceSummary(me.id, Math.min(Math.max(days, 1), 30));
  return json(summary);
});
