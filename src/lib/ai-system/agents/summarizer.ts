import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { getProfileReport } from "@/lib/profile-report";
import { generateText } from "@/lib/ai";

export class SummarizerAgent extends BaseAgent {
  readonly id = "summarizer";
  readonly name = "Summarizer & Report Generator";
  readonly description = "Compact reports for athlete or coach";

  protected systemExtra = `
Produce short, structured reports suitable for dashboards or coach briefings.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const report = await getProfileReport(input.userId);
    const audience = String(input.payload?.audience || "athlete");
    const prompt = `
Write a brief ${audience}-facing report from this profile.
Use short sections. Max ~150 words.

PROFILE:
${report}

Focus: ${input.message || "overall status"}
`;
    const reply = await generateText(prompt, this.systemExtra);
    return { agent: this.id, reply, refused: false };
  }
}

export const summarizerAgent = new SummarizerAgent();
