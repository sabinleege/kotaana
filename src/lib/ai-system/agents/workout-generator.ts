import { BaseAgent, type AgentInput, type AgentResult } from "./base-agent";
import { getProfileReport } from "@/lib/profile-report";
import { generateJson } from "@/lib/ai";

export class WorkoutGeneratorAgent extends BaseAgent {
  readonly id = "workout-generator";
  readonly name = "Workout & Progress Generator";
  readonly description = "Generate structured workout plans grounded in profile";

  protected systemExtra = `
You generate safe, structured workout plans as JSON.
Respect injuries, pregnancy, equipment, and training days.
`;

  async run(input: AgentInput): Promise<AgentResult> {
    const report = await getProfileReport(input.userId);
    const days = Number(input.payload?.days || 3);

    const prompt = `
Create a ${days}-day workout plan for this athlete.
Return JSON: { "days": [ { "day": 1, "title": "", "focus": "", "exercises": [ { "name": "", "sets": 3, "reps": "8-12", "notes": "" } ] } ], "notes": "" }

PROFILE:
${report}

Request: ${input.message || "balanced full-body plan"}
`;

    try {
      const data = await generateJson(prompt, this.systemExtra);
      return {
        agent: this.id,
        reply: "Workout plan generated.",
        data,
        refused: false,
      };
    } catch {
      return super.run({
        ...input,
        message: input.message || `Design a practical ${days}-day workout plan for me.`,
      });
    }
  }
}

export const workoutGeneratorAgent = new WorkoutGeneratorAgent();
