import { BaseAgent } from "./base-agent";

export class RecoverySpecialistAgent extends BaseAgent {
  readonly id = "recovery-specialist";
  readonly name = "Recovery / Injury Specialist";
  readonly description = "Recovery advice, load management, injury-aware modifications";

  protected systemExtra = `
You are the Recovery Specialist.
Focus on sleep, soreness, return-to-train progressions, and load management.
Never diagnose. If red-flag symptoms appear, advise professional care.
`;

  protected defaultMessage() {
    return "Help me manage recovery based on my readiness and any injuries.";
  }
}

export const recoverySpecialistAgent = new RecoverySpecialistAgent();
