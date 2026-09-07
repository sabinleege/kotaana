import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { getProfileReport } from "@/lib/profile-report";

export class AthleteAnalyzerAgent extends BaseAgent {
  readonly id = "athlete-analyzer";
  readonly name = "Athlete Analyzer";
  readonly description = "Summarise adherence, readiness, risks, and focus areas";

  protected systemExtra = `
You are the Athlete Analyzer.
Produce a clear structured analysis: strengths, risks, focus for next 7 days.
Be concise and actionable. Never diagnose medical conditions.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const report = await getProfileReport(input.userId);
    const prompt = `
Analyze this athlete and return:
1) Key strengths
2) Main risks / bottlenecks
3) Top 3 focus points for the next week
4) One sentence coach summary

PROFILE:
${report}

Extra context: ${input.message || "none"}
`;
    const reply = await this.runJson<{
      strengths?: string[];
      risks?: string[];
      focus?: string[];
      summary?: string;
    }>(prompt, this.systemExtra).then(
      (data) =>
        `**Summary:** ${data.summary || "—"}\n\n**Strengths:** ${(data.strengths || []).join("; ")}\n**Risks:** ${(data.risks || []).join("; ")}\n**Focus:** ${(data.focus || []).join("; ")}`,
      async () => {
        // fallback plain text
        const { generateText } = await import("@/lib/ai");
        return generateText(prompt, this.systemExtra);
      },
    );

    return { agent: this.id, reply, refused: false };
  }
}

export const athleteAnalyzerAgent = new AthleteAnalyzerAgent();
