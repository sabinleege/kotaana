// AI calls take 15-30s; without this Vercel kills the function before it can
// answer and the caller receives nothing at all.
export const maxDuration = 60;

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { analyzeMedicalDocument } from "@/lib/medical/document-ai";
import { guardAi } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const schema = z.object({
  docType: z.enum(["ct", "mri", "xray", "blood", "other"]),
  title: z.string().optional(),
  fileUrl: z.string().min(1),
  ocrText: z.string().optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const body = schema.parse(await req.json());
  const doc = await analyzeMedicalDocument({ userId: me.id, ...body });
  return json({ document: doc }, 201);
});

export const GET = route(async () => {
  const me = await requireUser();
  const documents = await prisma.medicalDocument.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return json({ documents });
});
