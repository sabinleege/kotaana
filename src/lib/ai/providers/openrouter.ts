import type { ImageInput } from "../types";
import { AiNotConfiguredError } from "@/lib/ai/errors";

export async function openrouterGenerate(opts: {
  model: string;
  prompt: string;
  system?: string;
  json?: boolean;
  images?: ImageInput[];
}): Promise<{ text: string; usage?: { inputTokens?: number; outputTokens?: number } }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AiNotConfiguredError("OPENROUTER_API_KEY");

  const content: unknown[] = [{ type: "text", text: opts.prompt }];
  for (const img of opts.images ?? []) {
    const url = img.base64.startsWith("data:")
      ? img.base64
      : `data:${img.mimeType};base64,${img.base64}`;
    content.push({ type: "image_url", image_url: { url } });
  }

  const messages: { role: string; content: unknown }[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.images?.length ? content : opts.prompt });

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://kotaana.app",
      "X-Title": "Kotaana",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${opts.model} failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim?.() || "";
  if (!text) throw new Error("OpenRouter returned empty response");
  return {
    text,
    usage: {
      inputTokens: data?.usage?.prompt_tokens,
      outputTokens: data?.usage?.completion_tokens,
    },
  };
}
