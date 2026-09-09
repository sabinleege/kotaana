// AI calls take 15-30s; without this Vercel kills the function before it can
// answer and the caller receives nothing at all.
export const maxDuration = 60;

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { guardAi } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { generateText } from "@/lib/ai";
import { getProfileReport } from "@/lib/profile-report";
import { getAiMemoryContext } from "@/lib/memory/weekly-summary";
import { pregnancySystemAddon, getPregnancyContext } from "@/lib/pregnancy/workflow";
import { buildContext } from "@/lib/ai-system/context-builder";

const schema = z.object({
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

/** POST /api/ai/chat — scope guard + RAG + profile report + Gemini */
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const { message, history = [] } = schema.parse(await req.json());

  const profileReport = await getProfileReport(me.id);
  const memory = await getAiMemoryContext(me.id);
  const profile = await prisma.profile.findUnique({ where: { userId: me.id }, select: { isPregnant: true, pregnancyDueDate: true } });
  const preg = getPregnancyContext({ isPregnant: profile?.isPregnant, pregnancyDueDate: profile?.pregnancyDueDate });
  const ctx = await buildContext({ message, history, profileReport: memory + pregnancySystemAddon(preg) });

  if (!ctx.allowed) {
    return json({ reply: ctx.refusal, refused: true });
  }

  const started = Date.now();
  const reply = await generateText(ctx.userPrompt, ctx.systemPrompt);

  await prisma.aiUsage
    .create({
      data: {
        userId: me.id,
        functionName: "chat",
        status: "success",
        durationMs: Date.now() - started,
      },
    })
    .catch(() => {});

  return json({
    reply,
    refused: false,
    retrieved: ctx.retrievedTitles,
  });
});
