import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";

const schema = z.object({
  tos: z.boolean(),
  medical: z.boolean(),
  data: z.boolean().optional(),
});

// POST /api/legal/accept — record acceptance of terms + medical disclaimer.
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { tos, medical, data } = schema.parse(await req.json());
  if (!tos || !medical) return json({ error: "You must accept the Terms and the Medical Disclaimer to continue." }, 400);

  const now = new Date();
  await prisma.profile.update({
    where: { userId: me.id },
    data: {
      tosAccepted: true, tosAcceptedAt: now,
      medicalDisclaimerAccepted: true, medicalDisclaimerAcceptedAt: now,
      ...(data ? { dataConsent: true, dataConsentAt: now } : {}),
    },
  });
  return json({ ok: true });
});
