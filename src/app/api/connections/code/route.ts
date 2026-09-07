import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getOrCreateConnectCode } from "@/lib/connections";

// GET /api/connections/code — the current user's personal connect code (created on first use).
export const GET = route(async () => {
  const me = await requireUser();
  const code = await getOrCreateConnectCode(me.id);
  return json({ code });
});
