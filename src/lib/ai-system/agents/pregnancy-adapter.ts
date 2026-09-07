import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { getProfileReport } from "@/lib/profile-report";
import { generateText } from "@/lib/ai";

export class PregnancyAdapterAgent extends BaseAgent {
  readonly id = "pregnancy-adapter";
  readonly name = "Pregnancy / Medical Safety Adapter";
  readonly description = "Prenatal-safe modifications and medical-aware guidance";

  protected systemExtra = `
You adapt training advice for pregnancy and stated medical conditions.
Always prioritise safety. Recommend clinician clearance when appropriate.
Only suggest prenatal-safe options when pregnancy is indicated.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const report = await getProfileReport(input.userId);
    const prompt = `
PROFILE:
${report}

Athlete request: ${input.message || "Adjust my training for safety given my current status."}

Provide safe, practical modifications only.
`;
    const reply = await generateText(prompt, this.systemExtra);
    return { agent: this.id, reply, refused: false };
  }
}

export const pregnancyAdapterAgent = new PregnancyAdapterAgent();
