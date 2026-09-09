// AI calls take 15-30s; without this Vercel kills the function before it can
// answer and the caller receives nothing at all.
export const maxDuration = 60;

/**
 * GET /api/ai/agents — list all agents
 * POST /api/ai/agents — auto-route { message, history?, payload? }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { guardAi } from "@/lib/rate-limit";
import { route, json } from "@/lib/api";
import { listAgents, routeAgentId, runAgent } from "@/lib/ai-system/agents/registry";
import { prisma } from "@/lib/db";

export const GET = route(async () => {
  await requireUser();
  return json({ agents: listAgents() });
});

const schema = z.object({
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
  payload: z.record(z.unknown()).optional(),
  agent: z.string().optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  
  const body = schema.parse(await req.json());
  const agentId = body.agent || routeAgentId(body.message);

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

  return json({ ...result, routedTo: agentId });
});
