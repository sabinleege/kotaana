import type { AIResult, GenerateOptions, ModelRole } from "./types";
import { modelForRole, roleForTask } from "./models";
import { geminiGenerate } from "./providers/gemini";
import { openrouterGenerate } from "./providers/openrouter";
import { fallbackChain } from "./fallback";
import { parseJsonLoose } from "./validation/validator";
import { AI_TOTAL_BUDGET_MS } from "./limits";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callProvider(
  provider: "gemini" | "openrouter",
  model: string,
  opts: GenerateOptions,
) {
  if (provider === "gemini") {
    return geminiGenerate({
      model,
      prompt: opts.prompt,
      system: opts.system,
      json: opts.json,
      images: opts.images,
    });
  }
  return openrouterGenerate({
    model,
    prompt: opts.prompt,
    system: opts.system,
    json: opts.json,
    images: opts.images,
  });
}

/**
 * Central AI Router — all Kotaana AI goes through here.
 * Callers never pick Gemini vs OpenRouter or model IDs.
 */
export async function aiGenerate(opts: GenerateOptions): Promise<AIResult> {
  const role: ModelRole = opts.role || roleForTask(opts.task);
  const chain = fallbackChain(role);
  const tried = new Set<string>();
  let lastError: Error | null = null;
  let fallbackUsed = false;

  // The chain can be four models deep and each call takes 15-30s, which is far
  // more than a serverless function is allowed. Stop starting new attempts once
  // the budget is spent so the handler can still return an error — being killed
  // mid-call is what leaves the user staring at a plan that never arrives.
  const deadline = Date.now() + AI_TOTAL_BUDGET_MS;
  const outOfTime = () => Date.now() > deadline - 2_000;

  for (let i = 0; i < chain.length; i++) {
    if (outOfTime()) {
      lastError = lastError ?? new Error(`AI budget of ${AI_TOTAL_BUDGET_MS}ms exhausted`);
      break;
    }
    const r = chain[i];
    const cfg = modelForRole(r);
    const key = `${cfg.provider}:${cfg.model}`;
    if (tried.has(key)) continue;
    tried.add(key);
    if (i > 0) fallbackUsed = true;

    // Vision needs multimodal — skip openrouter models without images support attempt still ok
    if (opts.images?.length && cfg.provider === "openrouter" && r !== "vision" && r !== "fallback") {
      // still try; openrouter supports image_url on many models
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      if (outOfTime()) break;
      try {
        const out = await callProvider(cfg.provider, cfg.model, opts);
        return {
          success: true,
          text: out.text,
          model: cfg.model,
          provider: cfg.provider,
          task: opts.task,
          usage: out.usage,
          fallbackUsed,
        };
      } catch (e: any) {
        lastError = e instanceof Error ? e : new Error(String(e));
        // backoff on rate limit
        if (/429|rate/i.test(lastError.message)) await sleep(400 * (attempt + 1));
        else break;
      }
    }
  }

  return {
    success: false,
    model: "none",
    provider: "gemini",
    task: opts.task,
    error: {
      code: "AI_FAILED",
      message: lastError?.message || "All AI providers failed",
    },
    fallbackUsed,
  };
}

export async function aiGenerateText(
  task: GenerateOptions["task"],
  prompt: string,
  system?: string,
): Promise<string> {
  const r = await aiGenerate({ task, prompt, system, json: false });
  if (!r.success || !r.text) throw new Error(r.error?.message || "AI text failed");
  return r.text;
}

export async function aiGenerateJson<T>(
  task: GenerateOptions["task"],
  prompt: string,
  system?: string,
): Promise<T> {
  const r = await aiGenerate({ task, prompt, system, json: true });
  if (!r.success || !r.text) throw new Error(r.error?.message || "AI JSON failed");
  return parseJsonLoose<T>(r.text);
}

export async function aiGenerateVisionJson<T>(
  task: GenerateOptions["task"],
  prompt: string,
  images: GenerateOptions["images"],
  system?: string,
): Promise<T> {
  const r = await aiGenerate({
    task,
    prompt,
    system,
    images,
    json: true,
    role: "vision",
  });
  if (!r.success || !r.text) throw new Error(r.error?.message || "AI vision failed");
  return parseJsonLoose<T>(r.text);
}
