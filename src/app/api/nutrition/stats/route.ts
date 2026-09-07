import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { nutritionWeekStats } from "@/lib/nutrition/adherence";

export const GET = route(async () => {
  const me = await requireUser();
  const stats = await nutritionWeekStats(me.id);
  return json({ stats });
});
