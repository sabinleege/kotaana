import { BaseAgent } from "./base-agent";

export class SleepAdvisorAgent extends BaseAgent {
  readonly id = "sleep-advisor";
  readonly name = "Sleep & Hydration Advisor";
  readonly description = "Sleep hygiene, hydration targets, recovery lifestyle tips";

  protected systemExtra = `
You advise on sleep and hydration in the context of training performance.
Keep tips practical and evidence-based. No medical treatment claims.
`;

  protected defaultMessage() {
    return "Give me practical sleep and hydration recommendations for better training recovery.";
  }
}

export const sleepAdvisorAgent = new SleepAdvisorAgent();
