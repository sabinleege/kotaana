import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { generateJsonFromImage } from "@/lib/ai";

export class PhotoAnalyzerAgent extends BaseAgent {
  readonly id = "photo-analyzer";
  readonly name = "Form & Progress Photo Analyzer";
  readonly description = "Analyze progress photos or form stills with vision";

  protected systemExtra = `
You analyze fitness progress photos.
Comment on visible changes carefully. Never claim medical findings.
Be respectful and encouraging.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const images = input.payload?.images as
      | { base64: string; mimeType: string }[]
      | undefined;

    if (!images?.length) {
      return super.run({
        ...input,
        message:
          input.message ||
          "Explain how progress photo comparison works and what to look for.",
      });
    }

    const prompt = `
Analyze these progress photos. Return JSON:
{ "summary": "", "observations": [], "suggestions": [], "caveats": [] }
${input.message || ""}
`;

    try {
      const data = await generateJsonFromImage(prompt, images, this.systemExtra);
      return { agent: this.id, reply: "Photo analysis complete.", data, refused: false };
    } catch (err) {
      return {
        agent: this.id,
        reply: err instanceof Error ? err.message : "Photo analysis failed",
        refused: false,
      };
    }
  }
}

export const photoAnalyzerAgent = new PhotoAnalyzerAgent();
