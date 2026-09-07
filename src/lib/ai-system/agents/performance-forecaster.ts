import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { getProfileReport } from "@/lib/profile-report";
import { generateText } from "@/lib/ai";

export class PerformanceForecasterAgent extends BaseAgent {
  readonly id = "performance-forecaster";
  readonly name = "Performance Forecaster";
  readonly description = "Trend-based outlook and realistic progress expectations";

  protected systemExtra = `
You forecast realistic progress based on adherence, training load, and goals.
Be honest about uncertainty. Avoid guarantees.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const report = await getProfileReport(input.userId);
    const prompt = `
Based on this profile, give a realistic 4-week outlook:
- Likely progress if adherence stays similar
- What would accelerate results
- What would stall results

PROFILE:
${report}

Extra: ${input.message || ""}
`;
    const reply = await generateText(prompt, this.systemExtra);
    return { agent: this.id, reply, refused: false };
  }
}

export const performanceForecasterAgent = new PerformanceForecasterAgent();
