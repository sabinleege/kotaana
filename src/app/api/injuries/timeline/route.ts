import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ensureInjuryTimeline, currentWeekIndex } from "@/lib/injury/timeline";

const schema = z.object({ injuryId: z.string() });

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { injuryId } = schema.parse(await req.json());
  const injury = await prisma.injury.findFirst({
    where: { id: injuryId, athleteId: me.id },
  });
  if (!injury) return json({ error: "Not found" }, 404);
  const updated = await ensureInjuryTimeline(injuryId);
  const timeline = (updated?.recoveryTimeline as any[]) || [];
  const current = updated ? currentWeekIndex(updated.dateReported, timeline as any) : null;
  return json({ injury: updated, currentWeek: current });
});
