import type { AITask, ModelRole } from "./types";

/** Central model registry — override via env without code changes. */
export const AI_MODELS = {
  everyday: {
    provider: "gemini" as const,
    model: process.env.AI_EVERYDAY_MODEL || "gemini-2.5-flash-lite",
  },
  vision: {
    provider: "gemini" as const,
    model: process.env.AI_VISION_MODEL || "gemini-2.5-flash",
  },
  agent: {
    provider: "openrouter" as const,
    model: process.env.AI_AGENT_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
  },
  reasoning: {
    provider: "openrouter" as const,
    model: process.env.AI_REASONING_MODEL || "deepseek/deepseek-r1-0528:free",
  },
  long_context: {
    provider: "openrouter" as const,
    model: process.env.AI_LONG_CONTEXT_MODEL || process.env.AI_AGENT_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
  },
  fallback: {
    provider: "openrouter" as const,
    model: process.env.AI_FALLBACK_MODEL || "google/gemma-4-26b-a4b-it:free",
  },
};

export const TASK_TO_ROLE: Record<AITask, ModelRole> = {
  simple_chat: "everyday",
  summary: "everyday",
  nutrition: "everyday",
  workout_adjustment: "everyday",
  meal_vision: "vision",
  document_vision: "vision",
  progress_photo: "vision",
  medical_document: "vision",
  workout_generation: "agent",
  goal_planning: "agent",
  agent: "agent",
  daily_report: "agent",
  long_context_analysis: "long_context",
  complex_reasoning: "reasoning",
  risk_analysis: "reasoning",
};

export function roleForTask(task: AITask): ModelRole {
  return TASK_TO_ROLE[task] || "everyday";
}

export function modelForRole(role: ModelRole) {
  return AI_MODELS[role] || AI_MODELS.everyday;
}
