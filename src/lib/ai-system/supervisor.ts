/**
 * Simple AI supervisor — picks an agent and runs it.
 */

import { routeAgentId, runAgent, listAgents } from "./agents/registry";
import type { AgentInput, AgentResult } from "./agents/base-agent";

export async function supervise(input: AgentInput & { agent?: string }): Promise<AgentResult & { routedTo: string }> {
  const routedTo = input.agent || routeAgentId(input.message || "");
  const result = await runAgent(routedTo, input);
  return { ...result, routedTo };
}

export { listAgents };
