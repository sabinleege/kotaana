/**
 * Compatibility facade over the multi-model AI Router.
 * Existing routes import generateText/generateJson/generateJsonFromImage from here.
 */
import {
  aiGenerateText,
  aiGenerateJson,
  aiGenerateVisionJson,
} from "./ai/router";
import { AiNotConfiguredError } from "./ai/errors";
import type { ImageInput } from "./ai/types";
import { AuthError } from "@/lib/authz";

export { AiNotConfiguredError, AuthError };
export type { ImageInput };

export function generateText(prompt: string, system?: string): Promise<string> {
  return aiGenerateText("simple_chat", prompt, system);
}

export async function generateJson<T>(prompt: string, system?: string): Promise<T> {
  const blob = `${system || ""} ${prompt}`.toLowerCase();
  let task: Parameters<typeof aiGenerateJson>[0] = "workout_generation";
  if (/meal|nutrition|calorie|food/.test(blob)) task = "nutrition";
  else if (/risk|injury|overtrain/.test(blob)) task = "risk_analysis";
  else if (/goal|plan week/.test(blob)) task = "goal_planning";
  else if (/reason|complex|analy/.test(blob)) task = "complex_reasoning";
  return aiGenerateJson<T>(task, prompt, system);
}

export async function generateJsonFromImage<T>(
  prompt: string,
  images: ImageInput | ImageInput[],
  system?: string,
): Promise<T> {
  const arr = Array.isArray(images) ? images : [images];
  const blob = `${system || ""} ${prompt}`.toLowerCase();
  let task: Parameters<typeof aiGenerateVisionJson>[0] = "meal_vision";
  if (/progress|compare|body/.test(blob)) task = "progress_photo";
  else if (/medical|scan|x-?ray|mri|document/.test(blob)) task = "medical_document";
  return aiGenerateVisionJson<T>(task, prompt, arr, system);
}
