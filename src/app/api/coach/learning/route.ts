import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, assertManages } from "@/lib/coach/access";
import { recordCoachCorrection } from "@/lib/coach/learning";

const schema = z.object({
  athleteId: z.string(),
  context: z.string().min(1).max(300),
  correction: z.string().min(1).max(1000),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await requireCoach(me.id);
  const body = schema.parse(await req.json());
  await assertManages(me.id, body.athleteId);
  const note = await recordCoachCorrection({
    coachId: me.id,
    athleteId: body.athleteId,
    context: body.context,
    correction: body.correction,
  });
  return json({ note }, 201);
});
