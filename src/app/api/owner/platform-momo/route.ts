/**
 * Owner/admin sets platform MoMo — then athletes & coaches see it on pay screens.
 */
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getPlatformMomo, setPlatformMomo } from "@/lib/payments/platform";

export const GET = route(async () => {
  await requireRole("admin");
  return json(await getPlatformMomo());
});

const schema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(1).max(80),
  instructions: z.string().max(500).optional(),
});

export const PATCH = route(async (req: Request) => {
  await requireRole("admin");
  const body = schema.parse(await req.json());
  const momo = await setPlatformMomo(body);
  return json({ ok: true, momo });
});
