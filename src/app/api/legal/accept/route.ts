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
  const accepted = {
    tosAccepted: true, tosAcceptedAt: now,
    medicalDisclaimerAccepted: true, medicalDisclaimerAcceptedAt: now,
    ...(data ? { dataConsent: true, dataConsentAt: now } : {}),
  };
  // upsert, not update — an account created without a Profile (e.g. the first
  // owner) must still be able to accept and get through the gate.
  await prisma.profile.upsert({
    where: { userId: me.id },
    update: accepted,
    create: { userId: me.id, fullName: me.name ?? "", email: me.email ?? "", ...accepted },
  });
  return json({ ok: true });
});
