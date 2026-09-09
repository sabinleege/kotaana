import type { AITask, ModelRole } from "./types";

/** Central model registry — override via env without code changes. */
export const AI_MODELS = {
  // Google retired the 2.5 line for new API keys — both previous defaults
  // returned 404 "no longer available to new users", which made every AI call
  // fall through to OpenRouter and fail there too. Verified working against the
  // live /v1beta/models list, including a real image round-trip for vision.
  everyday: {
    provider: "gemini" as const,
    model: process.env.AI_EVERYDAY_MODEL || "gemini-3.5-flash-lite",
  },
  vision: {
    provider: "gemini" as const,
    model: process.env.AI_VISION_MODEL || "gemini-3.5-flash",
  },
  // Verified against OpenRouter's live catalog. Two previous defaults were dead:
  // nemotron-3-ultra-550b returned only keep-alive whitespace and no completion
  // ("OpenRouter returned empty response"), and deepseek-r1-0528 is no longer
  // listed at all. Re-check with /api/v1/models before changing these.
  agent: {
    provider: "openrouter" as const,
    model: process.env.AI_AGENT_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
  },
  reasoning: {
    provider: "openrouter" as const,
    model: process.env.AI_REASONING_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  },
  long_context: {
    provider: "openrouter" as const,
    model:
      process.env.AI_LONG_CONTEXT_MODEL ||
      process.env.AI_AGENT_MODEL ||
      "nvidia/nemotron-3-super-120b-a12b:free",
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
