import { BaseAgent } from "./base-agent";

export class CoachAssistantAgent extends BaseAgent {
  readonly id = "coach-assistant";
  readonly name = "Coach Assistant Agent";
  readonly description = "Helps human coaches draft notes, follow-ups, and session plans";

  protected systemExtra = `
You assist human coaches.
Draft concise notes, follow-up questions, and session outlines.
Do not replace the coach's judgment. Stay professional and supportive.
`;

  protected defaultMessage() {
    return "Draft a short coach note and one follow-up question for this athlete.";
  }
}

export const coachAssistantAgent = new CoachAssistantAgent();
