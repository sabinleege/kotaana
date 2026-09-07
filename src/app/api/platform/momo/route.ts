/**
 * GET — any logged-in athlete/coach/owner can see platform MoMo to pay the app.
 */
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getPlatformMomo } from "@/lib/payments/platform";

export const GET = route(async () => {
  await requireUser();
  const momo = await getPlatformMomo();
  return json(momo);
});
