/**
 * Kotaana AI public surface — providers stay internal.
 */
export { aiGenerate, aiGenerateText, aiGenerateJson, aiGenerateVisionJson } from "./router";
export { AI_MODELS, TASK_TO_ROLE, roleForTask } from "./models";
export type { AITask, AIResult, GenerateOptions, ImageInput } from "./types";
export { AiNotConfiguredError } from "./errors";
export { buildAthleteContext } from "./context/builder";
export { MEDICAL_DISCLAIMER, appendMedicalSafety } from "./validation/safety";
