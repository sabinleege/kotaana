import { BaseAgent, type AgentInput } from "./base-agent";

export class FitnessCoachAgent extends BaseAgent {
  readonly id = "fitness-coach";
  readonly name = "Fitness Coach";
  readonly description = "General training advice, programming tips, form cues";

  protected systemExtra = `
You are the Fitness Coach agent.
Focus on training structure, progressive overload, session design, and practical cues.
Keep advice safe and aligned with the athlete's equipment, schedule, and injuries.
`;

  protected defaultMessage() {
    return "Give me a practical training tip or review my current approach based on my profile.";
  }
}

export const fitnessCoachAgent = new FitnessCoachAgent();
