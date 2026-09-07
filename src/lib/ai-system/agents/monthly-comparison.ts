import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { generateJsonFromImage } from "@/lib/ai";

export class MonthlyComparisonAgent extends BaseAgent {
  readonly id = "monthly-comparison";
  readonly name = "Monthly Progress Comparison Agent";
  readonly description = "Compare monthly front/side/back photos";

  protected systemExtra = `
Compare before/after fitness photos month over month.
Be cautious, non-judgmental, and practical. No body-shaming.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const before = input.payload?.before as { base64: string; mimeType: string }[] | undefined;
    const after = input.payload?.after as { base64: string; mimeType: string }[] | undefined;

    if (!before?.length || !after?.length) {
      return super.run({
        ...input,
        message:
          input.message ||
          "Explain how a monthly front/side/back comparison should be interpreted.",
      });
    }

    const images = [...before, ...after];
    const prompt = `
These images are before then after progress photos.
Return JSON: { "changes": [], "consistentPositives": [], "focusNextMonth": [], "summary": "" }
`;

    try {
      const data = await generateJsonFromImage(prompt, images, this.systemExtra);
      return { agent: this.id, reply: "Monthly comparison complete.", data, refused: false };
    } catch (err) {
      return {
        agent: this.id,
        reply: err instanceof Error ? err.message : "Comparison failed",
        refused: false,
      };
    }
  }
}

export const monthlyComparisonAgent = new MonthlyComparisonAgent();
