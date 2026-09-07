/**
 * Base agent contract shared by all specialized agents.
 */

import { generateText, generateJson } from "@/lib/ai";
import { buildContext, type ChatMessage } from "@/lib/ai-system/context-builder";
import { getProfileReport } from "@/lib/profile-report";

export type AgentInput = {
  userId: string;
  message?: string;
  history?: ChatMessage[];
  payload?: Record<string, unknown>;
};

export type AgentResult = {
  agent: string;
  reply?: string;
  data?: unknown;
  refused?: boolean;
  retrieved?: string[];
};

export abstract class BaseAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  /** Optional system prompt override for this agent */
  protected systemExtra = "";

  async run(input: AgentInput): Promise<AgentResult> {
    const profileReport = await getProfileReport(input.userId);
    const message = input.message || this.defaultMessage(input);

    const ctx = await buildContext({
      message,
      history: input.history,
      profileReport,
    });

    if (!ctx.allowed) {
      return {
        agent: this.id,
        reply: ctx.refusal,
        refused: true,
      };
    }

    const system = [ctx.systemPrompt, this.systemExtra].filter(Boolean).join("\n\n");
    const reply = await generateText(ctx.userPrompt, system);

    return {
      agent: this.id,
      reply,
      refused: false,
      retrieved: ctx.retrievedTitles,
    };
  }

  protected defaultMessage(_input: AgentInput): string {
    return "Provide helpful coaching guidance based on the athlete profile.";
  }

  protected async runJson<T>(prompt: string, system?: string): Promise<T> {
    return generateJson<T>(prompt, system);
  }
}
