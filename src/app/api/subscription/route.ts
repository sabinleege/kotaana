import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/subscription — current user's subscription
export const GET = route(async () => {
  const me = await requireUser();
  const sub = await prisma.subscription.findUnique({ where: { userId: me.id } });
  return json(sub ? toSnake(sub) : null);
});

const patchSchema = z.object({
  plan_type: z.string().optional(),
  status: z.string().optional(),
  seat_limit: z.number().int().nullable().optional(),
  covers_athletes: z.boolean().optional(),
  current_period_end: z.string().nullable().optional(),
});

// PATCH /api/subscription — upsert current user's subscription
export const PATCH = route(async (req: Request) => {
  const me = await requireUser();
  const patch = patchSchema.parse(await req.json());
  const data = {
    planType: patch.plan_type,
    status: patch.status,
    seatLimit: patch.seat_limit,
    coversAthletes: patch.covers_athletes,
    currentPeriodEnd:
      patch.current_period_end === undefined
        ? undefined
        : patch.current_period_end
          ? new Date(patch.current_period_end)
          : null,
  };

  const sub = await prisma.subscription.upsert({
    where: { userId: me.id },
    update: data,
    create: {
      userId: me.id,
      planType: patch.plan_type ?? "free",
      status: patch.status ?? "inactive",
      seatLimit: patch.seat_limit ?? null,
      coversAthletes: patch.covers_athletes ?? false,
    },
  });
  return json(toSnake(sub));
});
