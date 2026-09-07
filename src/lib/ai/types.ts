export type AIProviderName = "gemini" | "openrouter";

export type AITask =
  | "simple_chat"
  | "workout_generation"
  | "workout_adjustment"
  | "nutrition"
  | "meal_vision"
  | "document_vision"
  | "progress_photo"
  | "medical_document"
  | "risk_analysis"
  | "goal_planning"
  | "long_context_analysis"
  | "complex_reasoning"
  | "agent"
  | "summary"
  | "daily_report";

export type ModelRole = "everyday" | "vision" | "agent" | "reasoning" | "fallback" | "long_context";

export type ImageInput = { base64: string; mimeType: string };

export type GenerateOptions = {
  task: AITask;
  prompt: string;
  system?: string;
  images?: ImageInput[];
  json?: boolean;
  /** Prefer a role override */
  role?: ModelRole;
  temperature?: number;
  maxTokens?: number;
};

export type AIResult<T = unknown> = {
  success: boolean;
  data?: T;
  text?: string;
  model: string;
  provider: AIProviderName;
  task: AITask;
  usage?: { inputTokens?: number; outputTokens?: number };
  error?: { code: string; message: string };
  fallbackUsed?: boolean;
};
