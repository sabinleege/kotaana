/**
 * POST /api/ai/agents/:agent
 * Body: { message?, history?, payload? }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { guardAi } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { getAgent, listAgents, runAgent } from "@/lib/ai-system/agents/registry";
import { prisma } from "@/lib/db";

const schema = z.object({
  message: z.string().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
  payload: z.record(z.unknown()).optional(),
});

export const GET = route(async (_req: Request, ctx: { params: Promise<{ agent: string }> }) => {
  await requireUser();
  const { agent } = await ctx.params;
  if (agent === "list") {
    return json({ agents: listAgents() });
  }
  const a = getAgent(agent);
  if (!a) return json({ error: "Unknown agent", agents: listAgents() }, 404);
  return json({ id: a.id, name: a.name, description: a.description });
});

export const POST = route(async (req: Request, ctx: { params: Promise<{ agent: string }> }) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  
  const { agent: agentId } = await ctx.params;
  const body = schema.parse(await req.json().catch(() => ({})));

  const started = Date.now();
  const result = await runAgent(agentId, {
    userId: me.id,
    message: body.message,
    history: body.history,
    payload: body.payload,
  });

  await prisma.aiUsage
    .create({
      data: {
        userId: me.id,
        functionName: `agent:${agentId}`,
        status: result.refused ? "refused" : "success",
        durationMs: Date.now() - started,
      },
    })
    .catch(() => {});

  return json(result);
});
