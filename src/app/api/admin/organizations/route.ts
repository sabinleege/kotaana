import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
// In-memory orgs for now
import { listUserOrganizations } from "@/lib/orgs";

export const GET = route(async () => {
  await requireRole("admin");
  // Scaffold: return empty until Prisma Organization model is migrated
  return json({ organizations: [] });
});
