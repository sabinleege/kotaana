/**
 * Agent registry + router
 */

import type { BaseAgent, AgentInput, AgentResult } from "./base-agent";
import { fitnessCoachAgent } from "./fitness-coach";
import { athleteAnalyzerAgent } from "./athlete-analyzer";
import { workoutGeneratorAgent } from "./workout-generator";
import { nutritionCoachAgent } from "./nutrition-coach";
import { recoverySpecialistAgent } from "./recovery-specialist";
import { pregnancyAdapterAgent } from "./pregnancy-adapter";
import { sleepAdvisorAgent } from "./sleep-advisor";
import { performanceForecasterAgent } from "./performance-forecaster";
import { coachAssistantAgent } from "./coach-assistant";
import { photoAnalyzerAgent } from "./photo-analyzer";
import { monthlyComparisonAgent } from "./monthly-comparison";
import { summarizerAgent } from "./summarizer";

const AGENTS: BaseAgent[] = [
  fitnessCoachAgent,
  athleteAnalyzerAgent,
  workoutGeneratorAgent,
  nutritionCoachAgent,
  recoverySpecialistAgent,
  pregnancyAdapterAgent,
  sleepAdvisorAgent,
  performanceForecasterAgent,
  coachAssistantAgent,
  photoAnalyzerAgent,
  monthlyComparisonAgent,
  summarizerAgent,
];

const BY_ID = new Map(AGENTS.map((a) => [a.id, a]));

export function listAgents() {
  return AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
  }));
}

export function getAgent(id: string): BaseAgent | undefined {
  return BY_ID.get(id);
}

export async function runAgent(id: string, input: AgentInput): Promise<AgentResult> {
  const agent = getAgent(id);
  if (!agent) {
    return {
      agent: id,
      reply: `Unknown agent: ${id}`,
      refused: true,
    };
  }
  return agent.run(input);
}

/** Very simple keyword router when client doesn't pick an agent */
export function routeAgentId(message: string): string {
  const m = message.toLowerCase();
  if (/pregnant|prenatal|medical condition/.test(m)) return "pregnancy-adapter";
  if (/meal|nutrition|protein|calories|diet/.test(m)) return "nutrition-coach";
  if (/sleep|hydrat|water/.test(m)) return "sleep-advisor";
  if (/injur|sore|recover|pain/.test(m)) return "recovery-specialist";
  if (/workout|program|plan|exercise|sets|reps/.test(m)) return "workout-generator";
  if (/photo|form|compare|comparison/.test(m)) return "photo-analyzer";
  if (/forecast|predict|progress outlook/.test(m)) return "performance-forecaster";
  if (/analyze|analysis|adherence|readiness/.test(m)) return "athlete-analyzer";
  if (/summary|report|briefing/.test(m)) return "summarizer";
  if (/coach note|follow-up|session outline/.test(m)) return "coach-assistant";
  return "fitness-coach";
}
