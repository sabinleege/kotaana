import type { ImageInput } from "../types";
import { AiNotConfiguredError } from "@/lib/ai/errors";

export async function geminiGenerate(opts: {
  model: string;
  prompt: string;
  system?: string;
  json?: boolean;
  images?: ImageInput[];
}): Promise<{ text: string; usage?: { inputTokens?: number; outputTokens?: number } }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiNotConfiguredError("GEMINI_API_KEY");

  const parts: unknown[] = [{ text: opts.prompt }];
  for (const img of opts.images ?? []) {
    const data = img.base64.replace(/^data:[^;]+;base64,/, "");
    parts.push({ inline_data: { mime_type: img.mimeType, data } });
  }

  const body: Record<string, unknown> = {
    contents: [{ parts }],
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  if (opts.json) body.generationConfig = { responseMimeType: "application/json" };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": key },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${opts.model} failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const outParts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = outParts.map((p: { text?: string }) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned empty response");
  return {
    text,
    usage: {
      inputTokens: data?.usageMetadata?.promptTokenCount,
      outputTokens: data?.usageMetadata?.candidatesTokenCount,
    },
  };
}
