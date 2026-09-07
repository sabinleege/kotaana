/**
 * POST /api/coach/follow-ups
 * Creates FollowUp + Notification so the athlete sees it in their app.
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, assertManages } from "@/lib/coach/access";
import { prisma } from "@/lib/db";

const schema = z.object({
  athleteId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  dueDate: z.string().optional(),
  notifyAthlete: z.boolean().default(true),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await requireCoach(me.id);
  const body = schema.parse(await req.json());
  await assertManages(me.id, body.athleteId);

  const followUp = await prisma.followUp.create({
    data: {
      coachId: me.id,
      athleteId: body.athleteId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: "pending",
    },
  });

  if (body.notifyAthlete) {
    await prisma.notification.create({
      data: {
        userId: body.athleteId,
        title: "Message from your coach",
        message: body.description || body.title,
        type: "coach_followup",
        data: { followUpId: followUp.id, coachId: me.id },
      },
    });
  }

  return json({ followUp }, 201);
});
